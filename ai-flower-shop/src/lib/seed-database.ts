import { prisma } from './db'
import { addProductToVectorDB } from './vector-db'
import { sampleProducts } from './sample-data'

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data in correct order (foreign key constraints)
    await prisma.cartItem.deleteMany()
    console.log('🧹 Cleared existing cart items')
    
    await prisma.cart.deleteMany()
    console.log('🧹 Cleared existing carts')
    
    await prisma.orderItem.deleteMany()
    console.log('🧹 Cleared existing order items')
    
    await prisma.order.deleteMany()
    console.log('🧹 Cleared existing orders')
    
    await prisma.product.deleteMany()
    console.log('🧹 Cleared existing products')

    // Add sample products
    for (const productData of sampleProducts) {
      const product = await prisma.product.create({
        data: productData
      })

      // Add to vector database
      try {
        await addProductToVectorDB({
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          features: product.features,
          price: product.price,
          stock: product.stock,
          image: product.image
        })
        console.log(`✅ Added product to vector DB: ${product.name}`)
      } catch (vectorError) {
        console.error(`❌ Failed to add ${product.name} to vector DB:`, vectorError)
        // Continue with other products even if vector DB fails
      }

      console.log(`✅ Added product: ${product.name}`)
    }

    console.log('🎉 Database seeding completed successfully!')
    return { success: true, count: sampleProducts.length }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}