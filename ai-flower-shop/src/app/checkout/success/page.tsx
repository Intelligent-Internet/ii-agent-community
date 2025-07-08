'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Package, Truck, Calendar } from 'lucide-react'
import Link from 'next/link'

interface OrderDetails {
  id: string
  amount: number
  status: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails(sessionId)
    }
  }, [sessionId])

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/checkout/success?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-600">Thank you for your purchase. Your beautiful flowers are on their way!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderDetails ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Order ID:</span>
                    <span className="text-sm text-gray-600">#{orderDetails.id.slice(-8).toUpperCase()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{item.name} × {item.quantity}</span>
                        <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span>${(orderDetails.amount / 100).toFixed(2)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Confirmation email sent to: {orderDetails.customerEmail}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Order details will be available shortly.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-pink-500 mt-1" />
                <div>
                  <h4 className="font-medium">Estimated Delivery</h4>
                  <p className="text-sm text-gray-600">2-3 business days</p>
                  <p className="text-xs text-gray-500">We'll send you tracking information once your order ships</p>
                </div>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2">Care Instructions</h4>
                <ul className="text-sm text-pink-700 space-y-1">
                  <li>• Keep flowers in cool, clean water</li>
                  <li>• Trim stems at an angle every 2-3 days</li>
                  <li>• Remove wilted leaves and flowers</li>
                  <li>• Place away from direct sunlight and heat</li>
                </ul>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Questions about your order? Contact our customer service team.
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              View Order History
            </Button>
          </Link>
        </div>

        {/* Social Sharing */}
        <div className="text-center mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Share the Love</h3>
          <p className="text-gray-600 mb-4">
            Love your flowers? Share your experience with friends and family!
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm">
              Share on Facebook
            </Button>
            <Button variant="outline" size="sm">
              Share on Instagram
            </Button>
            <Button variant="outline" size="sm">
              Leave a Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}