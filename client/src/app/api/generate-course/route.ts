import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function getTranscriptWithRetries(
  videoId: string,
  maxRetries = 3
): Promise<any[]> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const options = i === 0 ? undefined : { lang: "en" };
      const transcript = await YoutubeTranscript.fetchTranscript(
        videoId,
        options
      );

      if (transcript && transcript.length > 0) {
        return transcript;
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(
    `Failed to fetch transcript after ${maxRetries} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
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
      transcript = await getTranscriptWithRetries(videoId);
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
      console.error("Empty response from OpenAI");
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 500 }
      );
    }

    let courseStructure;
    try {
      courseStructure = JSON.parse(content);
    } catch (parseError) {
      try {
        const cleanedContent = content
          .replace(/```json\n?|```\n?/g, "")
          .trim()
          .replace(/^\s*[\r\n]/gm, "");
        courseStructure = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        console.error("JSON parsing error:", secondParseError);
        console.error("Raw content:", content);
        return NextResponse.json(
          {
            error: "Invalid JSON response from OpenAI",
            details:
              secondParseError instanceof Error
                ? secondParseError.message
                : "Unknown error",
          },
          { status: 500 }
        );
      }
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
    console.error("Route error:", error);
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
