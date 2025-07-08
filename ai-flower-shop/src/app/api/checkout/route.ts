import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  
  return sessionId
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSessionId()
    
    // Get cart from database
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description,
          images: [item.product.image],
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Calculate tax (8% for demo purposes)
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const taxAmount = Math.round(subtotal * 0.08 * 100) // 8% tax in cents

    // Add tax as a line item
    const allLineItems = [
      ...lineItems,
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales Tax (8%)',
          },
          unit_amount: taxAmount,
        },
        quantity: 1,
      },
    ]

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: allLineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      metadata: {
        cartId: cart.id,
        sessionId: sessionId,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      phone_number_collection: {
        enabled: true,
      },
      custom_fields: [
        {
          key: 'delivery_instructions',
          label: {
            type: 'custom',
            custom: 'Delivery Instructions (Optional)',
          },
          type: 'text',
          optional: true,
        },
      ],
      invoice_creation: {
        enabled: true,
      },
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}