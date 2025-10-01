import { NextResponse } from 'next/server';
import { addFieldIncidents } from '@/services/field-incidents-service';
import { logPdfUpload } from '@/services/pdf-uploads-service';

export async function POST(request: Request) {
  try {
    const { incidents, autoApprove, fileName } = await request.json();

    if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
      return NextResponse.json(
        { error: 'No incidents provided' },
        { status: 400 }
      );
    }

    console.log(`📊 Publishing ${incidents.length} incidents (auto-approve: ${autoApprove})`);

    // Add reportedBy field (in future, get from session)
    const incidentsToSave = incidents.map((incident: any) => ({
      ...incident,
      reportedBy: 'admin', // TODO: Get from session
    }));

    const result = await addFieldIncidents(incidentsToSave, autoApprove);

    if (result.success) {
      // Log the PDF upload for tracking
      await logPdfUpload(
        fileName || 'upload.pdf',
        result.count,
        autoApprove || false
      );
      
      console.log(`✅ Successfully published ${result.count} incidents`);
      return NextResponse.json({
        success: true,
        count: result.count,
        message: autoApprove 
          ? 'Incidents published to dashboard' 
          : 'Incidents sent to review queue'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to save incidents' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error publishing incidents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish incidents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}