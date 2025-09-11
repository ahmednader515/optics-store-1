'use server'

import { prisma } from '@/lib/prisma'
import { getRecommendedGlassesShape } from '@/lib/face-shape-mapping'

export async function getRecommendedProducts({
  category,
  glassesShape,
  limit = 6
}: {
  category: string
  glassesShape?: string
  limit?: number
}) {
  try {
    // Build where clause
    const where: any = { 
      isPublished: true,
      category: category
    }
    
    // Add glasses shape filter if provided
    if (glassesShape) {
      where.glassesShape = glassesShape
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { avgRating: 'desc' },
        { numSales: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        listPrice: true,
        brand: true,
        avgRating: true,
        numReviews: true,
        glassesShape: true,
        category: true
      }
    })

    // Convert Decimal values to numbers
    const normalizedProducts = products.map((product: any) => ({
      ...product,
      price: Number(product.price),
      listPrice: Number(product.listPrice),
      avgRating: Number(product.avgRating),
      numReviews: Number(product.numReviews),
    }))

    return {
      success: true,
      products: normalizedProducts
    }
  } catch (error) {
    console.error('Error fetching recommended products:', error)
    return {
      success: false,
      products: [],
      error: 'Failed to fetch recommended products'
    }
  }
}

export async function getProductsByFaceShape({
  faceShape,
  category,
  limit = 6
}: {
  faceShape: string
  category: string
  limit?: number
}) {
  try {
    // Get recommended glasses shape for the face shape
    const recommendedShape = getRecommendedGlassesShape(faceShape)
    
    // Fetch products with the recommended shape
    const result = await getRecommendedProducts({
      category,
      glassesShape: recommendedShape,
      limit
    })

    return {
      ...result,
      recommendedShape,
      faceShape
    }
  } catch (error) {
    console.error('Error fetching products by face shape:', error)
    return {
      success: false,
      products: [],
      recommendedShape: 'Oval',
      faceShape,
      error: 'Failed to fetch products by face shape'
    }
  }
}
