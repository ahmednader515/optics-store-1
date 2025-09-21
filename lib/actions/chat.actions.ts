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
      // Try exact match first
      where.glassesShape = glassesShape
    }
    
    console.log('=== getRecommendedProducts Debug ===')
    console.log('Category:', category)
    console.log('GlassesShape:', glassesShape)
    console.log('Where clause:', where)

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
    
    console.log('Raw products from DB:', products.length)
    products.forEach((p, i) => {
      console.log(`Product ${i + 1}:`, { name: p.name, category: p.category, glassesShape: p.glassesShape })
    })
    
    // Debug: Check if any products exist in this category at all
    const allProductsInCategory = await prisma.product.findMany({
      where: { 
        isPublished: true,
        category: category
      },
      select: { name: true, glassesShape: true }
    })
    console.log(`All products in category "${category}":`, allProductsInCategory.length)
    allProductsInCategory.forEach((p, i) => {
      console.log(`Category product ${i + 1}:`, { name: p.name, glassesShape: p.glassesShape })
    })

    // Convert Decimal values to numbers
    const normalizedProducts = products.map((product: any) => ({
      ...product,
      price: Number(product.price),
      listPrice: Number(product.listPrice),
      avgRating: Number(product.avgRating),
      numReviews: Number(product.numReviews),
    }))
    
    console.log('Normalized products:', normalizedProducts.length)
    
    // If no products found with exact match, try case-insensitive search
    if (normalizedProducts.length === 0 && glassesShape) {
      console.log('No products found with exact match, trying case-insensitive search...')
      
      const caseInsensitiveProducts = await prisma.product.findMany({
        where: {
          isPublished: true,
          category: category,
          glassesShape: {
            mode: 'insensitive',
            contains: glassesShape
          }
        },
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
      
      console.log('Case-insensitive products found:', caseInsensitiveProducts.length)
      caseInsensitiveProducts.forEach((p, i) => {
        console.log(`Case-insensitive product ${i + 1}:`, { name: p.name, glassesShape: p.glassesShape })
      })
      
      if (caseInsensitiveProducts.length > 0) {
        const normalizedCaseInsensitiveProducts = caseInsensitiveProducts.map((product: any) => ({
          ...product,
          price: Number(product.price),
          listPrice: Number(product.listPrice),
          avgRating: Number(product.avgRating),
          numReviews: Number(product.numReviews),
        }))
        
        console.log('Using case-insensitive results:', normalizedCaseInsensitiveProducts.length)
        return {
          success: true,
          products: normalizedCaseInsensitiveProducts
        }
      }
      
      // If still no products found, return empty array to show "عذراً" message
      console.log('No products found with glasses shape filter, returning empty array')
      return {
        success: true,
        products: []
      }
    }
    
    console.log('=== End getRecommendedProducts Debug ===')

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
    
    // Use English shape names directly since that's what's stored in the database
    console.log('=== getProductsByFaceShape Debug ===')
    console.log('Input faceShape:', faceShape)
    console.log('Input category:', category)
    console.log('Recommended shape:', recommendedShape)
    
    // Fetch products with the recommended shape (using English values)
    const result = await getRecommendedProducts({
      category,
      glassesShape: recommendedShape,
      limit
    })
    
    console.log('getRecommendedProducts result:', result)
    console.log('Products found:', result.products?.length || 0)
    if (result.products && result.products.length > 0) {
      console.log('First product:', result.products[0])
    }
    console.log('=== End Debug ===')

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
