import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Create order in database if payment was successful
    if (session.payment_status === 'paid' && session.metadata?.cartId) {
      try {
        // Check if order already exists
        const existingOrder = await prisma.order.findFirst({
          where: { stripeSessionId: sessionId }
        })

        if (!existingOrder) {
          // Get cart details
          const cart = await prisma.cart.findUnique({
            where: { id: session.metadata.cartId },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          })

          if (cart) {
            // Create order
            const order = await prisma.order.create({
              data: {
                stripeSessionId: sessionId,
                customerEmail: session.customer_details?.email || '',
                customerName: session.customer_details?.name || '',
                customerPhone: session.customer_details?.phone || '',
                shippingAddress: JSON.stringify(session.shipping_details?.address || {}),
                total: session.amount_total ? session.amount_total / 100 : 0,
                status: 'confirmed',
                items: {
                  create: cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price
                  }))
                }
              },
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            })

            // Clear the cart after successful order
            await prisma.cartItem.deleteMany({
              where: { cartId: cart.id }
            })
            await prisma.cart.delete({
              where: { id: cart.id }
            })
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        // Continue even if database operations fail
      }
    }

    // Return order details
    const orderData = {
      id: sessionId,
      amount: session.amount_total || 0,
      status: session.payment_status,
      customerEmail: session.customer_details?.email || '',
      items: session.line_items?.data.map(item => ({
        name: item.description || '',
        quantity: item.quantity || 0,
        price: item.amount_total ? item.amount_total / 100 : 0
      })) || []
    }

    return NextResponse.json(orderData)

  } catch (error) {
    console.error('Success page error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order details' },
      { status: 500 }
    )
  }
}