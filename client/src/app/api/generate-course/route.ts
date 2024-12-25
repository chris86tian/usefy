import { NextResponse } from "next/server";
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import { extractVideoId } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    try {
      // Fetch transcript with timestamps
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      const formattedTranscript = transcript
        .map(t => `[${formatTimestamp(t.offset)}] ${t.text}`)
        .join('\n');

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
            
            Ensure the content is educational, well-organized, and maintains a logical flow.`
          },
          {
            role: "user",
            content: `Please analyze this video transcript and create a course structure. 
            Return the response in this exact JSON format:
            {
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
                            "type: "string (e.g. 'Video')",
                            "video": "string (original URL with timestamp: https://www.youtube.com/watch?v=<VIDEO_ID>&t=<START_TIME>s)"
                        }
                    ]
                }
              ]
            }

            Video URL: ${videoUrl}
            Transcript:
            ${formattedTranscript}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      // Parse the response
      const courseStructure = JSON.parse(completion.choices[0].message.content || '{}');

      // Add timestamps to video URLs
        courseStructure.sections.forEach((section: { title: string; description: string; chapters: { title: string; content: string; videoUrl: string; }[]; }) => {
            section.chapters.forEach((chapter: { title: string; content: string; videoUrl: string; }) => {
            const startTime = extractTimestamp(chapter.content);
            chapter.videoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${startTime}s`;
            });
        });

      return NextResponse.json(courseStructure);

    } catch (error) {
      console.error('Error processing video:', error);
      return NextResponse.json(
        { error: 'Failed to process video transcript' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format timestamp from milliseconds to seconds
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to extract timestamp from formatted string
function extractTimestamp(url: string): number {
  const timestampMatch = url.match(/\[(\d+):(\d+)\]/);
  if (timestampMatch) {
    const minutes = parseInt(timestampMatch[1]);
    const seconds = parseInt(timestampMatch[2]);
    return minutes * 60 + seconds;
  }
  return 0;
}

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  runtime: 'edge',
};