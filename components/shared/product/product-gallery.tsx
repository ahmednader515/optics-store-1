'use client'

import { useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0)
  return (
    <div className='flex flex-col md:flex-row gap-2 md:gap-2'>
      {/* Main Image - Full width on mobile, flex-1 on desktop */}
      <div className='w-full md:flex-1 order-1 md:order-2'>
        <Zoom>
          <div className='relative h-[300px] sm:h-[400px] md:h-[500px]'>
            <Image
              src={images[selectedImage]}
              alt={'product image'}
              fill
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw'
              className='object-contain'
              priority
            />
          </div>
        </Zoom>
      </div>

      {/* Thumbnail Images - Below main image on mobile, beside on desktop */}
      <div className='flex flex-row md:flex-col gap-2 md:mt-8 order-2 md:order-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0'>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedImage(index)
            }}
            onMouseOver={() => {
              setSelectedImage(index)
            }}
            className={`bg-white rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 hover:scale-105 ${
              selectedImage === index
                ? 'border-orange-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Image 
              src={image} 
              alt={'product image'} 
              width={48} 
              height={48}
              className='w-12 h-12 md:w-12 md:h-12 object-cover'
            />
          </button>
        ))}
      </div>
    </div>
  )
}
