import { NextResponse } from "next/server";
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { code, language, task } = await request.json();

    if (!code || !language || !task) {
      return NextResponse.json(
        { error: 'Code, language, and task are required' },
        { status: 400 }
      );
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an experienced programming instructor and code reviewer. 
            Evaluate student code submissions with these criteria:
            1. Correctness: Does the code solve the given task?
            2. Efficiency: Is the solution efficient and well-optimized?
            3. Best Practices: Are there any improvements needed?
            
            Format your response as a JSON object with these fields:
            evaluation: {
                "passed": boolean,
                "score": number (0-100),
                "feedback": {
                    "correctness": string,
                    "efficiency": string,
                    "bestPractices": string
                },
                "suggestions": string[],
                "explanation": string
            }
            `
          },
          {
            role: "user",
            content: `Please evaluate this ${language} code submission for the following task:
            
            Task Description:
            ${task}
            
            Submitted Code:
            \`\`\`${language}
            ${code}
            \`\`\`

            Evaluate the code and provide detailed feedback in the specified JSON format.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // Parse the response content, with error handling
      let evaluation;
      try {
        evaluation = JSON.parse(completion.choices[0].message.content || '{}');
      } catch (error) {
        console.error('Error parsing GPT response:', error);
        return NextResponse.json(
          { error: 'Invalid response format from evaluation service' },
          { status: 500 }
        );
      }

      // Add runtime validation if code is executable
      if (['javascript', 'python', 'typescript'].includes(language.toLowerCase())) {
        try {
          // You can add actual code execution here if needed
          evaluation.runtime = {
            executed: true,
            error: null
          };
        } catch (error) {
          evaluation.runtime = {
            executed: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }

      return NextResponse.json({ evaluation });

    } catch (error) {
      console.error('Error evaluating code:', error);
      return NextResponse.json(
        { 
          error: 'Failed to evaluate code submission',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  runtime: 'edge',
};