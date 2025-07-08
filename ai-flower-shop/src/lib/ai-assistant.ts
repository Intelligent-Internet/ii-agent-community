import OpenAI from 'openai'
import { getAIRecommendations } from './vector-db'
import { prisma } from './db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIAction {
  action: 'add_to_cart' | 'remove_from_cart' | 'search_products' | 'get_product_info'
  productId?: string
  quantity?: number
  query?: string
}

export interface AIResponse {
  message: string
  actions?: AIAction[]
  products?: any[]
}

// AI Assistant tools for function calling
const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search for flower products based on user query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for flowers"
          },
          limit: {
            type: "number",
            description: "Number of results to return",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a flower product to the customer's cart",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID of the product to add"
          },
          quantity: {
            type: "number",
            description: "Quantity to add",
            default: 1
          }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "remove_from_cart",
      description: "Remove a flower product from the customer's cart",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID of the product to remove"
          },
          quantity: {
            type: "number",
            description: "Quantity to remove",
            default: 1
          }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_info",
      description: "Get detailed information about a specific flower product",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID of the product to get info for"
          }
        },
        required: ["productId"]
      }
    }
  }
]

export async function processAIMessage(
  message: string,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<AIResponse> {
  try {
    // Create system prompt for the AI flower consultant
    const systemPrompt = `You are Lily, an expert AI flower consultant for our flower shop. You help customers find the perfect flowers for any occasion.

Your capabilities:
- Search for flowers based on customer needs (occasions, colors, meanings, types)
- Provide detailed flower information and care instructions
- Add/remove items from customer's cart
- Make personalized recommendations
- Share flower meanings and symbolism
- Suggest arrangements and combinations

Guidelines:
- Be warm, friendly, and knowledgeable
- Ask clarifying questions when needed
- Provide helpful flower care tips
- Suggest alternatives if something is out of stock
- Use the available tools to help customers
- Always confirm before adding items to cart

Current conversation context: You're helping a customer find the perfect flowers.`

    // Prepare conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message }
    ]

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000
    })

    const assistantMessage = completion.choices[0]?.message
    let responseMessage = assistantMessage?.content || "I'm sorry, I couldn't process your request."
    const actions: AIAction[] = []
    let products: any[] = []

    // Process function calls
    if (assistantMessage?.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        switch (functionName) {
          case 'search_products':
            const searchResults = await getAIRecommendations(
              functionArgs.query,
              functionArgs.limit || 5
            )
            products = searchResults
            actions.push({
              action: 'search_products',
              query: functionArgs.query
            })
            break

          case 'add_to_cart':
            actions.push({
              action: 'add_to_cart',
              productId: functionArgs.productId,
              quantity: functionArgs.quantity || 1
            })
            break

          case 'remove_from_cart':
            actions.push({
              action: 'remove_from_cart',
              productId: functionArgs.productId,
              quantity: functionArgs.quantity || 1
            })
            break

          case 'get_product_info':
            const product = await prisma.product.findUnique({
              where: { id: functionArgs.productId }
            })
            if (product) {
              products = [product]
            }
            actions.push({
              action: 'get_product_info',
              productId: functionArgs.productId
            })
            break
        }
      }
    }

    return {
      message: responseMessage,
      actions: actions.length > 0 ? actions : undefined,
      products: products.length > 0 ? products : undefined
    }

  } catch (error) {
    console.error('Error processing AI message:', error)
    return {
      message: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
    }
  }
}

// Get conversation context for better responses
export async function getConversationHistory(sessionId: string, limit: number = 10) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'desc' },
    take: limit
  })

  return messages.reverse().map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }))
}

// Save message to conversation history
export async function saveMessageToHistory(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  // Ensure chat session exists
  await prisma.chatSession.upsert({
    where: { sessionId },
    update: { updatedAt: new Date() },
    create: { sessionId }
  })

  // Save message
  return await prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      timestamp: new Date()
    }
  })
}