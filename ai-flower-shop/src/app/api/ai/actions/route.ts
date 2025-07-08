import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { searchProductsInVectorDB } from '@/lib/vector-db'
import { cookies } from 'next/headers'

function getSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return sessionId
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, quantity = 1, query } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let result: any = {}
    let message = ''

    switch (action) {
      case 'add_to_cart':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for add_to_cart' },
            { status: 400 }
          )
        }

        const sessionId = getSessionId()
        
        // Check if product exists
        const product = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!product) {
          return NextResponse.json({
            success: false,
            message: 'Product not found'
          })
        }

        if (product.stock < quantity) {
          return NextResponse.json({
            success: false,
            message: 'Insufficient stock'
          })
        }

        // Get or create cart
        let cart = await prisma.cart.findUnique({
          where: { sessionId }
        })

        if (!cart) {
          cart = await prisma.cart.create({
            data: { sessionId }
          })
        }

        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId
            }
          }
        })

        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
          })
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity
            }
          })
        }

        result = { productId, quantity, productName: product.name }
        message = `Added ${quantity} ${product.name} to your cart!`
        break

      case 'remove_from_cart':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for remove_from_cart' },
            { status: 400 }
          )
        }

        const removeSessionId = getSessionId()
        const removeCart = await prisma.cart.findUnique({
          where: { sessionId: removeSessionId }
        })

        if (!removeCart) {
          return NextResponse.json({
            success: false,
            message: 'Cart not found'
          })
        }

        const cartItem = await prisma.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: removeCart.id,
              productId
            }
          },
          include: { product: true }
        })

        if (!cartItem) {
          return NextResponse.json({
            success: false,
            message: 'Item not found in cart'
          })
        }

        if (cartItem.quantity <= quantity) {
          await prisma.cartItem.delete({
            where: { id: cartItem.id }
          })
          message = `Removed ${cartItem.product.name} from your cart!`
        } else {
          await prisma.cartItem.update({
            where: { id: cartItem.id },
            data: { quantity: cartItem.quantity - quantity }
          })
          message = `Reduced ${cartItem.product.name} quantity by ${quantity}!`
        }

        result = { productId, quantity, productName: cartItem.product.name }
        break

      case 'search_products':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search_products' },
            { status: 400 }
          )
        }

        const searchResults = await searchProductsInVectorDB(query, 10)
        result = { products: searchResults, query }
        message = `Found ${searchResults.length} products matching "${query}"`
        break

      case 'get_product_info':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for get_product_info' },
            { status: 400 }
          )
        }

        const productInfo = await prisma.product.findUnique({
          where: { id: productId }
        })

        if (!productInfo) {
          return NextResponse.json({
            success: false,
            message: 'Product not found'
          })
        }

        result = { product: productInfo }
        message = `Here's the information for ${productInfo.name}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result,
      message
    })

  } catch (error) {
    console.error('Error executing AI action:', error)
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    )
  }
}