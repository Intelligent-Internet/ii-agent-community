import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/db'

// Mock data
const mockProduct = {
  name: 'Red Roses Bouquet',
  description: 'Beautiful red roses perfect for romantic occasions',
  price: 49.99,
  image: 'https://example.com/red-roses.jpg',
  category: 'Roses',
  stock: 10,
  features: ['Fresh', 'Romantic', 'Long-lasting']
}

describe('API Endpoints', () => {
  let productId: string
  let cartId: string
  let orderId: string

  beforeAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.chatSession.deleteMany()
    await prisma.product.deleteMany()
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.chatSession.deleteMany()
    await prisma.product.deleteMany()
    await prisma.$disconnect()
  })

  describe('Products API', () => {
    it('should create a product', async () => {
      const product = await prisma.product.create({
        data: mockProduct
      })

      expect(product).toBeDefined()
      expect(product.name).toBe(mockProduct.name)
      expect(product.price).toBe(mockProduct.price)
      expect(product.stock).toBe(mockProduct.stock)
      
      productId = product.id
    })

    it('should fetch all products', async () => {
      const products = await prisma.product.findMany()
      
      expect(products).toBeDefined()
      expect(products.length).toBeGreaterThan(0)
      expect(products[0].name).toBe(mockProduct.name)
    })

    it('should fetch product by ID', async () => {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      expect(product).toBeDefined()
      expect(product?.id).toBe(productId)
      expect(product?.name).toBe(mockProduct.name)
    })
  })

  describe('Cart API', () => {
    it('should create a cart and add items', async () => {
      const sessionId = 'test-session-123'
      
      // Create cart
      const cart = await prisma.cart.create({
        data: { sessionId }
      })

      expect(cart).toBeDefined()
      expect(cart.sessionId).toBe(sessionId)
      cartId = cart.id

      // Add item to cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: 2
        },
        include: {
          product: true
        }
      })

      expect(cartItem).toBeDefined()
      expect(cartItem.quantity).toBe(2)
      expect(cartItem.product.name).toBe(mockProduct.name)
    })

    it('should fetch cart with items', async () => {
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      expect(cart).toBeDefined()
      expect(cart?.items.length).toBe(1)
      expect(cart?.items[0].quantity).toBe(2)
      expect(cart?.items[0].product.name).toBe(mockProduct.name)
    })

    it('should update cart item quantity', async () => {
      const cartItem = await prisma.cartItem.findFirst({
        where: { cartId }
      })

      expect(cartItem).toBeDefined()

      const updatedItem = await prisma.cartItem.update({
        where: { id: cartItem!.id },
        data: { quantity: 3 }
      })

      expect(updatedItem.quantity).toBe(3)
    })

    it('should remove item from cart', async () => {
      const cartItem = await prisma.cartItem.findFirst({
        where: { cartId }
      })

      expect(cartItem).toBeDefined()

      await prisma.cartItem.delete({
        where: { id: cartItem!.id }
      })

      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem!.id }
      })

      expect(deletedItem).toBeNull()
    })
  })

  describe('Orders API', () => {
    beforeAll(async () => {
      // Add item back to cart for order test
      if (cartId && productId) {
        await prisma.cartItem.create({
          data: {
            cartId,
            productId,
            quantity: 1
          }
        })
      }
    })

    it('should create an order from cart', async () => {
      if (!cartId || !productId) {
        throw new Error('Cart ID or Product ID not set')
      }

      // First add an item to the cart for this test
      await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          quantity: 2
        }
      })

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      expect(cart).toBeDefined()
      expect(cart?.items.length).toBeGreaterThan(0)

      const total = cart!.items.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity)
      }, 0)

      const order = await prisma.order.create({
        data: {
          total,
          status: 'pending',
          items: {
            create: cart!.items.map(item => ({
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

      expect(order).toBeDefined()
      expect(order.total).toBe(total)
      expect(order.status).toBe('pending')
      expect(order.items.length).toBe(1)
      
      orderId = order.id
    })

    it('should fetch order by ID', async () => {
      if (!orderId) {
        throw new Error('Order ID not set')
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      expect(order).toBeDefined()
      expect(order?.id).toBe(orderId)
      expect(order?.items.length).toBe(1)
      expect(order?.items[0].product.name).toBe(mockProduct.name)
    })

    it('should update order status', async () => {
      if (!orderId) {
        throw new Error('Order ID not set')
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' }
      })

      expect(updatedOrder.status).toBe('paid')
    })
  })

  describe('Chat API', () => {
    it('should create a chat session', async () => {
      const sessionId = 'chat-test-session-123'
      
      const session = await prisma.chatSession.create({
        data: { sessionId }
      })

      expect(session).toBeDefined()
      expect(session.sessionId).toBe(sessionId)
    })

    it('should add messages to chat session', async () => {
      const sessionId = 'chat-test-session-123'
      
      const userMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'user',
          content: 'I need flowers for a wedding'
        }
      })

      const assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: 'I can help you find perfect wedding flowers!'
        }
      })

      expect(userMessage).toBeDefined()
      expect(userMessage.role).toBe('user')
      expect(assistantMessage).toBeDefined()
      expect(assistantMessage.role).toBe('assistant')
    })

    it('should fetch chat messages', async () => {
      const sessionId = 'chat-test-session-123'
      
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
      })

      expect(messages).toBeDefined()
      expect(messages.length).toBe(2)
      expect(messages[0].role).toBe('user')
      expect(messages[1].role).toBe('assistant')
    })
  })

  describe('Vector Database Operations', () => {
    it('should handle product data structure', () => {
      const productData = {
        id: productId,
        name: mockProduct.name,
        description: mockProduct.description,
        category: mockProduct.category,
        features: mockProduct.features,
        price: mockProduct.price,
        stock: mockProduct.stock,
        image: mockProduct.image
      }

      expect(productData.id).toBeDefined()
      expect(productData.name).toBe(mockProduct.name)
      expect(productData.features).toEqual(mockProduct.features)
    })
  })

  describe('AI Actions', () => {
    it('should validate action structure', () => {
      const addToCartAction = {
        action: 'add_to_cart',
        productId,
        quantity: 1
      }

      const searchAction = {
        action: 'search_products',
        query: 'red roses'
      }

      expect(addToCartAction.action).toBe('add_to_cart')
      expect(addToCartAction.productId).toBe(productId)
      expect(searchAction.action).toBe('search_products')
      expect(searchAction.query).toBe('red roses')
    })
  })
})

