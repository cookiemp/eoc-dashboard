import { NextResponse } from 'next/server';
import { getIncidentsPendingReview } from '@/services/field-incidents-service';

export async function GET() {
  try {
    const incidents = await getIncidentsPendingReview();
    
    return NextResponse.json({
      success: true,
      incidents,
      count: incidents.length,
    });
  } catch (error) {
    console.error('❌ Error fetching pending incidents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pending incidents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}