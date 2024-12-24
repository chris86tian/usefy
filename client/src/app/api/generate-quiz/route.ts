import { NextResponse } from "next/server"
import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
    const { transcript } = await req.json()

    if (!transcript) {
        return NextResponse.json(
            { error: "Transcript is required" },
            { status: 400 },
        )
    }

    try {
        const topicResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an educational assistant.",
                },
                {
                    role: "user",
                    content: `Extract the main topics from this lecture transcript: ${transcript}. Provide the topics as a plain comma-separated list. Do not include any comments or extra text besides the list.`,
                },
            ],
        })

        const responseContent = topicResponse.choices[0].message?.content

        if (!responseContent) {
            throw new Error("No content returned from OpenAI for topics.")
        }

        const topics = responseContent
            .split(",")
            .map((topic) => topic.trim())
            .filter((topic) => topic) // Remove empty strings

        if (topics.length === 0) {
            throw new Error("Failed to extract valid topics from the response.")
        }

        const quiz = []

        for (const topic of topics) {
            const questionResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an educational assistant.",
                    },
                    {
                        role: "user",
                        content: `Generate 3 multiple-choice questions for the topic "${topic}". Provide the output as a valid JSON array with this structure:
                        [
                            {
                                "question": "What is the capital of France?",
                                "choices": ["Paris", "London", "Berlin", "Madrid"],
                                "correctAnswer": "Paris"
                            },
                            ...
                        ]
                        Do not include anything else or any comments, besides the JSON itself.`,
                    },
                ],
            })

            const questionContent = questionResponse.choices[0].message?.content

            let questions = []
            try {
                questions = JSON.parse(questionContent || "[]")
            } catch (parseError) {
                console.error(
                    `Failed to parse questions for topic "${topic}":` + parseError,
                    questionContent,
                )
                continue
            }

            quiz.push({
                topic: topic.trim(),
                questions,
            })
        }
        return NextResponse.json({ topics: quiz })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: error || "Something went wrong" },
            { status: 500 },
        )
    }
}
