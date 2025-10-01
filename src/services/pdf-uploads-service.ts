'use server';

/**
 * PDF Uploads Service
 * 
 * Tracks PDF upload metadata separately from incidents
 * to provide accurate upload statistics.
 */

import { getFirestore } from '@/lib/firebase-admin';

export type PdfUpload = {
  id: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  incidentCount: number;
  autoApproved: boolean;
};

const COLLECTION_NAME = 'pdf_uploads';

/**
 * Log a PDF upload event
 */
export async function logPdfUpload(
  filename: string,
  incidentCount: number,
  autoApproved: boolean
): Promise<boolean> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for PDF upload tracking');
    return false;
  }

  try {
    const docRef = firestore.collection(COLLECTION_NAME).doc();
    await docRef.set({
      id: docRef.id,
      filename,
      uploadedBy: 'admin', // Can be enhanced with actual user tracking
      uploadedAt: new Date().toISOString(),
      incidentCount,
      autoApproved
    });

    console.log(`✅ Logged PDF upload: ${filename} (${incidentCount} incidents)`);
    return true;
  } catch (error) {
    console.error('❌ Error logging PDF upload:', error);
    return false;
  }
}

/**
 * Get PDF uploads from the last N days
 */
export async function getRecentPdfUploads(days: number = 7): Promise<PdfUpload[]> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for PDF upload tracking');
    return [];
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get all documents and filter in memory to avoid composite index requirement
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .orderBy('uploadedAt', 'desc')
      .limit(100) // Reasonable limit for recent uploads
      .get();

    // Filter to only include uploads within the date range
    const filteredUploads = snapshot.docs
      .map((doc: any) => doc.data() as PdfUpload)
      .filter((upload: PdfUpload) => {
        const uploadDate = new Date(upload.uploadedAt);
        return uploadDate >= cutoffDate;
      });

    return filteredUploads;
  } catch (error) {
    console.error('❌ Error fetching recent PDF uploads:', error);
    return [];
  }
}

/**
 * Get total count of PDF uploads from the last N days
 */
export async function getRecentPdfUploadCount(days: number = 7): Promise<number> {
  const uploads = await getRecentPdfUploads(days);
  return uploads.length;
}