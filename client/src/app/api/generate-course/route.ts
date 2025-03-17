import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";
import { console } from "inspector";
import { YoutubeTranscript } from "youtube-transcript";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

async function fetchCaptionsAndTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    // 🔹 Step 1: Try YouTube API first
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const captionsData = await captionsResponse.json();

    if (captionsData.items?.length) {
      console.log("✅ Captions found using YouTube API.");
      return await processTranscriptUsingAPI(videoId);
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

    return transcript.map((segment: any) => ({
      text: segment.text,
      offset: segment.offset,
      duration: segment.duration || 5000,
    }));
  } catch (error) {
    console.log("❌ Error fetching transcript:", error);
    throw error;
  }
}

async function processTranscriptUsingAPI(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcriptResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await transcriptResponse.text();

    const transcriptMatches = html.match(/"text":"([^"]+)"/g) || [];
    const timestampMatches = html.match(/"start":"([^"]+)"/g) || [];

    console.log("📊 Found matches:", {
      transcriptMatchesCount: transcriptMatches.length,
      timestampMatchesCount: timestampMatches.length,
    });

    const transcript: TranscriptSegment[] = transcriptMatches.map((match, index) => {
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
      console.log("📜 Transcript:", transcript)
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

    console.log("📜 Transcript:", transcript)

    const formattedTranscript = transcript.map(({ text, offset }) => `[${formatTimestamp(offset)}] ${text}`).join("\n")

    const targetSegments = 6
    const keyTimestamps = findKeyMoments(transcript, targetSegments)

    const systemPrompt = `You are an expert course creator specializing in structured learning experiences. Based on the provided transcript, generate a detailed and structured course outline in JSON format. The response must be a valid JSON object. 
    Instructions:
    - Process the entire transcript carefully.
    - Create a well-structured course outline with at least one section per major topic in the transcript, each seciton containing multiple chapters.
    - Each chapter must include a relevant video timestamp.

    Additional Content:
    - ${generateQuizzes ? "Include 5 well-thought-out quiz questions per chapter." : "Do not include quiz questions."}
    - ${generateAssignments ? `Include at least one assignment per chapter.${codingAssignments ? ` Ensure that assignments are coding-related and written in ${language}. Each coding assignment must include:` : ""}` : "Do not include assignments."}

    For coding assignments, ensure:
    - The problem statement is clear and relevant to the chapter.
    - Provide starter code with a function signature and TODO comments.
    - Include sample test cases for correctness.

    The final response must be a valid JSON object.
    `

    const userPrompt = `Generate a well-structured course outline with at least one section per major topic of the video, each section containing multiple chapters. Each chapter must have a video timestamp.
    Additional Requirements:
    - ${generateQuizzes ? "Include exactly 5 quiz questions per chapter, ensuring they align with the chapter content." : ""}
    - ${generateAssignments ? `Each chapter must include at least 1 assignment. ${codingAssignments ? `Ensure coding assignments are written in ${language}. Each coding assignment must:` : ""}` : ""}

    For coding assignments:
    1. Clearly define the problem statement.
    2. Provide starter code that includes:
      - A function signature.
      - The main function structure with TODO comments.
      - At least 3 sample test cases.
    3. Ensure that the problem difficulty increases gradually.
    4. The assignment must align with the course content.

    Ensure that the response is formatted as a **valid JSON object**.

    Format:
    {
      "courseTitle": "string",
      "courseDescription": "string",
      "sections": [
        {
          "sectionId": "s1",
          "sectionTitle": "string",
          "sectionDescription": "string",
          "releaseDate": "",
          "chapters": [
            {
              "chapterId": "c1",
              "title": "string",
              "content": "string",
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
    }
    
    Transcription:
    ${formattedTranscript}
    `

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
