'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Eye, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  price: number
  listPrice: number
  brand: string
  avgRating: number
  numReviews: number
  glassesShape?: string
  category: string
}

interface ProductDisplayProps {
  products: Product[]
  faceShape?: string
  recommendedShape?: string
  category: string
}

export default function ProductDisplay({ 
  products, 
  faceShape, 
  recommendedShape, 
  category 
}: ProductDisplayProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 font-cairo">
          لم نتمكن من العثور على منتجات مطابقة لشكل وجهك في هذه الفئة.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with face shape info */}
      {faceShape && recommendedShape && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 font-cairo mb-2">
              🎯 توصيات مخصصة لشكل وجهك
            </h3>
            <p className="text-sm text-gray-600 font-cairo">
              بناءً على تحليل وجهك <span className="font-bold text-blue-600">{faceShape}</span>، 
              ننصحك بالنظارات ذات الشكل <span className="font-bold text-purple-600">{recommendedShape}</span>
            </p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <Link href={`/product/${product.slug}`}>
                  <Image
                    src={product.images[0] || '/placeholder-glasses.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                
                {/* Glasses Shape Badge */}
                {product.glassesShape && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-white/90 text-gray-800 hover:bg-white"
                  >
                    {product.glassesShape}
                  </Badge>
                )}

                {/* Quick View Button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white"
                    asChild
                  >
                    <Link href={`/product/${product.slug}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      عرض سريع
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                {/* Brand */}
                <div className="text-xs text-gray-500 font-cairo">
                  {product.brand}
                </div>

                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 font-cairo line-clamp-2 group-hover:text-blue-600 transition-colors">
                  <Link href={`/product/${product.slug}`}>
                    {product.name}
                  </Link>
                </h3>

                {/* Rating */}
                {product.avgRating > 0 && (
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.avgRating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-cairo">
                      ({product.numReviews})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-lg font-bold text-gray-900 font-cairo">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.listPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through font-cairo">
                        ${product.listPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    asChild
                  >
                    <Link href={`/product/${product.slug}`}>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      عرض
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Products Link */}
      <div className="text-center pt-4">
        <Button
          variant="outline"
          className="font-cairo"
          asChild
        >
          <Link href={`/search?category=${encodeURIComponent(category)}${recommendedShape ? `&glassesShape=${encodeURIComponent(recommendedShape)}` : ''}`}>
            عرض جميع المنتجات المقترحة
            <Eye className="w-4 h-4 mr-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
