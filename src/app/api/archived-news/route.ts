import { NextResponse } from 'next/server';
import { getArchivedNews } from '@/services/firebase-news-service';

export async function GET(request: Request) {
  try {
    console.log('🔍 Fetching archived news from API...');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;
    
    console.log('📋 Query params:', { page, pageSize, startDate, endDate, search });
    
    const newsData = await getArchivedNews(page, pageSize, startDate, endDate, search);
    
    console.log(`✅ Retrieved ${newsData.articles?.length || 0} archived articles`);
    
    return NextResponse.json({
      ...newsData,
      success: true,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching archived news:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch archived news',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

