import { NextResponse } from 'next/server';

export async function GET() {
  const debug = {
    nodeEnv: process.env.NODE_ENV,
    hasGoogleKey: !!process.env.GOOGLE_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasNewsApiKey: !!process.env.NEWSAPI_API_KEY,
    googleKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    newsApiKeyLength: process.env.NEWSAPI_API_KEY?.length || 0,
    // Don't expose actual keys for security
    googleKeyPreview: process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 10)}...` : 'NOT_SET',
    geminiKeyPreview: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT_SET',
    newsApiKeyPreview: process.env.NEWSAPI_API_KEY ? `${process.env.NEWSAPI_API_KEY.substring(0, 10)}...` : 'NOT_SET',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('API') || key.includes('GEMINI') || key.includes('NEWS') || key.includes('GOOGLE')
    ),
  };

  return NextResponse.json(debug);
}
