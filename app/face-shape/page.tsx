'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/shared/loading-overlay'
import Image from 'next/image'
import { Camera, Upload, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import FaceShapeDetector to ensure it only loads on client side
const FaceShapeDetector = dynamic(() => import('@/components/face-shape-detector').then(mod => ({ default: mod.FaceShapeDetector })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="mr-2">جاري تحميل أداة التحليل...</span>
    </div>
  )
})

export default function FaceShapePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [faceShape, setFaceShape] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [landmarks, setLandmarks] = useState<any>(null)
  const [apiSource, setApiSource] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()

  const handleImageUpload = (res: { url: string }[]) => {
    if (res && res[0]?.url) {
      setUploadedImage(res[0].url)
      setFaceShape(null)
      setRecommendations([])
      setConfidence(null)
      setLandmarks(null)
      setApiSource(null)
      setDebugInfo(null)
      toast({
        description: 'تم رفع الصورة بنجاح! اضغط على "تحليل شكل الوجه" للبدء',
      })
    }
  }

  const handleDetectionStart = () => {
    // Clear previous results when starting new detection
    setFaceShape(null)
    setRecommendations([])
    setConfidence(null)
    setLandmarks(null)
    setApiSource(null)
    setDebugInfo(null)
    setIsAnalyzing(true)
  }

  const handleUploadError = (error: Error) => {
    toast({
      variant: 'destructive',
      description: `خطأ في رفع الصورة: ${error.message}`,
    })
  }

  const handleFaceShapeResult = (result: any) => {
    setFaceShape(result.faceShape)
    setConfidence(result.confidence)
    setLandmarks(result.landmarks)
    setApiSource('face-api.js')
    
    // Calculate debug info from landmarks if available
    let debugInfo = {
      faceRatio: 'N/A',
      jawRatio: 'N/A',
      cheekboneRatio: 'N/A',
      foreheadRatio: 'N/A',
      faceWidth: 'N/A',
      faceHeight: 'N/A',
      jawWidth: 'N/A',
      cheekboneWidth: 'N/A',
      foreheadWidth: 'N/A',
      contourPoints: 0
    }
    
    if (result.landmarks) {
      const landmarks = result.landmarks
      const jawLeft = landmarks.contour_left1
      const jawRight = landmarks.contour_right1
      const chin = landmarks.contour_chin
      const leftCheek = landmarks.contour_left6
      const rightCheek = landmarks.contour_right6
      const leftEye = landmarks.left_eye_center
      const rightEye = landmarks.right_eye_center
      const noseTip = landmarks.nose_tip
      
      if (jawLeft && jawRight && chin && leftCheek && rightCheek && leftEye && rightEye && noseTip) {
        const faceLength = Math.sqrt(Math.pow(noseTip.x - chin.x, 2) + Math.pow(noseTip.y - chin.y, 2)) * 2.5
        const jawWidth = Math.sqrt(Math.pow(jawLeft.x - jawRight.x, 2) + Math.pow(jawLeft.y - jawRight.y, 2))
        const cheekboneWidth = Math.sqrt(Math.pow(leftCheek.x - rightCheek.x, 2) + Math.pow(leftCheek.y - rightCheek.y, 2))
        const eyeDistance = Math.sqrt(Math.pow(leftEye.x - rightEye.x, 2) + Math.pow(leftEye.y - rightEye.y, 2))
        const foreheadWidth = eyeDistance * 1.6
        const faceWidth = Math.max(jawWidth, cheekboneWidth, foreheadWidth)
        
        debugInfo = {
          faceRatio: (faceLength / faceWidth).toFixed(3),
          jawRatio: (jawWidth / faceWidth).toFixed(3),
          cheekboneRatio: (cheekboneWidth / jawWidth).toFixed(3),
          foreheadRatio: (foreheadWidth / jawWidth).toFixed(3),
          faceWidth: Math.round(faceWidth) + 'px',
          faceHeight: Math.round(faceLength) + 'px',
          jawWidth: Math.round(jawWidth) + 'px',
          cheekboneWidth: Math.round(cheekboneWidth) + 'px',
          foreheadWidth: Math.round(foreheadWidth) + 'px',
          contourPoints: Object.keys(result.landmarks).length
        }
      }
    }
    
    setDebugInfo(debugInfo)
    
    // Get recommendations based on face shape
    const recommendations = getGlassesRecommendations(result.faceShape)
    setRecommendations(recommendations)
    
    // Clear analyzing state
    setIsAnalyzing(false)
    
    toast({
      description: `تم تحليل شكل الوجه بنجاح! (دقة: ${result.confidence}%)`,
    })
  }

  const handleFaceShapeError = (error: string) => {
    setIsAnalyzing(false)
    toast({
      variant: 'destructive',
      description: `خطأ في تحليل الوجه: ${error}`,
    })
  }

  const getGlassesRecommendations = (faceShape: string): string[] => {
    const recommendations: { [key: string]: string[] } = {
      'Oval': [
        'النظارات البيضاوية تناسب وجهك تماماً',
        'يمكنك تجربة النظارات المستطيلة أيضاً',
        'النظارات المربعة تضيف لمسة أنيقة',
        'تجنب النظارات الدائرية الكبيرة'
      ],
      'Round': [
        'النظارات المربعة أو المستطيلة تناسبك',
        'النظارات العريضة تزيد من طول وجهك',
        'تجنب النظارات الدائرية الصغيرة',
        'النظارات ذات الحواف الحادة مثالية'
      ],
      'Square': [
        'النظارات الدائرية أو البيضاوية تناسبك',
        'النظارات ذات الحواف الناعمة مثالية',
        'تجنب النظارات المربعة أو العريضة',
        'النظارات ذات الإطار الرفيع مناسبة'
      ],
      'Heart': [
        'النظارات الدائرية أو البيضاوية تناسبك',
        'النظارات ذات الإطار السفلي العريض مثالية',
        'تجنب النظارات العريضة من الأعلى',
        'النظارات ذات الحواف الناعمة مناسبة'
      ],
      'Diamond': [
        'النظارات المربعة أو المستطيلة تناسبك',
        'النظارات العريضة تزيد من عرض وجهك',
        'تجنب النظارات الدائرية الصغيرة',
        'النظارات ذات الحواف الحادة مثالية'
      ],
      'Rectangle': [
        'النظارات العريضة تناسبك',
        'النظارات الدائرية أو البيضاوية مثالية',
        'تجنب النظارات الرفيعة أو الطويلة',
        'النظارات ذات الإطار العريض مناسبة'
      ],
      'Unknown': [
        'جرب أنواع مختلفة من النظارات',
        'استشر أخصائي بصريات',
        'النظارات البيضاوية خيار آمن',
        'اختبر أشكال مختلفة لترى الأنسب'
      ]
    }

    return recommendations[faceShape] || recommendations['Unknown']
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">تحليل شكل الوجه</h1>
          <p className="text-gray-600">
            ارفع صورة لوجهك واحصل على توصيات شخصية لشكل النظارات المناسب لك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                رفع صورة الوجه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!uploadedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    ارفع صورة واضحة لوجهك من الأمام
                  </p>
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={handleImageUpload}
                    onUploadError={handleUploadError}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={uploadedImage}
                      alt="Uploaded face"
                      width={400}
                      height={400}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setUploadedImage(null)
                          setFaceShape(null)
                          setRecommendations([])
                          setConfidence(null)
                          setLandmarks(null)
                          setApiSource(null)
                          setDebugInfo(null)
                        }}
                      >
                        إزالة
                      </Button>
                    </div>
                  </div>
                  
                  {/* Face Shape Detector Component */}
                  <FaceShapeDetector
                    imageUrl={uploadedImage}
                    onResult={handleFaceShapeResult}
                    onError={handleFaceShapeError}
                    onDetect={handleDetectionStart}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>نتائج التحليل</CardTitle>
            </CardHeader>
            <CardContent>
              {!faceShape ? (
                <div className="text-center text-gray-500 py-8">
                  <p>ارفع صورة واضحة لوجهك للحصول على التحليل</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      شكل الوجه المكتشف:
                    </h3>
                    <p className="text-blue-800 text-lg font-medium">
                      {faceShape}
                    </p>
                    {confidence && (
                      <p className="text-blue-600 text-sm mt-1">
                        مستوى الثقة: {confidence}%
                      </p>
                    )}
                    {apiSource && (
                      <p className="text-xs mt-1 text-blue-500">
                        مصدر التحليل: {apiSource === 'face-api.js' ? 'Face-API.js (محلي)' : apiSource}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">
                      التوصيات:
                    </h3>
                    <ul className="space-y-2">
                      {recommendations.map((recommendation, index) => (
                        <li key={index} className="text-green-800 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {debugInfo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        تفاصيل التحليل التقني:
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>نسبة الطول للعرض: {debugInfo.faceRatio}</div>
                        <div>نسبة الفك: {debugInfo.jawRatio}</div>
                        <div>نسبة عظام الوجنتين: {debugInfo.cheekboneRatio}</div>
                        <div>نسبة الجبهة: {debugInfo.foreheadRatio}</div>
                        <div>عرض الوجه: {debugInfo.faceWidth}px</div>
                        <div>ارتفاع الوجه: {debugInfo.faceHeight}px</div>
                        <div>عرض الفك: {debugInfo.jawWidth}px</div>
                        <div>عرض عظام الوجنتين: {debugInfo.cheekboneWidth}px</div>
                        <div>عرض الجبهة: {debugInfo.foreheadWidth}px</div>
                        <div>نقاط المعالم: {debugInfo.contourPoints}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>تعليمات للحصول على أفضل النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• تأكد من أن الوجه واضح ومضاء جيداً</li>
              <li>• انظر مباشرة إلى الكاميرا</li>
              <li>• تجنب النظارات أو القبعات التي تحجب الوجه</li>
              <li>• استخدم صورة حديثة وواضحة</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
