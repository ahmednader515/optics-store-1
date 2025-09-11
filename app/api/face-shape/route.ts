import { NextRequest, NextResponse } from 'next/server'
import { detectFaceShape } from '@/utils/faceShape'
import { detectFaceFromImageUrl } from '@/utils/faceDetection'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log('=== FACE SHAPE DETECTION DEBUG ===')
    console.log('Using face-api.js for face shape detection...')
    console.log('Image URL:', imageUrl)

    // Validate image URL first
    try {
      const urlTestResponse = await fetch(imageUrl, { method: 'HEAD' })
      if (!urlTestResponse.ok) {
        console.error('Image URL not accessible:', urlTestResponse.status, urlTestResponse.statusText)
        return NextResponse.json({
          success: false,
          error: `Image URL not accessible: ${urlTestResponse.status} ${urlTestResponse.statusText}`,
          source: 'error'
        }, { status: 400 })
      }
      
      console.log('Image URL is accessible, proceeding with face-api.js detection...')
    } catch (urlError) {
      console.error('URL validation error:', urlError)
      return NextResponse.json({
        success: false,
        error: 'Failed to validate image URL',
        source: 'error'
      }, { status: 400 })
    }

    // Use face-api.js for face detection
    try {
      console.log('Starting face detection with face-api.js...')
      
      const faceData = await detectFaceFromImageUrl(imageUrl)
      
      console.log('Face-api.js detection result:', {
        hasLandmarks: !!faceData.landmarks,
        confidence: faceData.confidence,
        age: faceData.age,
        gender: faceData.gender,
        expressions: faceData.expressions
      })
      
      // Use our custom face shape detection algorithm with face-api.js landmarks
      const faceShape = detectFaceShape(faceData.landmarks)
      const confidence = Math.round(faceData.confidence * 100)
      
      return NextResponse.json({
        success: true,
        faceShape,
        confidence: confidence,
        recommendations: getGlassesRecommendations(faceShape),
        landmarks: faceData.landmarks || null,
        attributes: {
          age: faceData.age,
          gender: faceData.gender,
          expressions: faceData.expressions
        },
        source: 'face-api.js',
        debugInfo: {
          faceShape: faceShape,
          confidence: confidence,
          landmarks: faceData.landmarks ? Object.keys(faceData.landmarks) : 'No landmarks',
          age: faceData.age,
          gender: faceData.gender
        }
      })
      
    } catch (faceApiError) {
      console.error('Face-api.js error:', faceApiError)
      return NextResponse.json({
        success: false,
        error: `Face detection failed: ${faceApiError.message}`,
        source: 'face-api.js',
        details: {
          message: faceApiError.message,
          stack: faceApiError.stack
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Face shape detection error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze face shape' },
      { status: 500 }
    )
  }
}

function getGlassesRecommendations(faceShape: string): string[] {
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