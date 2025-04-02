import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";
import { YoutubeTranscript } from "youtube-transcript";
import fetch from "node-fetch";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;

// YouTube-specific transcript segment
interface YouTubeTranscriptSegment {
  text: string;
  offset: number;  // milliseconds
  duration: number;
}

// Vimeo-specific transcript segment
interface VimeoTranscriptSegment {
  text: string;
  startTime: string;  // Original timestamp format (HH:MM:SS)
  duration: number;   // seconds
}

async function fetchYouTubeTranscript(videoId: string): Promise<YouTubeTranscriptSegment[]> {
  try {
    // 🔹 Step 1: Try YouTube API first
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const captionsData = await captionsResponse.json();

    console.log("🔍 Fetched captions data:", captionsData);
    if (captionsData.items?.length) {
      console.log("✅ Captions found using YouTube API.");
      return await processYouTubeTranscriptUsingAPI(videoId);
    } else {
      console.log("⚠️ No captions found via YouTube API, trying fallback...");
    }

    // 🔹 Step 2: Fallback to `youtube-transcript` if API fails
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("📜 Fetched transcript:", transcript);

    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available for this video");
    }

    console.log("✅ Transcript retrieved using fallback method!");

    return transcript.map((segment: YouTubeTranscriptSegment) => ({
      text: segment.text,
      offset: segment.offset,
      duration: segment.duration || 5000,
    }));
  } catch (error) {
    console.log("❌ Error fetching transcript:", error);
    throw error;
  }
}

