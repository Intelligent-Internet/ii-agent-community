'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, Search, MessageCircle, Heart, Star, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    fetchProducts()
    fetchCartCount()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      setCartCount(data.items?.length || 0)
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  const addToCart = async (productId: string) => {
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      fetchCartCount()
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI Flower Shop
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/cart">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/chat">
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Discover Perfect Flowers with AI
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Let our intelligent AI assistant help you find the perfect flowers for any occasion. 
              From romantic roses to cheerful sunflowers, we have everything you need.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-12">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for flowers, occasions, or colors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-pink-200 focus:border-pink-400 shadow-lg"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2 text-sm">🌹 Romantic</Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">🌻 Cheerful</Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">🌸 Elegant</Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">🌺 Tropical</Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">💜 Calming</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Featured Flowers</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handpicked selection of our most beautiful and popular flowers, 
              each with its own unique story and meaning.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
                  <div className="relative overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Button size="sm" variant="secondary" className="rounded-full w-8 h-8 p-0 bg-white/80 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg group-hover:text-pink-600 transition-colors">
                      {product.name}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-500 ml-2">(4.9)</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-pink-600">
                        ${product.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.stock} in stock
                      </span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <Button 
                      onClick={() => addToCart(product.id)}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No flowers found matching your search.</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-pink-100 to-purple-100">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Need Help Choosing?</h3>
            <p className="text-lg text-gray-600 mb-8">
              Our AI flower expert is here to help! Tell us about the occasion, recipient, 
              or your preferences, and we'll recommend the perfect flowers for you.
            </p>
            <Link href="/chat">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8 py-6">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold">AI Flower Shop</h4>
          </div>
          <p className="text-gray-400 mb-4">
            Bringing you the most beautiful flowers with the power of AI
          </p>
          <p className="text-sm text-gray-500">
            © 2025 AI Flower Shop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
