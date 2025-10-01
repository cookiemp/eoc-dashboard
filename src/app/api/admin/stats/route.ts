import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFieldIncidents, getIncidentsPendingReview } from '@/services/field-incidents-service';
import { getRecentPdfUploadCount } from '@/services/pdf-uploads-service';

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all field incidents, pending ones, and recent PDF uploads
    const [allIncidents, pendingIncidents, recentUploads] = await Promise.all([
      getFieldIncidents(),
      getIncidentsPendingReview(),
      getRecentPdfUploadCount(7) // Last 7 days
    ]);

    const stats = {
      totalIncidents: allIncidents.length,
      pendingReview: pendingIncidents.length,
      recentUploads
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' }, 
      { status: 500 }
    );
  }
}