async function fetchVimeoTranscript(videoId: string): Promise<VimeoTranscriptSegment[]> {
  try {
    if (!VIMEO_ACCESS_TOKEN) {
      throw new Error("Vimeo access token is not configured");
    }

    // Fetch video details to get available text tracks
    const videoResponse = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch Vimeo video: ${videoResponse.statusText}`);
    }

    const videoData = await videoResponse.json();

    // Fetch text tracks (captions/subtitles)
    const textTracksResponse = await fetch(`https://api.vimeo.com/videos/${videoId}/texttracks`, {
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    });

    if (!textTracksResponse.ok) {
      throw new Error(`Failed to fetch Vimeo text tracks: ${textTracksResponse.statusText}`);
    }

    const textTracksData = await textTracksResponse.json();
    
    if (!textTracksData.data || textTracksData.data.length === 0) {
      throw new Error("No transcript available for this Vimeo video");
    }

    // Get the first available text track
    const textTrack = textTracksData.data[0];
    
    // Fetch the actual transcript content
    const transcriptResponse = await fetch(textTrack.link, {
      headers: {
        'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`
      }
    });

    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch Vimeo transcript: ${transcriptResponse.statusText}`);
    }

    const transcriptData = await transcriptResponse.text();

    console.log("📜 Fetched transcript:", transcriptData);
    
    // Parse WebVTT format
    const segments = parseVTT(transcriptData);
    
    // Format the segments with proper timestamps
    return segments.map(segment => ({
      text: segment.text,
      startTime: formatVimeoTimestamp(segment.startTime),
      duration: (segment.endTime - segment.startTime)
    }));
  } catch (error) {
    console.log("❌ Error fetching Vimeo transcript:", error);
    return [];
  }
}

// Parse WebVTT format
function parseVTT(vtt: string) {
  const lines = vtt.split('\n');
  const segments: { startTime: number; endTime: number; text: string }[] = [];
  
  let currentSegment: { startTime: number; endTime: number; text: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and WebVTT header
    if (!line || line === 'WEBVTT') continue;
    
    // Check if this is a timestamp line
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    
    if (timestampMatch) {
      // If we already have a segment, push it before creating a new one
      if (currentSegment) {
        segments.push(currentSegment);
      }
      
      // Parse timestamps to seconds
      const startTime = parseVimeoTimestamp(timestampMatch[1]);
      const endTime = parseVimeoTimestamp(timestampMatch[2]);
      
      currentSegment = {
        startTime,
        endTime,
        text: ''
      };
    } else if (currentSegment && line) {
      // Add text to current segment
      if (currentSegment.text) {
        currentSegment.text += ' ' + line;
      } else {
        currentSegment.text = line;
      }
    }
  }
  
  // Add the last segment
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}

// Parse Vimeo timestamp (HH:MM:SS.mmm) to seconds
function parseVimeoTimestamp(timestamp: string): number {
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const secondsAndMillis = parts[2].split('.');
  const seconds = parseInt(secondsAndMillis[0]);
  const milliseconds = parseInt(secondsAndMillis[1]);
  
  return hours * 3600 + minutes * 60 + seconds + (milliseconds / 1000);
}

// Format seconds to Vimeo timestamp format (HH:MM:SS)
function formatVimeoTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function processYouTubeTranscriptUsingAPI(videoId: string): Promise<YouTubeTranscriptSegment[]> {
  try {
    const transcriptResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await transcriptResponse.text();

    const transcriptMatches = html.match(/"text":"([^"]+)"/g) || [];
    const timestampMatches = html.match(/"start":"([^"]+)"/g) || [];

    console.log("📊 Found matches:", {
      transcriptMatchesCount: transcriptMatches.length,
      timestampMatchesCount: timestampMatches.length,
    });

    const transcript: YouTubeTranscriptSegment[] = transcriptMatches.map((match, index) => {
      const text = match.match(/"text":"([^"]+)"/)?.[1] || "";
      const offset = parseInt(timestampMatches[index]?.match(/"start":"(\d+)"/)?.[1] || "0");

      return {
        text: text.replace(/\\n/g, " ").replace(/\\"/g, '"'),
        offset,
        duration: 5000,
      };
    });

    if (transcript.length === 0) {
      throw new Error("Could not extract transcript from video");
    }

    return transcript;
  } catch (error) {
    console.error("❌ Error extracting transcript from YouTube page:", error);
    throw error;
  }
}

// Helper functions for fetching video details
async function getYouTubeVideoDetails(videoId: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error("❌ YouTube API key is not set")
      return null
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
    )
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet
      return {
        title: snippet.title,
        description: snippet.description,
      }
    }
    return null
  } catch (error) {
    console.error("❌ Error fetching YouTube video details:", error)
    return null
  }
}

async function getVimeoVideoDetails(videoId: string) {
  try {
    const accessToken = process.env.VIMEO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("❌ Vimeo access token is not set")
      return null
    }

    const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = await response.json()

    return {
      title: data.name,
      description: data.description,
    }
  } catch (error) {
    console.error("❌ Error fetching Vimeo video details:", error)
    return null
  }
}

function findKeyMoments(
  transcript: (YouTubeTranscriptSegment | VimeoTranscriptSegment)[],
  targetSegments: number
): number[] {
  if (!transcript || transcript.length === 0) {
    return [];
  }

  // Always include the first segment
  const keyTimestamps: number[] = [0];
  
  if (transcript.length <= targetSegments) {
    // If we have fewer segments than target, include all of them
    return Array.from({ length: transcript.length }, (_, i) => i);
  }
  
  // Calculate segment size to distribute evenly
  const segmentSize = Math.floor(transcript.length / (targetSegments - 1));
  
  // Add evenly distributed segments
  for (let i = 1; i < targetSegments; i++) {
    const index = i * segmentSize;
    if (index < transcript.length) {
      keyTimestamps.push(index);
    }
  }

  return Array.from(new Set(keyTimestamps)).sort((a, b) => a - b);
}

// Extract timestamps from YouTube transcript segments
function extractTimestampsFromYouTubeTranscript(
  transcript: YouTubeTranscriptSegment[],
  targetSegments: number = 6
): string[] {
  if (!transcript.length) return [];
  
  // Find key moments in the transcript
  const keyMoments = findKeyMoments(transcript, targetSegments);
  
  // Extract timestamps at key moments
  const timestamps: string[] = [];
  
  // Validate indices and extract timestamps
  for (const momentIndex of keyMoments) {
    if (momentIndex >= 0 && momentIndex < transcript.length) {
      const segment = transcript[momentIndex];
      timestamps.push(formatTimestamp(segment.offset));
    }
  }
  
  // If we couldn't extract any timestamps, create some evenly distributed ones
  if (timestamps.length === 0 && transcript.length > 0) {
    const totalDuration = transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration;
    const segmentDuration = totalDuration / (targetSegments + 1);
    
    for (let i = 1; i <= targetSegments; i++) {
      timestamps.push(formatTimestamp(Math.floor(segmentDuration * i)));
    }
  }
  
  return timestamps;
}

// Extract timestamps from Vimeo transcript segments
function extractTimestampsFromVimeoTranscript(
  transcript: VimeoTranscriptSegment[],
  targetSegments: number = 6
): string[] {
  if (!transcript.length) return [];
  
  // Find key moments in the transcript
  const keyMoments = findKeyMoments(transcript, targetSegments);
  
  // Extract timestamps at key moments
  const timestamps: string[] = [];
  
  // Validate indices and extract timestamps
  for (const momentIndex of keyMoments) {
    if (momentIndex >= 0 && momentIndex < transcript.length) {
      const segment = transcript[momentIndex];
      timestamps.push(segment.startTime);
    }
  }
  
  // If we couldn't extract any timestamps, create some evenly distributed ones
  if (timestamps.length === 0 && transcript.length > 0) {
    // For Vimeo, we'll create evenly distributed timestamps
    const segmentDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0) / targetSegments;
    let currentTime = 0;
    
    for (let i = 0; i < targetSegments; i++) {
      currentTime += segmentDuration;
      timestamps.push(formatVimeoTimestamp(currentTime));
    }
  }
  
  return timestamps;
}

function formatTimestamp(milliseconds: number): string {
  try {
    if (isNaN(milliseconds) || milliseconds < 0) {
      console.warn("⚠️ Invalid milliseconds value for timestamp:", milliseconds);
      milliseconds = 0;
    }
    
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } catch (error) {
    console.error("❌ Error formatting timestamp:", error);
    return "00:00:00";
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
  runtime: "nodejs",
};


export async function POST(request: Request) {
  try {
    const { videoUrl, videoSource = "youtube", generateQuizzes, generateAssignments, codingAssignments, language } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

    const videoId = extractVideoId(videoUrl, videoSource as "youtube" | "vimeo")

    if (!videoId) {
      return NextResponse.json({ error: `Invalid ${videoSource === "youtube" ? "YouTube" : "Vimeo"} URL` }, { status: 400 })
    }

    let transcript = ""
    let transcriptSegments: (YouTubeTranscriptSegment | VimeoTranscriptSegment)[] = []
    let videoTitle = ""
    let videoDescription = ""

    if (videoSource === "youtube") {
      // Fetch transcript from YouTube
      try {
        transcriptSegments = await fetchYouTubeTranscript(videoId)
        transcript = transcriptSegments.map(segment => `${segment.text}`).join(" ")
        
        // Get video details from YouTube
        const videoDetails = await getYouTubeVideoDetails(videoId)
        videoTitle = videoDetails?.title || "YouTube Video"
        videoDescription = videoDetails?.description || "No description available"
      } catch (error) {
        console.error("❌ Error fetching YouTube transcript:", error)
        return NextResponse.json(
          {
            error: "Failed to fetch YouTube transcript",
            details: error instanceof Error ? error.message : "Unknown error occurred",
          },
          { status: 500 },
        )
      }
    } else if (videoSource === "vimeo") {
      // Fetch transcript from Vimeo
      try {
        transcriptSegments = await fetchVimeoTranscript(videoId)
        transcript = transcriptSegments.map(segment => `${segment.text}`).join(" ")
        
        // Get video details from Vimeo
        const videoDetails = await getVimeoVideoDetails(videoId)
        videoTitle = videoDetails?.title || "Vimeo Video"
        videoDescription = videoDetails?.description || "No description available"
      } catch (error) {
        console.error("❌ Error fetching Vimeo transcript:", error)
        return NextResponse.json(
          {
            error: "Failed to fetch Vimeo transcript",
            details: error instanceof Error ? error.message : "Unknown error occurred",
          },
          { status: 500 },
        )
      }
    }

    console.log("📜 Transcript:", transcript)

    // Extract timestamps from transcript
    const targetSegments = 6
    let timestamps: string[] = [];
    if (videoSource === "youtube") {
      timestamps = extractTimestampsFromYouTubeTranscript(transcriptSegments as YouTubeTranscriptSegment[], targetSegments);
    } else if (videoSource === "vimeo") {
      timestamps = extractTimestampsFromVimeoTranscript(transcriptSegments as VimeoTranscriptSegment[], targetSegments);
    }
    console.log("⏱️ Extracted timestamps:", timestamps);
    
    // Format transcript for OpenAI
    const formattedTranscript = transcriptSegments.map(segment => {
      if ('offset' in segment) {
        return `[${formatTimestamp(segment.offset)}] ${segment.text}`
      } else if ('startTime' in segment) {
        return `[${segment.startTime}] ${segment.text}`
      }
    }).join("\n")

    // Generate course content with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a course creation assistant that helps create educational content from video transcripts.
          
Your task is to analyze the transcript and create a well-structured course with sections and chapters.

Ensure that the response is formatted as a **valid JSON object**.

Format:
{
  "courseTitle": "string",
  "courseDescription": "string",
  "sections": [
    {
      "sectionTitle": "string",
      "sectionDescription": "string",
      "chapters": [
        {
          "title": "string",
          "content": "string",
          "video": "${videoUrl}", // The full video URL for all chapters
          "timestamp": "00:00:00", // IMPORTANT: Use the exact timestamp from the transcript in HH:MM:SS format
          ${generateQuizzes
            ? `
          "quiz": {
            "questions": [
              {
                "question": "string",
                "difficulty": "easy",
                "options": ["string", "string", "string", "string"],
                "correctAnswer": 0
              }
            ]
          },
          `
            : ""
          }
          ${generateAssignments
            ? `
          "assignments": [
            {
              "title": "string",
              "description": "string",
              "submissions": [],
              ${codingAssignments
                ? `
              "isCoding": true,
              "language": "${language}",
              "starterCode": "# Your ${language} starter code here",
              `
                : ""
              }
              "hints": ["string"],
            }
          ],
          `
            : ""
          }
        }
      ]
    }
  ]
}`,
        },
        {
          role: "user",
          content: `I have a video transcript that I want to turn into a structured course.

Video Title: ${videoTitle || "Untitled Video"}
Video Description: ${videoDescription || "No description available"}

Transcript:
${formattedTranscript}

Please analyze this transcript and create a well-structured course with:
1. An appropriate course title and description
2. Logical sections based on the content
3. Chapters within each section
4. Each chapter should have detailed content explaining the key points
${generateQuizzes
  ? "5. Include quizzes for each chapter with multiple-choice questions to test understanding. Quiz should have 5 questions."
  : ""
}
${generateAssignments
  ? `6. Include assignments for each chapter that allow students to apply what they've learned${codingAssignments ? ` through coding exercises in ${language}` : ""}`
  : ""
}

