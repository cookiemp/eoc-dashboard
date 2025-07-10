import { NextResponse } from 'next/server';
import type { NewsArticle } from '@/lib/types';

// This route acts as a proxy to fetch data from the ReliefWeb API.
export async function GET() {
  // ReliefWeb API endpoint for the latest 10 reports on Ethiopia (country code 76)
  const apiUrl =
    'https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&filter[field]=country&filter[value]=76&limit=10&preset=latest';

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Use Next.js's revalidation feature to cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`ReliefWeb API Error: ${response.status}`, errorBody);
      throw new Error(
        `Failed to fetch from ReliefWeb API. Status: ${response.status}`
      );
    }

    const data = await response.json();

    // Transform the API response into our standard NewsArticle format
    const articles: NewsArticle[] = (data.data || []).map((item: any) => {
      const fields = item.fields;
      
      // More robust snippet creation
      let snippet = 'No Snippet Available';
      if (fields.body) {
         // Take the first 200 characters and remove any HTML tags for a clean preview
        snippet = fields.body.substring(0, 200).replace(/<[^>]+>/g, '');
        if (fields.body.length > 200) {
          snippet += '...';
        }
      }

      return {
        id: item.id || Math.random().toString(), // Add a fallback for ID
        title: fields.title || 'No Title',
        source: fields.source?.[0]?.shortname || 'ReliefWeb',
        snippet: snippet,
        url: fields.url || item.href,
      };
    });

    return NextResponse.json(articles);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`API Route Error: Failed to fetch news. ${errorMessage}`);

    return NextResponse.json(
      { error: `Failed to fetch news feed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
