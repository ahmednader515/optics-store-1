import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const hasApiKey = !!process.env.FACEPLUSPLUS_API_KEY
    const hasApiSecret = !!process.env.FACEPLUSPLUS_API_SECRET
    const apiKeyLength = process.env.FACEPLUSPLUS_API_KEY?.length || 0
    const apiSecretLength = process.env.FACEPLUSPLUS_API_SECRET?.length || 0

    return NextResponse.json({
      success: true,
      apiKeysConfigured: hasApiKey && hasApiSecret,
      details: {
        hasApiKey,
        hasApiSecret,
        apiKeyLength,
        apiSecretLength,
        apiKeyPreview: hasApiKey ? 
          `${process.env.FACEPLUSPLUS_API_KEY.substring(0, 8)}...` : 
          'Not set',
        apiSecretPreview: hasApiSecret ? 
          `${process.env.FACEPLUSPLUS_API_SECRET.substring(0, 8)}...` : 
          'Not set'
      },
      instructions: {
        step1: 'Add your Face++ API keys to your .env file',
        step2: 'Restart your development server',
        step3: 'Test the face shape detection feature'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check API keys' },
      { status: 500 }
    )
  }
}
