import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, orderId } = body

    if (!paymentIntentId || !orderId) {
      return NextResponse.json(
        { error: 'Payment intent ID and order ID are required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Update product stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return NextResponse.json({
        success: true,
        order
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment not completed'
      })
    }

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}