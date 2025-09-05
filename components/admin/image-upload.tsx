'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X, Image as ImageIcon } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import { toast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  disabled?: boolean
  className?: string
}

export default function ImageUpload({ value, onChange, disabled, className = '' }: ImageUploadProps) {
  const handleUploadComplete = (res: { url: string }[]) => {
    const url = res?.[0]?.url
    if (!url) return
    onChange(url)
    toast({
      title: 'تم رفع الصورة',
      description: 'تم رفع الصورة بنجاح',
      variant: 'default'
    })
  }

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error)
    toast({
      title: 'خطأ في رفع الصورة',
      description: 'فشل في رفع الصورة. حاول مرة أخرى.',
      variant: 'destructive'
    })
  }

  const handleRemoveImage = () => {
    onChange(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">صورة الفئة</label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img
              src={value}
              alt="Category preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={disabled}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">لم يتم اختيار صورة</p>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
