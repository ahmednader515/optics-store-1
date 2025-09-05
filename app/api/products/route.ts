import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category') || ''
    const query = searchParams.get('query') || ''

    // Build where clause
    const where: any = { isPublished: true }
    
    if (query && query !== 'all') {
      where.name = { contains: query, mode: 'insensitive' }
    }
    
    if (category && category !== 'all') {
      where.category = category
    }

    const skip = limit * (page - 1)
    
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          price: true,
          listPrice: true,
          brand: true,
          category: true,
          description: true,
          avgRating: true,
          numReviews: true,
          countInStock: true,
          tags: true,
          colors: true,
          sizes: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.product.count({ where })
    ])

    // Normalize the data
    const normalizedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
      listPrice: Number(product.listPrice),
    }))

    return NextResponse.json({
      products: normalizedProducts,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      hasMore: skip + products.length < totalProducts
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
