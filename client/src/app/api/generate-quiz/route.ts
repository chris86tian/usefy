import { NextResponse } from "next/server";
import { OpenAI } from "openai";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TopicQuestions {
  topic: string;
  questions: Question[];
}

interface QuizResponse {
  topics: string[];
  allQuestions: TopicQuestions[];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { videoTranscript } = await req.json();

    if (!videoTranscript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Step 1: Extract topics with a more explicit prompt
    const topicResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an educational assistant. Respond only with a comma-separated list of topics, nothing else.",
        },
        {
          role: "user",
          content: `Extract 3-5 main topics from this lecture transcript: ${videoTranscript}`,
        },
      ],
    });

    const topics = topicResponse.choices[0].message?.content
      ?.split(",")
      .map((topic) => topic.trim())
      .filter(Boolean) ?? [];

    if (topics.length === 0) {
      return NextResponse.json(
        { error: "No topics could be extracted from the transcript" },
        { status: 422 }
      );
    }

    // Step 2: Generate questions with a more structured prompt
    const allQuestions: TopicQuestions[] = [];

    for (const topic of topics) {
      const questionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an educational assistant. Respond only with a valid JSON object containing an array of questions.",
          },
          {
            role: "user",
            content: `Generate exactly 3 multiple-choice questions for the topic "${topic}". 
            Format your response as a JSON object with this exact structure:
            {
              "questions": [
                {
                  "question": "string",
                  "options": ["string", "string", "string", "string"],
                  "correctAnswer": number
                }
              ]
            }
            Ensure each question has exactly 4 options and correctAnswer is a number 0-3.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const questionContent = questionResponse.choices[0].message?.content;

      if (!questionContent) {
        console.error(`No content returned for topic: ${topic}`);
        continue; // Skip this topic but continue with others
      }

      try {
        const parsedResponse = JSON.parse(questionContent.trim());
        
        // Validate the response structure
        if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
          throw new Error("Invalid response structure");
        }

        // Validate each question
        const validQuestions = parsedResponse.questions.every((q: Question) => 
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3
        );

        if (!validQuestions) {
          throw new Error("Invalid question format");
        }

        allQuestions.push({ topic, questions: parsedResponse.questions });
      } catch (error) {
        console.error(`Error processing topic ${topic}:`, error);
        continue; // Skip this topic but continue with others
      }
    }

    // Ensure we have at least some valid questions
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate valid questions for any topic" },
        { status: 422 }
      );
    }

    const response: QuizResponse = {
      topics,
      allQuestions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in quiz generation:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
  runtime: "edge",
};