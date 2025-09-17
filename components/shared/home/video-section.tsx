'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Play } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'

interface VideoItem {
  id: string
  url: string
  title: string
  link?: string
}

interface VideoSectionProps {
  videos: VideoItem[]
}

// Video Preview Component - Optimized loading with timeout and lazy loading
function VideoPreview({ video }: { video: VideoItem }) {
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Timeout for loading - if video doesn't load in 8 seconds, show error
  React.useEffect(() => {
    if (!isInView) return

    const timeout = setTimeout(() => {
      if (isLoading && !hasStarted) {
        setVideoError(true)
        setIsLoading(false)
      }
    }, 8000) // 8 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading, hasStarted, isInView])

  const handleVideoError = () => {
    setVideoError(true)
    setIsLoading(false)
  }

  const handleVideoLoaded = () => {
    setVideoError(false)
    setIsLoading(false)
    setHasStarted(true)
  }

  const handleVideoCanPlay = () => {
    setVideoError(false)
    setIsLoading(false)
    setHasStarted(true)
  }

  const handleVideoLoadStart = () => {
    setHasStarted(true)
  }

  return (
    <div className="relative group flex-shrink-0 w-48">
      <VideoModal video={video}>
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[9/16] cursor-pointer group-hover:scale-105 transition-transform duration-300">
          {videoError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-500">
                <Play className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">لا يمكن تحميل الفيديو</p>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                </div>
              )}
              <video
                ref={videoRef}
                src={isInView ? video.url : undefined}
                className="w-full h-full object-cover"
                autoPlay={isInView}
                muted
                loop
                playsInline
                controls={false}
                preload={isInView ? "auto" : "none"}
                onError={handleVideoError}
                onLoadStart={handleVideoLoadStart}
                onLoadedData={handleVideoLoaded}
                onCanPlay={handleVideoCanPlay}
                onMouseEnter={(e) => {
                  if (!videoError && !isLoading && hasStarted && isInView) {
                    e.currentTarget.play().catch(() => {})
                  }
                }}
                onMouseLeave={(e) => {
                  if (!videoError && !isLoading && hasStarted && isInView) {
                    e.currentTarget.pause()
                  }
                }}
              />
            </>
          )}
          
          {/* Play icon overlay - Bottom left */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all duration-200 shadow-lg group-hover:scale-110">
              <Play className="text-white fill-white w-5 h-5" />
            </div>
          </div>
          
          {/* Always visible overlay with title and button */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-white text-lg font-bold drop-shadow-lg flex-1 text-right">
                {video.title}
              </h3>
              {video.link && (
                <Link href={video.link} className="mr-3" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    className="bg-white text-black hover:bg-gray-100 font-medium p-2 rounded-full shadow-lg"
                    title="عرض المزيد"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </VideoModal>
    </div>
  )
}

// Video Modal Component
function VideoModal({ video, children }: { video: VideoItem; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const handleVideoError = () => {
    if (retryCount < 2) {
      // Retry up to 2 times
      setRetryCount(prev => prev + 1)
      setIsLoading(true)
      // Force re-render by updating the src
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    } else {
      setVideoError(true)
      setIsLoading(false)
    }
  }

  const handleVideoLoaded = () => {
    setVideoError(false)
    setIsLoading(false)
    setRetryCount(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
        <DialogTitle className="sr-only">
          {video.title} - فيديو
        </DialogTitle>
        <div className="relative w-full aspect-video">
          {videoError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <p className="text-lg mb-2">عذراً، لا يمكن تحميل الفيديو</p>
                <p className="text-sm text-gray-400">يرجى المحاولة مرة أخرى لاحقاً</p>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              <video
                src={video.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                preload="metadata"
                onError={handleVideoError}
                onLoadedData={(e) => {
                  // Ensure video plays with audio when modal opens
                  e.currentTarget.muted = false
                  handleVideoLoaded()
                }}
                onCanPlay={handleVideoLoaded}
                key={`${video.url}-${retryCount}`}
              />
            </>
          )}
        </div>
        <div className="p-4 bg-white">
          <h3 className="text-xl font-bold text-center text-gray-900">
            {video.title}
          </h3>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function VideoSection({ videos }: VideoSectionProps) {
  // Don't render if no videos
  if (!videos || videos.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <Card className="w-full rounded-xl shadow-sm">
        <CardContent className="card-mobile">
          <h2 className="text-2xl font-bold mb-6 text-right">أحدث المجموعات</h2>
          {/* Horizontal scrollable row for both mobile and desktop */}
          <div className='flex gap-4 overflow-x-auto pb-2 scrollbar-hide' 
               ref={(el) => {
                 if (el && videos.length > 1) {
                   // Scroll to middle video on mount
                   const middleIndex = Math.floor(videos.length / 2)
                   const middleVideo = el.children[middleIndex] as HTMLElement
                   if (middleVideo) {
                     middleVideo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
                   }
                 }
               }}>
            {videos.map((video) => (
              <VideoPreview key={video.id} video={video} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
