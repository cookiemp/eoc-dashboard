import { NextResponse } from 'next/server';

// This route acts as a proxy to fetch the RSS feed from ReliefWeb.
// It helps to bypass CORS issues that would occur if we fetched directly from the client.
export async function GET() {
  const feedUrl = 'https://reliefweb.int/rss.xml?country=76';
  
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // Revalidate every hour
      next: { revalidate: 3600 }, 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed, status: ${response.status}`);
    }

    const xmlText = await response.text();

    if (!xmlText) {
      throw new Error('Received empty response from ReliefWeb.');
    }
    
    // Return the XML content directly
    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`API Route Error: Failed to fetch news feed. ${errorMessage}`);
    
    // Return a JSON error response
    return NextResponse.json(
      { error: `Failed to fetch news feed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
