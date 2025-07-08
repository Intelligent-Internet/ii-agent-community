import { NextRequest, NextResponse } from 'next/server'
import { searchProductsInVectorDB } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const products = await searchProductsInVectorDB(query, limit)

    return NextResponse.json({
      products,
      query,
      total: products.length
    })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}