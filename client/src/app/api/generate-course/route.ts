import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";
import { console } from "inspector";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
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
    const { videoUrl, generateQuizzes, generateAssignments, codingAssignments, language } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
    }

    const videoId = extractVideoId(videoUrl)

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    let transcript
    try {
      transcript = await fetchCaptionsAndTranscript(videoId)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Could not get video transcript",
          details:
            "This video might have disabled captions or requires authentication. Please try another video with public captions enabled.",
        },
        { status: 400 },
      )
    }

    const formattedTranscript = transcript.map(({ text, offset }) => `[${formatTimestamp(offset)}] ${text}`).join("\n")

    const targetSegments = 6
    const keyTimestamps = findKeyMoments(transcript, targetSegments)

    const systemPrompt = `You are a course creator. Create a structured course outline based on the provided transcript. Make sure to process the entire transcript. The response must be a valid JSON object. The transcript for the video is as follows:
    ${formattedTranscript}
    ${generateQuizzes ? "Include quiz questions for each chapter." : "Do not include quiz questions."}
    ${generateAssignments ? `Include assignments for each chapter. ${codingAssignments ? `Make sure the assignments are coding-related and use ${language}.` : ""}` : "Do not include assignments."}`

    const userPrompt = `Create a well-structured course outline with at least 2 sections and at least 2 chapters each. Every chapter must have a video timestamp.
    ${generateQuizzes ? "Include 5 quiz questions per chapter." : ""}
    ${generateAssignments ? `Include 1 assignment per chapter. ${codingAssignments ? `Make it a coding assignment in ${language}. Make sure to provide starter code with the main function and sample test cases.` : ""}` : ""}

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
              ${
                generateQuizzes
                  ? `
              "quiz": {
                "quizId": "q1",
                "questions": [
                  {
                    "questionId": "q1",
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
              ${
                generateAssignments
                  ? `
              "assignments": [
                {
                  "assignmentId": "a1",
                  "title": "string",
                  "description": "string",
                  "submissions": [],
                  ${
                    codingAssignments
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
    }`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" },
    })

    const content = completion?.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 500 })
    }

    console.log("📚 Generated course structure:", content)

    let courseStructure
    try {
      courseStructure = JSON.parse(content)
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON response from OpenAI",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    if (!courseStructure.sections || !Array.isArray(courseStructure.sections)) {
      return NextResponse.json(
        {
          error: "Invalid course structure: missing or invalid sections array",
        },
        { status: 500 },
      )
    }

    let timestampIndex = 0
    courseStructure.sections.forEach((section: Section) => {
      if (!section.chapters || !Array.isArray(section.chapters)) {
        throw new Error(`Invalid section structure: missing or invalid chapters array`)
      }

      section.chapters.forEach((chapter: Chapter) => {
        const timestamp = keyTimestamps[timestampIndex] || 0
        chapter.video = `https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`
        timestampIndex++

        if (chapter.assignments) {
          chapter.assignments.forEach((assignment: Assignment) => {
            if (codingAssignments) {
              assignment.isCoding = true
              assignment.language = language
              assignment.starterCode = assignment.starterCode || `# Your ${language} code here`
            } else {
              assignment.isCoding = false
            }
          })
        }
      })
    })
    
    return NextResponse.json(courseStructure)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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
