"use client"

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IProductInput } from "@/types";
import Rating from "./rating";
import { formatNumber, generateId, round2 } from "@/lib/utils";
import ProductPrice from "./product-price";
import ImageHover from "./image-hover";
import { Eye } from "lucide-react";

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
}: {
  product: IProductInput & { id: string };
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}) => {
  const ProductImage = () => {
    const [imageError, setImageError] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)
    const [retryCount, setRetryCount] = React.useState(0)

    const handleImageError = () => {
      if (retryCount < 2) {
        // Retry up to 2 times
        setRetryCount(prev => prev + 1)
        setIsLoading(true)
        // Force re-render by updating the src
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      } else {
        setImageError(true)
        setIsLoading(false)
      }
    }

    const handleImageLoad = () => {
      setImageError(false)
      setIsLoading(false)
      setRetryCount(0)
    }

    // Fallback image
    const fallbackImage = '/images/p11-1.jpg'
    const currentImageSrc = product.images?.[0] || fallbackImage

    return (
      <div className="relative group w-full h-full">
        <Link href={`/product/${product.slug}`}>
          <div className="relative h-24 w-24 md:h-48 md:w-full sm:md:h-56 lg:md:h-64 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
                  <p className="text-xs">لا يمكن تحميل الصورة</p>
                </div>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                  </div>
                )}
                {product.images && product.images.length > 1 ? (
                  <ImageHover
                    src={currentImageSrc}
                    hoverSrc={product.images[1] || fallbackImage}
                    alt={product.name}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <Image
                    src={currentImageSrc}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 96px, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    priority={false}
                    key={`${currentImageSrc}-${retryCount}`}
                  />
                )}
              </>
            )}
            
            {/* Quick action buttons overlay - hidden on mobile to save space */}
            <div className="absolute top-1 left-1 md:top-2 md:left-2 sm:md:top-3 sm:md:left-3 flex flex-col gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex">
              <button className="p-1 sm:p-1.5 md:p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110">
                <Eye className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-600" />
              </button>
            </div>
            
            {/* Stock status badge - smaller on mobile */}
            {product.countInStock <= 10 && product.countInStock > 0 && (
              <Badge variant="destructive" className="absolute top-1 right-1 md:top-2 md:right-2 sm:md:top-3 sm:md:right-3 text-xs scale-75 md:scale-100">
                آخر {product.countInStock} قطع
              </Badge>
            )}
            {product.countInStock === 0 && (
              <Badge variant="secondary" className="absolute top-1 right-1 md:top-2 md:right-2 sm:md:top-3 sm:md:right-3 text-xs bg-gray-500 scale-75 md:scale-100">
                نفذت الكمية
              </Badge>
            )}
          </div>
        </Link>
      </div>
    )
  };

  const ProductDetails = () => (
    <div className="flex-1 space-y-2 md:space-y-3 lg:space-y-4 p-2 md:p-3 lg:p-4" dir="rtl">
      {/* Product Name */}
      <Link
        href={`/product/${product.slug}`}
        className="block group"
      >
        <h3 
          className="font-semibold text-black text-right leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors duration-200 text-xs md:text-sm lg:text-base"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {product.name}
        </h3>
      </Link>

      {/* Rating and Reviews - Clean Number Design */}
      <div className="flex flex-col items-start gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs text-gray-500">التقييم:</span>
          <div className="bg-yellow-100 text-yellow-800 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-xs font-semibold">
            {product.avgRating && !isNaN(product.avgRating) ? product.avgRating.toFixed(1) : '0.0'}
          </div>
        </div>
        <span className="text-xs text-gray-500 text-left">
          ({product.numReviews && !isNaN(product.numReviews) ? formatNumber(product.numReviews) : '0'} تقييم)
        </span>
      </div>

      {/* Price */}
      <div className="text-left">
        <ProductPrice
          price={product.price}
          originalPrice={product.listPrice}
          className="items-start"
        />
      </div>
    </div>
  );

  const AddButton = () => (
    <div className="p-2 md:p-3 lg:p-4 pt-0">
      <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1.5 md:py-2 lg:py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm lg:text-base">
        <svg className="w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
        <span className="hidden sm:inline">إضافة للسلة</span>
        <span className="sm:hidden">إضافة</span>
      </button>
    </div>
  );

  if (hideBorder) {
    return (
      <div className="flex flex-col md:flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group" dir="rtl">
        {/* Mobile: Horizontal layout with image on left, content on right */}
        <div className="flex flex-row md:flex-col">
          {/* Image section - appears first on mobile (left side) */}
          <div className="w-24 h-24 md:w-full md:h-auto flex-shrink-0 order-1 md:order-1">
            <ProductImage />
          </div>
          
          {/* Content section - appears second on mobile (right side) */}
          {!hideDetails && (
            <div className="flex-1 md:flex-none order-2 md:order-2">
              <ProductDetails />
            </div>
          )}
        </div>
        
        {/* Add to cart button - full width below on mobile */}
        {!hideDetails && !hideAddToCart && (
          <div className="order-3">
            <AddButton />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="flex flex-col md:flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border-0" dir="rtl">
      {/* Mobile: Horizontal layout with image on left, content on right */}
      <div className="flex flex-row md:flex-col">
        {/* Image section - appears first on mobile (left side) */}
        <div className="w-24 h-24 md:w-full md:h-auto flex-shrink-0 order-1 md:order-1">
          <ProductImage />
        </div>
        
        {/* Content section - appears second on mobile (right side) */}
        {!hideDetails && (
          <div className="flex-1 md:flex-none order-2 md:order-2">
            <ProductDetails />
          </div>
        )}
      </div>
      
      {/* Add to cart button - full width below on mobile */}
      {!hideDetails && !hideAddToCart && (
        <div className="order-3">
          <AddButton />
        </div>
      )}
    </Card>
  );
};

export default ProductCard;
