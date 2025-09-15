
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useCartStore from '@/hooks/use-cart-store'
import { IProduct } from '@/types'
import { useLoading } from '@/hooks/use-loading'
import { LoadingSpinner } from '@/components/shared/loading-overlay'
import SelectVariant from './select-variant'
import LensSizeSelector from './lens-size-selector'

interface AddToCartProps {
  product: IProduct
  className?: string
}

export default function AddToCart({ product, className }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedLensSize, setSelectedLensSize] = useState<string | null>(null)
  const { addItem } = useCartStore()
  const { toast } = useToast()
  const { isLoading: isAddingToCart, withLoading } = useLoading()

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(99, quantity + value))
    setQuantity(newQuantity)
  }

  const handleAddToCart = async () => {
    // Check if color selection is required
    if (product.colors && product.colors.length > 1 && !selectedColor) {
      toast({
        title: 'يرجى اختيار اللون',
        description: 'اختر لون المنتج قبل الإضافة إلى السلة',
        variant: 'destructive',
      })
      return
    }

    // Check if size selection is required
    if (product.sizes && product.sizes.length > 1 && !selectedSize) {
      toast({
        title: 'يرجى اختيار الحجم',
        description: 'اختر حجم المنتج قبل الإضافة إلى السلة',
        variant: 'destructive',
      })
      return
    }

    if (product.lensSizes && product.lensSizes.length > 0 && !selectedLensSize) {
      toast({
        title: 'يرجى اختيار حجم العدسة',
        description: 'اختر حجم العدسة المناسب قبل الإضافة إلى السلة',
        variant: 'destructive',
      })
      return
    }

    await withLoading(
      async () => {
        await addItem({
          product: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          image: product.images[0],
          price: Number(product.price), // Convert to number to prevent toFixed errors
          countInStock: product.countInStock,
          color: selectedColor || product.colors[0] || '',
          size: selectedSize || product.sizes[0] || '',
          lensSize: selectedLensSize || product.lensSizes?.[0] || '',
          quantity: 1,
          clientId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          requiresMedicalCertificate: product.requiresMedicalCertificate || false,
        }, quantity)

        toast({
          title: 'تمت الإضافة إلى السلة',
          description: `تم إضافة ${product.name} إلى سلة التسوق الخاصة بك`,
          variant: 'default',
        })

        // Reset quantity and lens size
        setQuantity(1)
        setSelectedLensSize(null)
      }
    )
  }

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {(product.colors.length > 1 || product.sizes.length > 1) && (
        <div className='space-y-3'>
          {product.colors.length > 1 && (
            <div>
              <label className='font-medium mb-2 block'>اللون:</label>
              <div className='flex gap-2'>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`px-3 py-1 border rounded ${
                      selectedColor === color ? 'border-primary bg-primary text-white' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.sizes.length > 1 && (
            <div>
              <label className='font-medium mb-2 block'>الحجم:</label>
              <div className='flex gap-2'>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-3 py-1 border rounded ${
                      selectedSize === size ? 'border-primary bg-primary text-white' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lens Size Selection */}
      <LensSizeSelector
        product={product}
        selectedLensSize={selectedLensSize}
        onLensSizeChange={setSelectedLensSize}
      />

      <div className='flex items-center justify-between gap-4'>
        {/* Quantity Controls - left side for RTL */}
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className='h-4 w-4' />
          </Button>
          <Input
            type='number'
            min='1'
            max='99'
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className='w-20 text-center'
          />
          <Button
            variant='outline'
            size='icon'
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 99}
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        
      </div>

      <Button
        onClick={handleAddToCart}
        className="w-full rounded-full font-bold"
        disabled={isAddingToCart}
      >
        {isAddingToCart ? (
          <LoadingSpinner size="sm" text="جاري الإضافة..." />
        ) : (
          <>
            <ShoppingCart className="ml-2 h-4 w-4" />
            أضف إلى السلة
          </>
        )}
      </Button>
    </div>
  )
}
