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

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch transcript
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      const fullTranscript = transcript.map(t => t.text).join(' ');

      // Generate content using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert content creator who specializes in creating educational content. 
            Given a video transcript, create a well-structured chapter title and content summary. 
            The content should be concise yet informative, focusing on the key points and main takeaways.`
          },
          {
            role: "user",
            content: `Please analyze this video transcript and create:
            1. A clear, concise chapter title (maximum 100 characters)
            2. A well-structured content summary (maximum 300 words)
            
            Transcript: ${fullTranscript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      
      if (!response) {
        return NextResponse.json(
          { error: 'Failed to generate content' },
          { status: 500 }
        );
      }

      // Parse the response to extract title and content
      const [title, ...contentArr] = response.split('\n').filter(Boolean);
      const content = contentArr.join('\n');

      return NextResponse.json({
        title: title.replace(/^.*?:/, '').trim(), // Remove any prefix like "Title:"
        content: content.trim()
      });

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


// Rate limiting configuration (optional)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  runtime: 'edge', // Optional: Use edge runtime for better performance
};