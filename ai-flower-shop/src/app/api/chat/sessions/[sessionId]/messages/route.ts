import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processAIMessage, getConversationHistory, saveMessageToHistory } from '@/lib/ai-assistant'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { timestamp: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Save user message
    await saveMessageToHistory(params.sessionId, 'user', message)

    // Get conversation history
    const history = await getConversationHistory(params.sessionId, 10)

    // Process with AI
    const aiResponse = await processAIMessage(message, params.sessionId, history)

    // Save AI response
    const savedMessage = await saveMessageToHistory(
      params.sessionId,
      'assistant',
      aiResponse.message
    )

    return NextResponse.json({
      message: savedMessage,
      actions: aiResponse.actions,
      products: aiResponse.products
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}