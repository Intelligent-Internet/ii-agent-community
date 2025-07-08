import OpenAI from 'openai'
import { prisma } from './db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple in-memory vector store for development
interface VectorProduct {
  id: string
  name: string
  description: string
  category: string
  features: string[]
  price: number
  stock: number
  image: string
  embedding: number[]
  searchableText: string
}

let vectorStore: VectorProduct[] = []
let isInitialized = false

// Initialize vector store from database
async function initializeVectorStore() {
  if (isInitialized) return
  
  try {
    console.log('🔄 Initializing vector store from database...')
    const products = await prisma.product.findMany()
    
    for (const product of products) {
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
    }
    
    isInitialized = true
    console.log(`✅ Vector store initialized with ${products.length} products`)
  } catch (error) {
    console.error('❌ Failed to initialize vector store:', error)
  }
}

// Create embedding function using OpenAI directly
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  })
  return response.data[0].embedding
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

export interface ProductEmbedding {
  id: string
  name: string
  description: string
  category: string
  features: string[]
  price: number
  stock: number
  image: string
}

// Add product to vector database
export async function addProductToVectorDB(product: ProductEmbedding) {
  // Create searchable text from product data
  const searchableText = `${product.name} ${product.description} ${product.category} ${product.features.join(' ')}`
  
  // Create embedding
  const embedding = await createEmbedding(searchableText)
  
  // Add to in-memory store
  const vectorProduct: VectorProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    features: product.features,
    price: product.price,
    stock: product.stock,
    image: product.image,
    embedding,
    searchableText
  }
  
  // Remove existing product if it exists
  vectorStore = vectorStore.filter(p => p.id !== product.id)
  vectorStore.push(vectorProduct)
}

// Search products using vector similarity
export async function searchProductsInVectorDB(query: string, limit: number = 10) {
  console.log(`🔍 Vector DB search - Store size: ${vectorStore.length}, Query: "${query}"`)
  
  // Auto-initialize if empty
  if (vectorStore.length === 0) {
    console.log('🔄 Vector store is empty, initializing...')
    await initializeVectorStore()
    
    if (vectorStore.length === 0) {
      console.log('❌ Vector store is still empty after initialization!')
      return []
    }
  }
  
  // Create embedding for the query
  const queryEmbedding = await createEmbedding(query)
  
  // Calculate similarities and sort
  const results = vectorStore
    .map(product => ({
      ...product,
      similarity: cosineSimilarity(queryEmbedding, product.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      features: product.features,
      price: product.price,
      stock: product.stock,
      image: product.image,
      distance: 1 - product.similarity // Convert similarity to distance
    }))
  
  return results
}

// Update product in vector database
export async function updateProductInVectorDB(product: ProductEmbedding) {
  // Simply re-add the product (addProductToVectorDB handles removal)
  await addProductToVectorDB(product)
}

// Remove product from vector database
export async function removeProductFromVectorDB(productId: string) {
  vectorStore = vectorStore.filter(p => p.id !== productId)
}

// Get AI recommendations based on user query
export async function getAIRecommendations(userQuery: string, limit: number = 5) {
  try {
    // Use OpenAI to enhance the query for better search
    const enhancedQuery = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a flower expert. Convert the user's request into search keywords for finding the perfect flowers. Focus on flower types, colors, occasions, meanings, and characteristics. Return only the search keywords, no explanation."
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      max_tokens: 100
    })
    
    const searchQuery = enhancedQuery.choices[0]?.message?.content || userQuery
    
    // Search in vector database
    const results = await searchProductsInVectorDB(searchQuery, limit)
    
    return results
  } catch (error) {
    console.error('Error getting AI recommendations:', error)
    // Fallback to direct search
    return await searchProductsInVectorDB(userQuery, limit)
  }
}