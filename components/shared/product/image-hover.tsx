
'use client'
import Image from 'next/image'
import { useState } from 'react'

const ImageHover = ({
  src,
  hoverSrc,
  alt,
}: {
  src: string
  hoverSrc: string
  alt: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  let hoverTimeout: any

  const handleMouseEnter = () => {
    hoverTimeout = setTimeout(() => setIsHovered(true), 1000) // 1 second delay
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout)
    setIsHovered(false)
  }

  return (
    <div
      className='relative w-full h-full'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 96px, (max-width: 1200px) 50vw, 33vw"
        className={`object-contain transition-opacity duration-500 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        priority={false}
      />
      <Image
        src={hoverSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 96px, (max-width: 1200px) 50vw, 33vw"
        className={`absolute inset-0 object-contain transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        priority={false}
      />
    </div>
  )
}

export default ImageHover