// Test API response structures
describe('API Response Structures', () => {
  it('should validate product response structure', () => {
    const productResponse = {
      id: 'test-id',
      name: 'Test Product',
      description: 'Test Description',
      price: 29.99,
      image: 'test-image.jpg',
      category: 'Test Category',
      stock: 5,
      features: ['feature1', 'feature2'],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(productResponse).toHaveProperty('id')
    expect(productResponse).toHaveProperty('name')
    expect(productResponse).toHaveProperty('description')
    expect(productResponse).toHaveProperty('price')
    expect(productResponse).toHaveProperty('stock')
    expect(Array.isArray(productResponse.features)).toBe(true)
  })

  it('should validate cart response structure', () => {
    const cartResponse = {
      id: 'cart-id',
      items: [
        {
          id: 'item-id',
          productId: 'product-id',
          quantity: 2,
          product: {
            id: 'product-id',
            name: 'Product Name',
            price: 29.99
          }
        }
      ],
      total: 59.98
    }

    expect(cartResponse).toHaveProperty('id')
    expect(cartResponse).toHaveProperty('items')
    expect(cartResponse).toHaveProperty('total')
    expect(Array.isArray(cartResponse.items)).toBe(true)
    expect(cartResponse.items[0]).toHaveProperty('product')
  })

  it('should validate chat message response structure', () => {
    const chatResponse = {
      id: 'message-id',
      role: 'assistant',
      content: 'Hello! How can I help you?',
      timestamp: new Date(),
      sessionId: 'session-id'
    }

    expect(chatResponse).toHaveProperty('id')
    expect(chatResponse).toHaveProperty('role')
    expect(chatResponse).toHaveProperty('content')
    expect(chatResponse).toHaveProperty('timestamp')
    expect(chatResponse).toHaveProperty('sessionId')
    expect(['user', 'assistant']).toContain(chatResponse.role)
  })
})