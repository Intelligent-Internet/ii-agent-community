import { NextRequest, NextResponse } from 'next/server'
import { searchProductsInVectorDB } from '@/lib/vector-db'

export async function GET(request: NextRequest) {
  try {
    // Test search with a simple query
    const results = await searchProductsInVectorDB('roses', 10)
    
    return NextResponse.json({
      success: true,
      query: 'roses',
      resultsCount: results.length,
      results: results
    })
  } catch (error) {
    console.error('Debug vector search error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search vector database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }
    
    const results = await searchProductsInVectorDB(query, 10)
    
    return NextResponse.json({
      success: true,
      query,
      resultsCount: results.length,
      results: results
    })
  } catch (error) {
    console.error('Debug vector search error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search vector database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}