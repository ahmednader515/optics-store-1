'use client'

import React, { useState, useEffect } from 'react'
import VirtualTryOn from '@/components/shared/virtual-try-on'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Home, ShoppingCart, User, Shield, Glasses } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import data from '@/lib/data'
import MobileCartCount from '@/components/shared/header/mobile-cart-count'
import { useSession } from 'next-auth/react'

type Product = {
  id: string
  name: string
  images: string[]
  price: number
  brand: string
  category: string
  tags: string[]
}

export default function TryOnPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        
        // First try to fetch from database via API
        const response = await fetch('/api/products?limit=100&page=1')
        
        if (response.ok) {
          const result = await response.json()
          console.log('Loaded products from database:', result.products.length)
          setProducts(result.products)
        } else {
          throw new Error('API request failed')
        }
      } catch (err) {
        console.error('Error loading products from database:', err)
        
        // Fallback to static data if database fails
        console.log('Falling back to static data')
        const fallbackProducts = data.products.map((product: any, index: number) => ({
          id: `fallback-${index}`,
          name: product.name,
          images: product.images || [],
          price: product.price,
          brand: product.brand,
          category: product.category,
          tags: product.tags || []
        }))
        setProducts(fallbackProducts)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Function to extract try-on image from tags
  const getTryOnImage = (product: Product) => {
    if (!product.tags || !Array.isArray(product.tags)) {
      return product.images?.[0] || '/placeholder-glasses.jpg'
    }
    
    const vtoTag = product.tags.find((tag: string) => 
      typeof tag === 'string' && tag.startsWith('vto=')
    )
    
    if (vtoTag) {
      return vtoTag.slice(4) // Remove 'vto=' prefix
    }
    
    // Fallback to regular product image
    return product.images?.[0] || '/placeholder-glasses.jpg'
  }

  const currentProduct = products[currentProductIndex]
  const currentOverlayImage = currentProduct ? getTryOnImage(currentProduct) : '/placeholder-glasses.jpg'

  const nextProduct = () => {
    setCurrentProductIndex((prev) => 
      prev < products.length - 1 ? prev + 1 : 0
    )
  }

  const prevProduct = () => {
    setCurrentProductIndex((prev) => 
      prev > 0 ? prev - 1 : products.length - 1
    )
  }

  // Swipe handling functions
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextProduct()
    }
    if (isRightSwipe) {
      prevProduct()
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading glasses...</p>
        </div>
      </div>
    )
  }


  if (products.length === 0 && !isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">No products available for try-on</p>
          <p className="text-sm text-gray-300 mb-4">Please check back later</p>
          <Link href="/">
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col pb-32 md:pb-0">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </Link>
          
          {currentProduct && (
            <div className="text-center text-white">
              <h1 className="text-lg font-semibold">{currentProduct.name}</h1>
              <p className="text-sm text-gray-300">{currentProduct.brand}</p>
            </div>
          )}
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Camera View - Full height without altering internals */}
      <div 
        className="flex-1 relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <VirtualTryOn overlayImageUrl={currentOverlayImage} showSizeControls={false} expandContainer />
      </div>

      {/* Circular Product Selection - Side by Side */}
      <div className="absolute bottom-28 left-0 right-0 z-10 flex justify-center">
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 max-w-full">
          {products.map((product, index) => (
            <button
              key={product.id}
              onClick={() => setCurrentProductIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                index === currentProductIndex
                  ? 'border-white shadow-lg'
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <Image
                src={getTryOnImage(product)}
                alt={product.name || 'Glasses'}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-glasses.jpg';
                }}
              />
            </button>
          ))}
        </div>
      </div>


      {/* Mobile Bottom Navigation - Fixed at bottom on mobile only */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden" dir="rtl">
        <div className="bg-white border border-gray-200 rounded-full shadow-lg">
          <div className="flex items-center justify-center gap-4 sm:gap-6 py-4 px-6">
          {/* Homepage Button */}
          <Link href="/" className="flex flex-col items-center gap-1">
            <Home className="w-6 h-6 text-gray-600" />
            <span className="text-xs text-gray-600">الرئيسية</span>
          </Link>
          
          {/* Shopping Cart */}
          <Link href="/cart" className="flex flex-col items-center gap-1">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <MobileCartCount />
            </div>
            <span className="text-xs text-gray-600">السلة</span>
          </Link>
          
          {/* Glasses Button - Center with black background, larger size, and extending out */}
          <Link href="/try-on" className="flex flex-col items-center">
            <div className="bg-black rounded-full p-4 -mt-6 shadow-lg border-4 border-white">
              <Glasses className="w-10 h-10 text-white" />
            </div>
          </Link>
          
          {/* User Actions */}
          {session ? (
            <>
              {/* Account Button */}
              <Link href="/account" className="flex flex-col items-center gap-1">
                <User className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">حسابي</span>
              </Link>
              
              {/* Admin Button - Only show for Admin users */}
              {session.user.role === 'Admin' && (
                <Link href="/admin/overview" className="flex flex-col items-center gap-1">
                  <Shield className="w-6 h-6 text-primary" />
                  <span className="text-xs text-primary font-medium">الإدارة</span>
                </Link>
              )}
            </>
          ) : (
            /* Sign In Button */
            <Link href="/sign-in" className="flex flex-col items-center gap-1">
              <User className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-600">تسجيل الدخول</span>
            </Link>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
