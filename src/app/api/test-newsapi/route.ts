import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEWSAPI_API_KEY;
  
  console.log('🧪 Testing NewsAPI directly...');
  console.log('- API Key exists:', !!apiKey);
  console.log('- API Key length:', apiKey?.length || 0);
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'NewsAPI API key is not configured',
      debug: {
        hasKey: false,
        keyLength: 0
      }
    });
  }

  const url = `https://newsapi.org/v2/everything?q=Ethiopia&sources=bbc-news,reuters&language=en&pageSize=2&sortBy=publishedAt`;

  try {
    console.log('🌐 Making NewsAPI request...');
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ NewsAPI Error Response:', errorData);
      return NextResponse.json({ 
        error: `NewsAPI Error: ${response.status}`,
        errorData: errorData,
        debug: {
          status: response.status,
          ok: response.ok
        }
      });
    }

    const data = await response.json();
    console.log('✅ NewsAPI Response structure:', {
      hasArticles: !!data.articles,
      articlesCount: data.articles?.length || 0,
      status: data.status,
      totalResults: data.totalResults
    });

    return NextResponse.json({ 
      success: true,
      articlesCount: data.articles?.length || 0,
      status: data.status,
      totalResults: data.totalResults,
      sample: data.articles?.[0] ? {
        title: data.articles[0].title,
        source: data.articles[0].source?.name
      } : null
    });

  } catch (error) {
    console.error('💥 NewsAPI Fetch Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to connect to NewsAPI: ${errorMessage}`,
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage
      }
    });
  }
}
