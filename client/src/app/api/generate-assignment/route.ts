import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { assignmentTitle, assignmentDescription } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `You are an expert programming instructor. Always provide output as a JSON object without any additional text, formatting, or explanation.` 
        },
        { 
          role: "user", 
          content: `Create a programming assignment based on the following:\n\nTitle: ${assignmentTitle}\n\nDescription: ${assignmentDescription}.\n\nThe output should include:\n1. A clear, concise title\n2. A detailed description explaining the task and requirements\n3. Three progressive hints\n4.\n\nRespond in this JSON format:\n\n{
            "title": "Assignment Title",
            "description": "Assignment Description",
            "hints": ["Hint 1", "Hint 2", "Hint 3"],
          }\n\nOnly return the JSON.` 
        }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const generatedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!generatedContent) {
      throw new Error('Invalid JSON format in OpenAI response');
    }

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate assignment' },
      { status: 500 }
    );
  }
}
