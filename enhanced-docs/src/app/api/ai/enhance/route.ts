import { NextRequest, NextResponse } from 'next/server';
import { enhanceText } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { text, action } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const enhancedText = await enhanceText(text, action || 'improve');
    
    return NextResponse.json({ enhancedText });
  } catch (error) {
    console.error('AI enhance error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance text' },
      { status: 500 }
    );
  }
}