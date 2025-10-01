import { NextResponse } from 'next/server';
import { approveIncident } from '@/services/field-incidents-service';
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

    const success = await approveIncident(incidentId);

    if (success) {
      // Clear dashboard cache so approved incidents show up immediately
      await clearDashboardCache();
      
      // Revalidate the main dashboard path
      revalidatePath('/');
      
      return NextResponse.json({
        success: true,
        message: 'Incident approved and published to dashboard',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to approve incident' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error approving incident:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve incident',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}