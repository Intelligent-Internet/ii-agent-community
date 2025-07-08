import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchProductsInVectorDB } from '@/lib/vector-db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, history }: ChatRequest = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Search for relevant products based on the user's message
    const relevantProducts = await searchProductsInVectorDB(message, 10)

    // If no products found, return a message about no matches
    if (relevantProducts.length === 0) {
      return NextResponse.json({
        response: "I'm sorry, but I couldn't find any flowers in our current inventory that match your request. Could you try describing what you're looking for in a different way? For example, you could mention the occasion, color preferences, or type of flowers you have in mind.",
        recommendedProducts: []
      })
    }

    // Create system prompt that ONLY uses vector store data
    const systemPrompt = `You are an AI flower shop assistant. You can ONLY recommend and discuss flowers from the provided inventory below. You have NO knowledge of flowers outside this inventory.

STRICT RULES:
1. ONLY recommend products from the inventory list below
2. NEVER mention flowers, care tips, or flower meanings not explicitly listed in the product data
3. If asked about flowers not in inventory, say "I don't have that flower in our current inventory"
4. Base ALL flower knowledge on the product descriptions and features provided
5. When recommending, always mention the exact product name and price
6. If asked to add to cart, respond enthusiastically but don't actually add (the frontend handles this)

CURRENT INVENTORY:
${relevantProducts.map(product => 
  `Product: ${product.name}
   Price: $${product.price}
   Description: ${product.description}
   Category: ${product.category}
   Features: ${product.features.join(', ')}
   Stock: ${product.stock} available
   ID: ${product.id}
   ---`
).join('\n')}

IMPORTANT: You can only discuss the flowers listed above. If a customer asks about anything not in this inventory, politely explain that you don't have that item available and suggest alternatives from the inventory above.`

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message }
    ]

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.3, // Lower temperature for more consistent responses
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I\'m having trouble responding right now. Please try again.'

    // Return the most relevant products for display
    const topProducts = relevantProducts.slice(0, 3)

    return NextResponse.json({
      response,
      recommendedProducts: topProducts
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        recommendedProducts: []
      },
      { status: 500 }
    )
  }
}