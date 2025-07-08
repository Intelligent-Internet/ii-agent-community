import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

async function getSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get('session_id')?.value
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const sessionId = await getSessionId()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No cart found' },
        { status: 404 }
      )
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId }
    })

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    if (cartItem.quantity <= quantity) {
      // Remove item completely
      await prisma.cartItem.delete({
        where: { id: cartItem.id }
      })
    } else {
      // Reduce quantity
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity - quantity }
      })
    }

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
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    )
  }
}