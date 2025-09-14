
'use client'
import Image from 'next/image'
import { useState } from 'react'

const ImageHover = ({
  src,
  hoverSrc,
  alt,
  onError,
  onLoad,
}: {
  src: string
  hoverSrc: string
  alt: string
  onError?: () => void
  onLoad?: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  let hoverTimeout: any

  const handleMouseEnter = () => {
    if (!imageError) {
      hoverTimeout = setTimeout(() => setIsHovered(true), 1000) // 1 second delay
    }
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout)
    setIsHovered(false)
  }

  const handleImageError = () => {
    setImageError(true)
    onError?.()
  }

  const handleImageLoad = () => {
    setImageError(false)
    onLoad?.()
  }

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
          <p className="text-xs">لا يمكن تحميل الصورة</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className='relative h-52'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes='80vw'
        className={`object-contain transition-opacity duration-500 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={false}
      />
      <Image
        src={hoverSrc}
        alt={alt}
        fill
        sizes='80vw'
        className={`absolute inset-0 object-contain transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={false}
      />
    </div>
  )
}

export default ImageHover
