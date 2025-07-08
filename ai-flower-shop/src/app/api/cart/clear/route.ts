import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

function getSessionId() {
  const cookieStore = cookies()
  return cookieStore.get('session_id')?.value
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionId()

    if (!sessionId) {
      return NextResponse.json({
        id: 'empty',
        items: [],
        total: 0
      })
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId }
    })

    if (cart) {
      // Delete all cart items
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    return NextResponse.json({
      id: cart?.id || 'empty',
      items: [],
      total: 0
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}