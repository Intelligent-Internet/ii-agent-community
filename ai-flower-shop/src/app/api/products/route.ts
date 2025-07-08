import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addProductToVectorDB } from '@/lib/vector-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = category ? { category } : {}

    const products = await prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, image, category, stock, features } = body

    // Validate required fields
    if (!name || !description || !price || !image || !category || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        category,
        stock: parseInt(stock),
        features: features || []
      }
    })

    // Add to vector database for AI search
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}