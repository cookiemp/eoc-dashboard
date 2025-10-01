import { NextResponse } from 'next/server';
import { archiveIncident } from '@/services/field-incidents-service';
import { clearDashboardCache } from '@/services/dashboard-cache-service';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { incidentId } = await request.json();

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID required' },
        { status: 400 }
      );
    }

    const success = await archiveIncident(incidentId);

    if (success) {
      // Clear dashboard cache to update the display
      await clearDashboardCache();
      revalidatePath('/');
      
      return NextResponse.json({
        success: true,
        message: 'Incident archived',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to archive incident' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error archiving incident:', error);
    return NextResponse.json(
      { 
        error: 'Failed to archive incident',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}