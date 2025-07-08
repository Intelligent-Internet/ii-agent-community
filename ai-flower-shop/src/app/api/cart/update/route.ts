import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

async function getSessionId() {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return sessionId
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Product ID and valid quantity are required' },
        { status: 400 }
      )
    }

    const sessionId = await getSessionId()

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { sessionId }
    })

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    // Update cart item
    await prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId
      },
      data: { quantity }
    })

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const total = updatedCart!.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    return NextResponse.json({
      id: updatedCart!.id,
      items: updatedCart!.items,
      total
    })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}