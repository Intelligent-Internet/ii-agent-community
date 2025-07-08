import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

function getSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('chat_session_id')?.value
  
  if (!sessionId) {
    sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return sessionId
}

export async function GET(request: NextRequest) {
  try {
    const sessions = await prisma.chatSession.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionId()

    const session = await prisma.chatSession.upsert({
      where: { sessionId },
      update: { updatedAt: new Date() },
      create: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    const response = NextResponse.json(session, { status: 201 })

    // Set session cookie
    response.cookies.set('chat_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}