Ensure that the response is a valid JSON object following the specified format.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    console.log("✅ Received response from OpenAI")

    const content = completion.choices[0].message.content

    try {
      // Extract JSON from the content (in case there's markdown or other text)
      const jsonMatch = content?.match(/```json\n([\s\S]*?)\n```/) || content?.match(/```([\s\S]*?)```/) || [null, content]
      const jsonContent = jsonMatch[1] || content || '{}'

      const parsedContent = JSON.parse(jsonContent)

      // Extract title and description
      const courseTitle = parsedContent.courseTitle || "Generated Course"
      const courseDescription = parsedContent.courseDescription || "Course generated from video content"

      // Extract sections
      const sections = parsedContent.sections || []
      
      // If this is YouTube, assign our extracted timestamps to the chapters
      if (videoSource === "youtube" && sections.length > 0) {
        let timestampIndex = 0;
        
        // Distribute timestamps across all chapters in all sections
        sections.forEach((section: Section) => {
          if (section.chapters && section.chapters.length > 0) {
            section.chapters.forEach((chapter) => {
              // Assign a timestamp if available, otherwise keep the existing one
              if (timestampIndex < timestamps.length) {
                chapter.timestamp = timestamps[timestampIndex++];
              }
            });
          }
        });
        
        console.log("⏱️ Applied extracted timestamps to chapters");
      }

      return NextResponse.json({
        sections,
        courseTitle,
        courseDescription,
      })
    } catch (error) {
      console.error("❌ Error parsing OpenAI response:", error)
      return NextResponse.json(
        {
          error: "Failed to generate course content",
          details: "The AI model returned an invalid response. Please try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Server error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}