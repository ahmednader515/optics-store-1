import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.BETAFACE_API_KEY;
    const apiSecret = process.env.BETAFACE_API_SECRET;
    
    console.log('=== BETAFACE API KEY TEST ===')
    console.log('API Keys check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET',
      apiSecretPreview: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'NOT SET'
    })
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Betaface API keys not configured',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          message: 'Please add BETAFACE_API_KEY and BETAFACE_API_SECRET to your .env file'
        }
      }, { status: 500 })
    }
    
    // Test API call with a simple image
    try {
      const testResponse = await fetch('https://www.betafaceapi.com/api/v2/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          image_url: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=Test+Face',
          detection_flags: 'basicpoints,propoints,classifiers,content',
          original_filename: 'test_face.jpg'
        })
      })
      
      console.log('Betaface test API response status:', testResponse.status)
      
      if (testResponse.ok) {
        const testData = await testResponse.json()
        return NextResponse.json({
          success: true,
          message: 'Betaface API keys are working correctly',
          apiStatus: 'OK',
          responsePreview: {
            status: testResponse.status,
            hasMedia: !!testData.media,
            hasFaces: testData.media?.faces?.length || 0
          }
        })
      } else {
        const errorData = await testResponse.json()
        return NextResponse.json({
          success: false,
          error: 'Betaface API test failed',
          details: {
            status: testResponse.status,
            error: errorData
          }
        }, { status: 400 })
      }
    } catch (testError) {
      console.error('Betaface test API error:', testError)
      return NextResponse.json({
        success: false,
        error: 'Betaface API test request failed',
        details: {
          message: testError.message
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Betaface API key test error:', error)
    return NextResponse.json(
      { error: 'Failed to test Betaface API keys' },
      { status: 500 }
    )
  }
}
