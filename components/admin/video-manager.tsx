'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Video, Upload } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'

interface VideoItem {
  id: string
  url: string
  title: string
  link?: string
}

interface VideoManagerProps {
  videos: VideoItem[]
  onVideosChange: (videos: VideoItem[]) => void
}

export default function VideoManager({ videos, onVideosChange }: VideoManagerProps) {
  const addVideo = () => {
    const newVideo: VideoItem = {
      id: Date.now().toString(),
      url: '',
      title: `فيديو ${videos.length + 1}`
    }
    onVideosChange([...videos, newVideo])
  }

  const removeVideo = (index: number) => {
    if (videos.length > 1) {
      const newVideos = videos.filter((_, i) => i !== index)
      onVideosChange(newVideos)
    } else {
      toast({
        title: 'لا يمكن الحذف',
        description: 'يجب أن يحتوي على فيديو واحد على الأقل',
        variant: 'destructive'
      })
    }
  }

  const updateVideo = (index: number, field: keyof VideoItem, value: string) => {
    const newVideos = [...videos]
    newVideos[index] = { ...newVideos[index], [field]: value }
    onVideosChange(newVideos)
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Video className='h-5 w-5' />
            إدارة الفيديوهات
          </CardTitle>
          <Button onClick={addVideo} size='sm'>
            <Plus className='h-4 w-4 ml-2' />
            إضافة فيديو
          </Button>
        </div>
        <p className='text-sm text-muted-foreground mt-2'>
          قم بإدارة الفيديوهات التي ستظهر في الصفحة الرئيسية
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {videos.map((video, index) => (
          <div key={video.id} className='border rounded-lg p-4 space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold'>فيديو {index + 1}</h4>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => removeVideo(index)}
              >
                <Trash2 className='h-4 w-4 ml-2' />
                حذف
              </Button>
            </div>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor={`videoTitle${index}`}>عنوان الفيديو</Label>
                <Input
                  id={`videoTitle${index}`}
                  value={video.title}
                  onChange={(e) => updateVideo(index, 'title', e.target.value)}
                  placeholder='عنوان الفيديو'
                />
              </div>
              
              <div className='space-y-2'>
                <Label htmlFor={`videoLink${index}`}>رابط الصفحة (اختياري)</Label>
                <Input
                  id={`videoLink${index}`}
                  value={video.link || ''}
                  onChange={(e) => updateVideo(index, 'link', e.target.value)}
                  placeholder='رابط الصفحة المراد فتحها عند الضغط على الزر'
                />
              </div>
              
              <div className='space-y-2'>
                <Label>رابط الفيديو</Label>
                <div className='flex items-center gap-4'>
                  <div className='w-20 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden'>
                    {video.url ? (
                      <video 
                        src={video.url} 
                        className='w-full h-full object-cover'
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <Video className='h-6 w-6 text-gray-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <Input
                      value={video.url}
                      onChange={(e) => updateVideo(index, 'url', e.target.value)}
                      placeholder='رابط الفيديو'
                    />
                  </div>
                  <div>
                    <UploadButton
                      endpoint="videoUploader"
                      onClientUploadComplete={(res: { url: string }[]) => {
                        const url = res?.[0]?.url
                        if (!url) return
                        updateVideo(index, 'url', url)
                        toast({
                          title: 'تم رفع الفيديو',
                          description: 'تم رفع الفيديو بنجاح',
                          variant: 'default'
                        })
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          title: 'خطأ في رفع الفيديو',
                          description: 'فشل في رفع الفيديو. حاول مرة أخرى.',
                          variant: 'destructive'
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
