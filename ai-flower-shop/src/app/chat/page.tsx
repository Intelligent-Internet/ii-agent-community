'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  ShoppingCart, 
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  stock: number
  features: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI flower expert. I can help you find the perfect flowers for any occasion, answer questions about our products, and even add items to your cart. What can I help you with today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // If the AI recommended products, fetch them
      if (data.recommendedProducts && data.recommendedProducts.length > 0) {
        setRecommendedProducts(data.recommendedProducts)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      
      // Add a confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        content: "Great! I've added that item to your cart. Is there anything else I can help you with?",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, confirmMessage])
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  AI Flower Expert
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat with AI Assistant</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={
                          message.role === 'user' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        }>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white ml-auto'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about flowers, occasions, or say 'add roses to cart'..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setInputMessage("What flowers are good for a romantic date?")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Romantic Flowers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setInputMessage("I need flowers for a wedding")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Wedding Flowers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setInputMessage("Show me cheerful flowers")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Cheerful Flowers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setInputMessage("What's in season right now?")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Seasonal Flowers
                </Button>
              </CardContent>
            </Card>

            {/* Recommended Products */}
            {recommendedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended for You</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendedProducts.slice(0, 3).map((product) => (
                    <div key={product.id} className="border rounded-lg p-3">
                      <div className="flex space-x-3">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-pink-600">${product.price}</span>
                            <Button 
                              size="sm" 
                              onClick={() => addToCart(product.id)}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Help Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Ask about specific occasions like "wedding flowers" or "birthday bouquet"</p>
                <p>• Describe colors you like: "I want pink and white flowers"</p>
                <p>• Ask for care tips: "How do I care for roses?"</p>
                <p>• Request to add items: "Add sunflowers to my cart"</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}