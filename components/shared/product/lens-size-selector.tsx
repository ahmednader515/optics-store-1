'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/types'

interface LensSizeSelectorProps {
  product: IProduct
  selectedLensSize: string | null
  onLensSizeChange: (lensSize: string) => void
  className?: string
}

export default function LensSizeSelector({
  product,
  selectedLensSize,
  onLensSizeChange,
  className = ''
}: LensSizeSelectorProps) {
  // Only show lens size selector if product has lens sizes
  if (!product.lensSizes || product.lensSizes.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className='font-medium mb-2 block text-sm'>حجم العدسة:</label>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
          {product.lensSizes.map((lensSize) => (
            <Button
              key={lensSize}
              variant={selectedLensSize === lensSize ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLensSizeChange(lensSize)}
              className={`text-xs sm:text-sm ${
                selectedLensSize === lensSize 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' 
                  : 'border-gray-300 hover:border-orange-500'
              }`}
            >
              {lensSize}
            </Button>
          ))}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          اختر حجم العدسة المناسب لوصفتك الطبية
        </p>
      </div>
    </div>
  )
}
