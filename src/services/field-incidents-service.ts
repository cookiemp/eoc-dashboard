'use server';

/**
 * Field Incidents Service
 * 
 * Manages field reports extracted from PDF uploads.
 * Separate from news-based incidents to maintain data source integrity.
 */

import { getFirestore } from '@/lib/firebase-admin';
import type { Incident } from '@/lib/types';

export type FieldIncident = Incident & {
  id: string;
  sourceType: 'field_report';
  reportedBy: string;
  reportedAt: string;
  category: 'health' | 'food_security' | 'displacement' | 'wash' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPeople?: number;
  locationName: string;
  status: 'active' | 'resolved' | 'archived';
  needsReview: boolean;
  confidence: number;
  koboSubmissionId?: number; // Optional: KoBo submission ID for duplicate detection
};

const COLLECTION_NAME = 'field_incidents';
const MAX_INCIDENTS = 50; // Keep more field reports than news incidents

/**
 * Get all active field incidents
 */
export async function getFieldIncidents(): Promise<FieldIncident[]> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for field incidents');
    return [];
  }

  try {
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .where('status', '==', 'active')
      .orderBy('reportedAt', 'desc')
      .limit(MAX_INCIDENTS)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as FieldIncident));
  } catch (error) {
    console.error('❌ Error fetching field incidents:', error);
    return [];
  }
}

/**
 * Get incidents pending review
 */
export async function getIncidentsPendingReview(): Promise<FieldIncident[]> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for field incidents');
    return [];
  }

  try {
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .where('needsReview', '==', true)
      .where('status', '==', 'active')
      .orderBy('reportedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as FieldIncident));
  } catch (error) {
    console.error('❌ Error fetching pending incidents:', error);
    return [];
  }
}

/**
 * Add new field incidents (from PDF extraction)
 */
export async function addFieldIncidents(
  incidents: Omit<FieldIncident, 'id' | 'sourceType' | 'reportedAt' | 'status'>[],
  autoApprove: boolean = false
): Promise<{ success: boolean; count: number; error?: string }> {
  const firestore = await getFirestore();
  if (!firestore) {
    return { success: false, count: 0, error: 'Firebase not available' };
  }

  try {
    const batch = firestore.batch();
    const timestamp = new Date().toISOString();
    let addedCount = 0;
    let skippedCount = 0;

    for (const incident of incidents) {
      // Check for duplicates if this is from KoBo (has koboSubmissionId)
      if (incident.koboSubmissionId) {
        const existingQuery = await firestore
          .collection(COLLECTION_NAME)
          .where('koboSubmissionId', '==', incident.koboSubmissionId)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          console.log(`⏭️  Skipping duplicate KoBo submission: ${incident.koboSubmissionId}`);
          skippedCount++;
          continue;
        }
      }

      const docRef = firestore.collection(COLLECTION_NAME).doc();
      batch.set(docRef, {
        ...incident,
        id: docRef.id,
        sourceType: 'field_report',
        reportedAt: timestamp,
        status: 'active',
        needsReview: !autoApprove
      });
      addedCount++;
    }

    if (addedCount > 0) {
      await batch.commit();
      console.log(`✅ Added ${addedCount} field incidents (auto-approve: ${autoApprove}, skipped: ${skippedCount})`);
    } else {
      console.log(`⏭️  No new incidents to add (all ${skippedCount} were duplicates)`);
    }
    
    return { success: true, count: addedCount };
  } catch (error) {
    console.error('❌ Error adding field incidents:', error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Approve an incident (remove from review queue)
 */
export async function approveIncident(incidentId: string): Promise<boolean> {
  const firestore = await getFirestore();
  if (!firestore) return false;

  try {
    await firestore
      .collection(COLLECTION_NAME)
      .doc(incidentId)
      .update({ needsReview: false });
    
    console.log(`✅ Approved incident: ${incidentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error approving incident:', error);
    return false;
  }
}

/**
 * Update an incident
 */
export async function updateFieldIncident(
  incidentId: string,
  updates: Partial<FieldIncident>
): Promise<boolean> {
  const firestore = await getFirestore();
  if (!firestore) return false;

  try {
    await firestore
      .collection(COLLECTION_NAME)
      .doc(incidentId)
      .update(updates);
    
    console.log(`✅ Updated incident: ${incidentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating incident:', error);
    return false;
  }
}

/**
 * Archive an incident (soft delete)
 */
export async function archiveIncident(incidentId: string): Promise<boolean> {
  const firestore = await getFirestore();
  if (!firestore) return false;

  try {
    await firestore
      .collection(COLLECTION_NAME)
      .doc(incidentId)
      .update({ status: 'archived' });
    
    console.log(`✅ Archived incident: ${incidentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error archiving incident:', error);
    return false;
  }
}

/**
 * Delete an incident permanently
 */
export async function deleteFieldIncident(incidentId: string): Promise<boolean> {
  const firestore = await getFirestore();
  if (!firestore) return false;

  try {
    await firestore
      .collection(COLLECTION_NAME)
      .doc(incidentId)
      .delete();
    
    console.log(`✅ Deleted incident: ${incidentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting incident:', error);
    return false;
  }
}