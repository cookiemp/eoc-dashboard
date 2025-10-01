import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const firestore = await getFirestore();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Firebase not available' },
        { status: 500 }
      );
    }

    // Get all field incidents (both active and archived)
    const snapshot = await firestore
      .collection('field_incidents')
      .orderBy('reportedAt', 'desc')
      .limit(100)
      .get();

    const incidents = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      incidents,
      count: incidents.length,
    });
  } catch (error) {
    console.error('❌ Error fetching all incidents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch incidents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}