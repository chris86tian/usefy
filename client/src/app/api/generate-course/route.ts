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
  rawStartTime: number; // Raw seconds for internal processing
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

    console.log("📜 Fetched Vimeo transcript successfully.");
    
    // Parse WebVTT format with improved handling
    const segments = parseVTT(transcriptData);
    
    // Format the segments with precise timestamps
    return segments.map(segment => ({
      text: segment.text,
      startTime: formatVimeoTimestamp(segment.startTime),
      duration: (segment.endTime - segment.startTime),
      rawStartTime: segment.startTime  // Store raw time for sorting/processing
    }));
  } catch (error) {
    console.log("❌ Error fetching Vimeo transcript:", error);
    throw new Error(`Failed to fetch Vimeo transcript: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Enhanced WebVTT parser with better text handling
function parseVTT(vtt: string) {
  const lines = vtt.split('\n');
  const segments: { startTime: number; endTime: number; text: string }[] = [];
  
  let currentSegment: { startTime: number; endTime: number; text: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and WebVTT header
    if (!line || line === 'WEBVTT') continue;
    
    // Check if this is a timestamp line
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.?\d{0,3}) --> (\d{2}:\d{2}:\d{2}\.?\d{0,3})/);
    
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
    } else if (currentSegment && line && !line.match(/^\d+$/)) { // Skip identifier numbers
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
  
  // Clean and normalize text in segments
  segments.forEach(segment => {
    segment.text = segment.text
      .replace(/\s+/g, ' ')                   // Normalize whitespace
      .replace(/\[.*?\]/g, '')                // Remove any bracket annotations
      .replace(/>>|-->/g, '')                 // Remove any dialogue markers
      .replace(/^[\s\:.,;!?]+|[\s\:.,;!?]+$/g, ''); // Trim punctuation at edges
  });
  
  return segments;
}

// Improved timestamp parsing for Vimeo (HH:MM:SS.mmm) to seconds
function parseVimeoTimestamp(timestamp: string): number {
  // Handle potential missing milliseconds
  if (!timestamp.includes('.')) {
    timestamp += '.000';
  }
  
  const parts = timestamp.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const secondsAndMillis = parts[2].split('.');
  const seconds = parseInt(secondsAndMillis[0]);
  const milliseconds = secondsAndMillis[1] ? parseInt(secondsAndMillis[1].padEnd(3, '0')) : 0;
  
  return hours * 3600 + minutes * 60 + seconds + (milliseconds / 1000);
}

// Precise formatter for Vimeo timestamp (HH:MM:SS)
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
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Vimeo video details: ${response.statusText}`)
    }
    
    const data = await response.json()

    return {
      title: data.name,
      description: data.description,
      duration: data.duration, // Duration in seconds
    }
  } catch (error) {
    console.error("❌ Error fetching Vimeo video details:", error)
    return null
  }
}

