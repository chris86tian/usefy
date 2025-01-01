import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    try {
      // Fetch transcript with timestamps
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      // Format transcript to include timestamps
      const formattedTranscript = transcript
        .map(({ text, offset }) => `[${formatTimestamp(offset)}] ${text}`)
        .join("\n");

      // Generate course structure using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert course creator who excels at organizing educational content into logical sections and chapters. 
            Given a video transcript, create a well-structured course outline.
            
            For each major topic in the video, create a section with:
            - A clear, descriptive title
            - A brief overview of what will be covered
            
            For each subtopic, create a chapter with:
            - A specific, focused title
            - Detailed content summarizing the key points
            - The exact timestamp from the transcript where this content begins
            
            Ensure the content is educational, well-organized, and maintains a logical flow.`,
          },
          {
            role: "user",
            content: `Please analyze this video transcript and create a course structure. 
            Return the response in this exact JSON format:
            {
              "courseTitle": "string",
              "courseDescription": "string",
              "sections": [
                {
                  "sectionId": "string",
                  "sectionTitle": "string",
                  "sectionDescription": "string",
                  "chapters": [
                    {
                      "chapterId": "string",
                      "title": "string",
                      "content": "string",
                      "type": "string (e.g. 'Video')",
                      "video": "string (original URL with timestamp: https://www.youtube.com/watch?v=<VIDEO_ID>&t=<START_TIME>s)"
                    }
                  ]
                }
              ]
            }

            Video URL: ${videoUrl}
            Transcript:
            ${formattedTranscript}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      // Sanitize and parse the response
      const sanitizedContent = sanitizeJSON(completion.choices[0].message.content || "{}");
      const courseStructure = JSON.parse(sanitizedContent);

      // Process the parsed course structure
      courseStructure.sections.forEach((section: { chapters: { content: string; videoUrl: string; }[]; }) => {
        section.chapters.forEach((chapter: { content: string; videoUrl: string; }) => {
          const startTime = extractTimestamp(chapter.content);
          chapter.videoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${startTime}s`;
        });
      });

      return NextResponse.json(courseStructure);
    } catch (error) {
      console.error("Error processing video:", error);
      return NextResponse.json(
        { error: "Failed to process video transcript" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function sanitizeJSON(response: string): string {
  const jsonMatch = response.match(/{[\s\S]*}/); // Match content within `{}` braces
  return jsonMatch ? jsonMatch[0] : "{}";
}

// Helper function to format timestamp from seconds to [mm:ss]
function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Helper function to extract timestamp from formatted string
function extractTimestamp(content: string): number {
  const timestampMatch = content.match(/\[(\d+):(\d{2})\]/); // Matches [mm:ss]
  if (timestampMatch) {
    const minutes = parseInt(timestampMatch[1], 10);
    const seconds = parseInt(timestampMatch[2], 10);
    return minutes * 60 + seconds; // Convert to total seconds
  }
  return 0; // Default to 0 if no timestamp is found
}

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  runtime: "edge",
};
