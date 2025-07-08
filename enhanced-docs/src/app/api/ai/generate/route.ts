import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const generatedText = await generateText(prompt, context);
    
    return NextResponse.json({ generatedText });
  } catch (error) {
    console.error('AI generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}