import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface Section {
  sectionId: string;
  sectionTitle: string;
  sectionDescription: string;
  chapters: Chapter[];
}

interface Chapter {
  chapterId: string;
  title: string;
  content: string;
  type: string;
  video: string;
  quiz: {
    questions: {
      question: string;
      difficulty: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

async function fetchCaptionsAndTranscript(videoId: string) {
  try {
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const videoData = await videoResponse.json();

    if (!videoData.items?.length) {
      throw new Error("Video not found or is private");
    }

    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const captionsData = await captionsResponse.json();

    if (!captionsResponse.ok) {
      throw new Error(
        captionsData.error?.message || "Failed to fetch captions"
      );
    }

    const captionTrack =
      captionsData.items?.find((item: any) => item.snippet.language === "en") ||
      captionsData.items?.[0];
    if (captionTrack) {
    } else {
      console.log("⚠️ No caption track found");
    }

    if (!captionTrack) {
      throw new Error("No captions available for this video");
    }

    const transcriptResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const html = await transcriptResponse.text();

    const transcriptMatches = html.match(/"text":"([^"]+)"/g) || [];
    const timestampMatches = html.match(/"start":"([^"]+)"/g) || [];
    console.log("📊 Found matches:", {
      transcriptMatchesCount: transcriptMatches.length,
      timestampMatchesCount: timestampMatches.length,
    });

    const transcript: TranscriptSegment[] = transcriptMatches.map(
      (match, index) => {
        const text = match.match(/"text":"([^"]+)"/)?.[1] || "";
        const offset = parseInt(
          timestampMatches[index]?.match(/"start":"(\d+)"/)?.[1] || "0"
        );

        return {
          text: text.replace(/\\n/g, " ").replace(/\\"/g, '"'),
          offset,
          duration: 5000,
        };
      }
    );

    if (transcript.length === 0) {
      throw new Error("Could not extract transcript from video");
    }

    return transcript;
  } catch (error) {
    throw error;
  }
}

function findKeyMoments(
  transcript: TranscriptSegment[],
  targetSegments: number
): number[] {
  const totalDuration = transcript.reduce(
    (sum, segment) => sum + (segment.duration || 0),
    0
  );
  const allWords = transcript.map(
    (segment) => segment.text.split(/\s+/).length
  );
  const totalWords = allWords.reduce((sum, count) => sum + count, 0);

  const keyTimestamps: number[] = [0];
  const targetWordsPerSegment = totalWords / targetSegments;

  let currentWordCount = 0;
  let segmentCount = 1;

  for (let i = 0; i < transcript.length; i++) {
    const wordCount = allWords[i];
    currentWordCount += wordCount;

    if (
      currentWordCount >= targetWordsPerSegment * segmentCount &&
      segmentCount < targetSegments
    ) {
      let breakPoint = i;
      for (
        let j = Math.max(0, i - 2);
        j <= Math.min(transcript.length - 1, i + 2);
        j++
      ) {
        if (transcript[j].text.match(/[.!?]$/)) {
          breakPoint = j;
          break;
        }
      }

      keyTimestamps.push(transcript[breakPoint].offset);
      segmentCount++;
    }
  }

  while (keyTimestamps.length < targetSegments) {
    const segmentSize = Math.floor(totalDuration / targetSegments);
    const nextTimestamp = segmentSize * keyTimestamps.length;
    keyTimestamps.push(nextTimestamp);
  }

  return Array.from(new Set(keyTimestamps)).sort((a, b) => a - b);
}

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    let transcript;
    try {
      transcript = await fetchCaptionsAndTranscript(videoId);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Could not get video transcript",
          details:
            "This video might have disabled captions or requires authentication. Please try another video with public captions enabled.",
        },
        { status: 400 }
      );
    }

    const formattedTranscript = transcript
      .map(({ text, offset }) => `[${formatTimestamp(offset)}] ${text}`)
      .join("\n");

    const targetSegments = 6;
    const keyTimestamps = findKeyMoments(transcript, targetSegments);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a course creator. Create a structured course outline based on the provided transcript. Make sure to process the entire transcript. The response must be a valid JSON object.",
        },
        {
          role: "user",
          content: `Create a well-structured course outline with at least 2 sections and at least 2 chapters each. Every chapter must have a video timestamp and 10 quiz questions.
    
          Format:
          {
            "courseTitle": "string",
            "courseDescription": "string",
            "sections": [
              {
                "sectionId": "s1",
                "sectionTitle": "string",
                "sectionDescription": "string",
                "chapters": [
                  {
                    "chapterId": "c1",
                    "title": "string",
                    "content": "string",
                    "type": "Video",
                    "video": "${videoUrl}",
                    "quiz": {
                      "questions": [
                        {
                          "question": "string",
                          "difficulty": "easy",
                          "options": ["string", "string", "string", "string"],
                          "correctAnswer": 0
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
    
          Transcript: ${formattedTranscript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" },
    });
    const content = completion?.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 500 }
      );
    }

    let courseStructure;
    try {
      courseStructure = JSON.parse(content);

      courseStructure = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON response from OpenAI",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    if (!courseStructure.sections || !Array.isArray(courseStructure.sections)) {
      return NextResponse.json(
        {
          error: "Invalid course structure: missing or invalid sections array",
        },
        { status: 500 }
      );
    }

    let timestampIndex = 0;
    courseStructure.sections.forEach((section: Section) => {
      if (!section.chapters || !Array.isArray(section.chapters)) {
        throw new Error(
          `Invalid section structure: missing or invalid chapters array`
        );
      }

      section.chapters.forEach((chapter) => {
        const timestamp = keyTimestamps[timestampIndex] || 0;
        chapter.video = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`;
        timestampIndex++;
      });
    });

    return NextResponse.json(courseStructure);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
  runtime: "nodejs",
};
