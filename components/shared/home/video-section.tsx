'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Play } from 'lucide-react'

interface VideoItem {
  id: string
  url: string
  title: string
  link?: string
}

interface VideoSectionProps {
  videos: VideoItem[]
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
          {/* Mobile: Horizontal scrollable row starting from middle */}
          <div className='flex gap-4 overflow-x-auto pb-2 md:hidden scrollbar-hide' 
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
              <div key={video.id} className="relative group flex-shrink-0 w-48">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[9/16]">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    onMouseEnter={(e) => {
                      e.currentTarget.play()
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause()
                    }}
                  />
                  {/* Always visible overlay with title and button - Mobile: bottom layout */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-white text-lg font-bold drop-shadow-lg flex-1 text-right">
                        {video.title}
                      </h3>
                      {video.link && (
                        <Link href={video.link} className="mr-3">
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
              </div>
            ))}
          </div>
          
          {/* Desktop: Centered grid layout with full width */}
          <div className={`hidden md:grid gap-4 sm:gap-6 ${
            videos.length === 1 
              ? 'grid-cols-1' 
              : videos.length === 2 
                ? 'grid-cols-2' 
                : videos.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-3'
          }`} style={{ gridTemplateRows: '1fr' }}>
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[9/16]">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    onMouseEnter={(e) => {
                      e.currentTarget.play()
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause()
                    }}
                  />
                  {/* Always visible overlay with title and button */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-4">
                    <h3 className="text-white text-lg font-bold text-center mb-4 drop-shadow-lg">
                      {video.title}
                    </h3>
                    {video.link && (
                      <Link href={video.link}>
                        <Button 
                          size="sm" 
                          className="bg-white text-black hover:bg-gray-100 font-medium px-6 py-2 rounded-full shadow-lg"
                        >
                          عرض المزيد
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
