import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check all environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      FACEPLUSPLUS_API_KEY: process.env.FACEPLUSPLUS_API_KEY ? 
        `${process.env.FACEPLUSPLUS_API_KEY.substring(0, 10)}...` : 'NOT SET',
      FACEPLUSPLUS_API_SECRET: process.env.FACEPLUSPLUS_API_SECRET ? 
        `${process.env.FACEPLUSPLUS_API_SECRET.substring(0, 10)}...` : 'NOT SET',
      UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET ? 'SET' : 'NOT SET',
      UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID ? 'SET' : 'NOT SET',
    }

    const apiKeyLength = process.env.FACEPLUSPLUS_API_KEY?.length || 0
    const apiSecretLength = process.env.FACEPLUSPLUS_API_SECRET?.length || 0

    return NextResponse.json({
      success: true,
      environment: envVars,
      faceplusplus: {
        hasApiKey: !!process.env.FACEPLUSPLUS_API_KEY,
        hasApiSecret: !!process.env.FACEPLUSPLUS_API_SECRET,
        apiKeyLength,
        apiSecretLength,
        bothKeysPresent: !!(process.env.FACEPLUSPLUS_API_KEY && process.env.FACEPLUSPLUS_API_SECRET)
      },
      instructions: {
        step1: 'Check if .env file exists in project root',
        step2: 'Verify FACEPLUSPLUS_API_KEY and FACEPLUSPLUS_API_SECRET are set',
        step3: 'Restart development server after adding keys',
        step4: 'Check server console for debug logs'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    )
  }
}
