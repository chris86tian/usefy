import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";
import { extractVideoId } from "@/lib/utils";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import * as tf from "@tensorflow/tfjs";

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

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    console.log(videoUrl, videoId);

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      console.log(transcript);
      const formattedTranscript = transcript
        .map(({ text, offset }) => `[${formatTimestamp(offset)}] ${text}`)
        .join("\n");

      const topicTimestamps = await extractTopicTimestamps(transcript);  

      // First, get a shorter response to test the structure
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a course creator. Respond only with a valid JSON object containing course information. Do not include any explanation, formatting, or markdown.`
          },
          {
            role: "user",
            content: `Create a course outline from this transcript. Include 3 questions per chapter.
            Format: 
            {
              "courseTitle": "string",
              "courseDescription": "string",
              "sections": [{
                "sectionId": "s1",
                "sectionTitle": "string",
                "sectionDescription": "string",
                "chapters": [{
                  "chapterId": "c1",
                  "title": "string",
                  "content": "string",
                  "type": "Video",
                  "video": "${videoUrl}",
                  "quiz": {
                    "questions": [{
                      "question": "string",
                      "difficulty": "easy",
                      "options": ["string", "string", "string", "string"],
                      "correctAnswer": 0
                    }]
                  }
                }]
              }]
            }

            Transcript: ${formattedTranscript.slice(0, 1000)}...`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      let courseStructure;
      try {
        const content = completion?.choices[0]?.message?.content;
        
        // Debug logging
        console.log("Raw OpenAI response:", content);
        
        if (!content) {
          console.error("Empty content from OpenAI");
          return NextResponse.json(
            { error: "Empty response from OpenAI" },
            { status: 500 }
          );
        }

        // Clean and validate content
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        console.log("Cleaned content:", cleanContent);

        if (!cleanContent) {
          console.error("Empty content after cleaning");
          return NextResponse.json(
            { error: "Empty content after cleaning" },
            { status: 500 }
          );
        }

        try {
          courseStructure = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error("Parse error with content:", cleanContent);
          console.error("Parse error details:", parseError);
          return NextResponse.json(
            { 
              error: "JSON Parse Error", 
              details: parseError,
              content: cleanContent
            },
            { status: 500 }
          );
        }

        // Validate structure
        if (!courseStructure || typeof courseStructure !== 'object') {
          console.error("Invalid course structure:", courseStructure);
          return NextResponse.json(
            { error: "Invalid course structure format" },
            { status: 500 }
          );
        }

        if (!courseStructure.sections || !Array.isArray(courseStructure.sections)) {
          console.error("Missing or invalid sections:", courseStructure);
          return NextResponse.json(
            { error: "Missing or invalid sections array" },
            { status: 500 }
          );
        }

        courseStructure.sections.forEach((section: Section) => {
          section.chapters.forEach((chapter, chapterIndex) => {
            const startTime = topicTimestamps[chapterIndex] || 0;
            chapter.video = `https://www.youtube.com/watch?v=${videoId}&t=${startTime}s`;
          });
        });

        return NextResponse.json(courseStructure);

      } catch (error) {
        console.error("Error in response processing:", error);
        return NextResponse.json(
          { 
            error: "Failed to process response",
            details: error
          },
          { status: 500 }
        );
      }
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

function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function extractTopicTimestamps(transcript: { offset: number; text: string; }[], threshold = 0.5) {
  if (!transcript || transcript.length === 0) return [];

  // Load the Universal Sentence Encoder model
  const model = await use.load();
  const sentences = transcript.map(({ text }) => text);

  // Generate embeddings for each sentence
  const embeddings = await model.embed(sentences);
  const sentenceVectors = embeddings.arraySync();

  const timestamps = [];
  
  for (let i = 1; i < sentenceVectors.length; i++) {
    // Compute cosine similarity
    const similarity = cosineSimilarity(sentenceVectors[i - 1], sentenceVectors[i]);

    // If similarity drops below the threshold, mark as a topic change
    if (similarity < threshold) {
      timestamps.push(transcript[i].offset);
    }
  }

  return timestamps;
}

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = tf.tidy(() => tf.dot(tf.tensor1d(vecA), tf.tensor1d(vecB)).dataSync()[0]);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}


export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  runtime: "edge",
};