// Format timestamp from milliseconds to HH:MM:SS
function formatTimestamp(milliseconds: number): string {
  try {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
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
    let videoDuration = 0

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
        
        // Sort by timestamp to ensure proper ordering
        transcriptSegments.sort((a, b) => {
          if ('rawStartTime' in a && 'rawStartTime' in b) {
            return a.rawStartTime - b.rawStartTime;
          }
          return 0;
        });
        
        transcript = transcriptSegments.map(segment => `${segment.text}`).join(" ")
        
        // Get video details from Vimeo
        const videoDetails = await getVimeoVideoDetails(videoId)
        videoTitle = videoDetails?.title || "Vimeo Video"
        videoDescription = videoDetails?.description || "No description available"
        videoDuration = videoDetails?.duration || 0
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

    console.log(`📜 Processed transcript with ${transcriptSegments.length} segments`)
    
    // Format transcript for OpenAI with precise timestamps
    const formattedTranscript = transcriptSegments.map(segment => {
      if ('offset' in segment) {
        return `[${formatTimestamp(segment.offset)}] ${segment.text}`
      } else if ('startTime' in segment) {
        return `[${segment.startTime}] ${segment.text}`
      }
      return '';
    }).join("\n")

    // Enhanced prompt for course creation with exact timestamps
    const systemPrompt = `You are an expert educational content creator who specializes in creating well-structured courses from video transcripts.

Your task is to analyze the transcript and create a detailed course with cohesive sections and meaningful chapters.

EXTREMELY IMPORTANT: 
1. For each chapter, you MUST use the EXACT timestamps from the transcript. Do not approximate or estimate timestamps.
2. Use the precise timestamp that appears in the transcript where the topic for that chapter begins.
3. Look for natural transitions and topic changes in the transcript to determine key moments for new chapters.
4. Each timestamp must be in the exact HH:MM:SS format and be taken directly from the transcript.

Ensure that the response is formatted as a **valid JSON object** with no markdown formatting.

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
          "timestamp": "HH:MM:SS", // CRITICAL: Use the EXACT timestamp from the transcript where this topic begins
          ${generateQuizzes
            ? `
          "quiz": {
            "questions": [
              {
                "question": "string",
                "difficulty": "easy|medium|hard",
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
}`;

    // Generate course content with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `I have a ${videoSource === "youtube" ? "YouTube" : "Vimeo"} video transcript that I want to turn into a structured course.

Video Title: ${videoTitle}
Video Description: ${videoDescription}
${videoDuration ? `Video Duration: ${formatVimeoTimestamp(videoDuration)}` : ''}

Transcript:
${formattedTranscript}

Please analyze this transcript and create a well-structured course with:
1. A concise but descriptive course title that captures the essence of the content
2. 2-4 logical sections based on major themes in the content
3. 5-8 chapters across all sections with highly specific titles
4. CRITICAL: For each chapter, use the EXACT timestamp from the transcript where that topic begins
5. Detailed content explaining key concepts and insights from each chapter
${generateQuizzes
  ? "6. Include 5 well-designed multiple-choice questions for each chapter that test understanding of key concepts"
  : ""
}
${generateAssignments
  ? `7. Include practical assignments for each chapter that allow students to apply what they've learned${codingAssignments ? ` through coding exercises in ${language}` : ""}`
  : ""
}

IMPORTANT REMINDER: The timestamps must be extracted EXACTLY as they appear in the transcript. Don't invent timestamps - use the actual ones that mark where each topic begins.`,
        },
      ],
      temperature: 0.5, // Lower temperature for more precise outputs
      max_tokens: 4000,
    })

    console.log("✅ Received response from OpenAI")

    const content = completion.choices[0].message.content

    try {
      // Extract JSON from the content (in case there's markdown or other text)
      const jsonMatch = content?.match(/```json\n([\s\S]*?)\n```/) || content?.match(/```([\s\S]*?)```/) || [null, content]
      const jsonContent = jsonMatch[1] || content || '{}'

      // Validate and parse JSON content
      const parsedContent = JSON.parse(jsonContent)

      // Extract title and description
      const courseTitle = parsedContent.courseTitle || "Generated Course"
      const courseDescription = parsedContent.courseDescription || "Course generated from video content"

      // Extract sections
      const sections = parsedContent.sections || []

      // Validate timestamps
      sections.forEach((section: Section) => {
        section.chapters.forEach((chapter: Chapter | undefined) => {
          // Ensure timestamp is in HH:MM:SS format
          if (!chapter?.timestamp?.match(/^\d{2}:\d{2}:\d{2}$/)) {
            console.warn(`⚠️ Invalid timestamp format detected: ${chapter?.timestamp}, fixing...`);
            if (chapter?.timestamp) {
              chapter.timestamp = formatTimestamp(parseVimeoTimestamp(chapter.timestamp))
            }
          }
        });
      });

      return NextResponse.json({
        sections,
        courseTitle,
        courseDescription,
        totalSegments: transcriptSegments.length,
      })
    } catch (error) {
      console.error("❌ Error parsing OpenAI response:", error)
      return NextResponse.json(
        {
          error: "Failed to generate course content",
          details: "The AI model returned an invalid response. Please try again.",
          rawResponse: content
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