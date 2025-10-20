#!/usr/bin/env tsx

/**
 * Enhanced Duplicate Cleanup Script
 * 
 * Detects duplicates by:
 * 1. koboSubmissionId (if present)
 * 2. Title + Reporter (for old KoBo syncs without ID)
 * 
 * SAFETY FEATURES:
 * - Dry-run mode by default
 * - Only removes duplicates
 * - Keeps the FIRST synced incident (oldest)
 * - 5-second countdown before deletion
 */

import { config } from 'dotenv';
import { getFirestore } from '../src/lib/firebase-admin';
import type { FieldIncident } from '../src/services/field-incidents-service';

config({ path: '.env.local' });

const COLLECTION_NAME = 'field_incidents';

interface DuplicateGroup {
  key: string;
  type: 'kobo_id' | 'title_reporter';
  incidents: Array<{
    id: string;
    reportedAt: string;
    title: string;
    reportedBy: string;
    needsReview: boolean;
    koboSubmissionId?: number;
  }>;
}

/**
 * Find all duplicate incidents
 */
async function findDuplicates(): Promise<DuplicateGroup[]> {
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  console.log('🔍 Scanning for duplicates...\n');

  // Get all field incidents
  const snapshot = await firestore
    .collection(COLLECTION_NAME)
    .where('status', '==', 'active')
    .get();

  console.log(`📊 Found ${snapshot.docs.length} active field incidents\n`);

  // Group by koboSubmissionId (if present)
  const koboGroups = new Map<number, DuplicateGroup>();
  
  // Group by title + reporter (for old KoBo syncs)
  const titleReporterGroups = new Map<string, DuplicateGroup>();

  for (const doc of snapshot.docs) {
    const data = doc.data() as FieldIncident;
    
    const incident = {
      id: doc.id,
      reportedAt: data.reportedAt,
      title: data.title,
      reportedBy: data.reportedBy,
      needsReview: data.needsReview,
      koboSubmissionId: data.koboSubmissionId,
    };

    // Method 1: Group by koboSubmissionId (new syncs)
    if (data.koboSubmissionId) {
      if (!koboGroups.has(data.koboSubmissionId)) {
        koboGroups.set(data.koboSubmissionId, {
          key: `KoBo ID: ${data.koboSubmissionId}`,
          type: 'kobo_id',
          incidents: [],
        });
      }
      koboGroups.get(data.koboSubmissionId)!.incidents.push(incident);
    }
    // Method 2: Group by title + reporter (old syncs, likely KoBo)
    else {
      const key = `${data.title}|||${data.reportedBy}`;
      if (!titleReporterGroups.has(key)) {
        titleReporterGroups.set(key, {
          key: `Title: "${data.title.substring(0, 50)}..." + Reporter: "${data.reportedBy}"`,
          type: 'title_reporter',
          incidents: [],
        });
      }
      titleReporterGroups.get(key)!.incidents.push(incident);
    }
  }

  // Combine and filter to only groups with duplicates
  const duplicates: DuplicateGroup[] = [];

  for (const group of koboGroups.values()) {
    if (group.incidents.length > 1) {
      group.incidents.sort((a, b) => 
        new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
      );
      duplicates.push(group);
    }
  }

  for (const group of titleReporterGroups.values()) {
    if (group.incidents.length > 1) {
      group.incidents.sort((a, b) => 
        new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
      );
      duplicates.push(group);
    }
  }

  return duplicates;
}

/**
 * Display duplicate groups
 */
function displayDuplicates(duplicates: DuplicateGroup[]): void {
  console.log('='.repeat(80));
  console.log('📋 DUPLICATE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! Database is clean.\n');
    return;
  }

  let totalDuplicates = 0;
  let totalToDelete = 0;
  let byKoboId = 0;
  let byTitleReporter = 0;

  for (const group of duplicates) {
    totalDuplicates += group.incidents.length;
    totalToDelete += group.incidents.length - 1;
    if (group.type === 'kobo_id') byKoboId++;
    else byTitleReporter++;
  }

  console.log(`🔢 Total duplicate groups: ${duplicates.length}`);
  console.log(`  - By KoBo ID: ${byKoboId}`);
  console.log(`  - By Title+Reporter: ${byTitleReporter}`);
  console.log(`📊 Total incidents in duplicates: ${totalDuplicates}`);
  console.log(`🗑️  Incidents to delete: ${totalToDelete}`);
  console.log(`✅ Incidents to keep: ${duplicates.length}`);
  console.log();

  console.log('─'.repeat(80));
  console.log('DETAILED BREAKDOWN (first 10 groups):');
  console.log('─'.repeat(80));
  console.log();

  for (let i = 0; i < Math.min(duplicates.length, 10); i++) {
    const group = duplicates[i];
    console.log(`Group ${i + 1}: ${group.key}`);
    console.log(`  Detection method: ${group.type === 'kobo_id' ? 'KoBo Submission ID' : 'Title + Reporter'}`);
    console.log(`  Total copies: ${group.incidents.length}`);
    console.log();

    group.incidents.forEach((incident, idx) => {
      const status = idx === 0 ? '✅ KEEP' : '🗑️  DELETE';
      const reviewStatus = incident.needsReview ? '⚠️  Pending Review' : '✓ Approved';
      console.log(`  ${status} - ${incident.id}`);
      console.log(`    Synced: ${incident.reportedAt}`);
      console.log(`    Title: ${incident.title.substring(0, 60)}...`);
      console.log(`    Reporter: ${incident.reportedBy}`);
      console.log(`    Status: ${reviewStatus}`);
      console.log();
    });

    console.log('─'.repeat(80));
    console.log();
  }

  if (duplicates.length > 10) {
    console.log(`... and ${duplicates.length - 10} more duplicate groups\n`);
  }
}

/**
 * Delete duplicate incidents
 */
async function deleteDuplicates(duplicates: DuplicateGroup[], dryRun: boolean): Promise<void> {
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
    console.log('To actually delete duplicates, run with --delete flag:\n');
    console.log('  npm run cleanup:all-duplicates -- --delete\n');
    return;
  }

  console.log('⚠️  DELETE MODE ACTIVE - This will permanently remove duplicates!\n');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');

  // 5 second countdown
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`Starting in ${i}... `);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n');

  console.log('🗑️  Starting deletion process...\n');

  let deletedCount = 0;
  let errorCount = 0;

  for (const group of duplicates) {
    const toDelete = group.incidents.slice(1);

    for (const incident of toDelete) {
      try {
        await firestore.collection(COLLECTION_NAME).doc(incident.id).delete();
        deletedCount++;
        console.log(`✅ Deleted: ${incident.id} (${group.type})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error deleting ${incident.id}:`, error);
      }
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✅ CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log(`🗑️  Deleted: ${deletedCount} duplicate incidents`);
  console.log(`✅ Kept: ${duplicates.length} original incidents`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log();
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const deleteMode = args.includes('--delete');

  console.log();
  console.log('='.repeat(80));
  console.log('🧹 ENHANCED DUPLICATE CLEANUP SCRIPT');
  console.log('='.repeat(80));
  console.log();

  const firestore = await getFirestore();
  if (!firestore) {
    console.error('❌ Firebase not initialized. Check your environment variables.');
    process.exit(1);
  }
  console.log('✅ Firebase connected\n');

  const duplicates = await findDuplicates();
  displayDuplicates(duplicates);

  if (duplicates.length === 0) {
    process.exit(0);
  }

  await deleteDuplicates(duplicates, !deleteMode);

  console.log('✨ Done!\n');
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
