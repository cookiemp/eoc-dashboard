#!/usr/bin/env tsx

/**
 * KoBo Duplicate Cleanup Script
 * 
 * SAFETY FEATURES:
 * - Dry-run mode by default (doesn't delete anything)
 * - Only removes duplicates with same koboSubmissionId
 * - Keeps the FIRST synced incident (oldest)
 * - Logs everything it does
 * - Requires explicit confirmation to run in delete mode
 * 
 * USAGE:
 * 1. Dry run (safe, shows what would be deleted):
 *    npm run cleanup:kobo-duplicates
 * 
 * 2. Actually delete (after reviewing dry run):
 *    npm run cleanup:kobo-duplicates -- --delete
 */

import { config } from 'dotenv';
import { getFirestore } from '../src/lib/firebase-admin';
import type { FieldIncident } from '../src/services/field-incidents-service';

// Load environment variables
config({ path: '.env.local' });

const COLLECTION_NAME = 'field_incidents';

interface DuplicateGroup {
  koboSubmissionId: number;
  incidents: Array<{
    id: string;
    reportedAt: string;
    title: string;
    needsReview: boolean;
  }>;
}

/**
 * Find all duplicate incidents grouped by koboSubmissionId
 */
async function findDuplicates(): Promise<DuplicateGroup[]> {
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  console.log('🔍 Scanning for duplicates...\n');

  // Get all field incidents with koboSubmissionId
  const snapshot = await firestore
    .collection(COLLECTION_NAME)
    .where('koboSubmissionId', '!=', null)
    .get();

  console.log(`📊 Found ${snapshot.docs.length} incidents with KoBo submission IDs\n`);

  // Group by koboSubmissionId
  const groups = new Map<number, DuplicateGroup>();

  for (const doc of snapshot.docs) {
    const data = doc.data() as FieldIncident;
    const koboId = data.koboSubmissionId;

    if (!koboId) continue;

    if (!groups.has(koboId)) {
      groups.set(koboId, {
        koboSubmissionId: koboId,
        incidents: [],
      });
    }

    groups.get(koboId)!.incidents.push({
      id: doc.id,
      reportedAt: data.reportedAt,
      title: data.title,
      needsReview: data.needsReview,
    });
  }

  // Filter to only groups with duplicates (more than 1 incident)
  const duplicates: DuplicateGroup[] = [];

  for (const group of groups.values()) {
    if (group.incidents.length > 1) {
      // Sort by reportedAt (oldest first)
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
  console.log('=' .repeat(80));
  console.log('📋 DUPLICATE ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! Database is clean.\n');
    return;
  }

  let totalDuplicates = 0;
  let totalToDelete = 0;

  for (const group of duplicates) {
    totalDuplicates += group.incidents.length;
    totalToDelete += group.incidents.length - 1; // Keep first, delete rest
  }

  console.log(`🔢 Total duplicate groups: ${duplicates.length}`);
  console.log(`📊 Total incidents in duplicates: ${totalDuplicates}`);
  console.log(`🗑️  Incidents to delete: ${totalToDelete}`);
  console.log(`✅ Incidents to keep: ${duplicates.length}`);
  console.log();

  console.log('─'.repeat(80));
  console.log('DETAILED BREAKDOWN:');
  console.log('─'.repeat(80));
  console.log();

  for (let i = 0; i < Math.min(duplicates.length, 10); i++) {
    const group = duplicates[i];
    console.log(`Group ${i + 1}: KoBo Submission ID ${group.koboSubmissionId}`);
    console.log(`  Total copies: ${group.incidents.length}`);
    console.log();

    group.incidents.forEach((incident, idx) => {
      const status = idx === 0 ? '✅ KEEP' : '🗑️  DELETE';
      const reviewStatus = incident.needsReview ? '⚠️  Pending Review' : '✓ Approved';
      console.log(`  ${status} - ${incident.id}`);
      console.log(`    Synced: ${incident.reportedAt}`);
      console.log(`    Title: ${incident.title.substring(0, 60)}...`);
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
 * Delete duplicate incidents (keeps the oldest one in each group)
 */
async function deleteDuplicates(duplicates: DuplicateGroup[], dryRun: boolean): Promise<void> {
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
    console.log('To actually delete duplicates, run with --delete flag:\n');
    console.log('  npm run cleanup:kobo-duplicates -- --delete\n');
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
    // Skip the first incident (keep it), delete the rest
    const toDelete = group.incidents.slice(1);

    for (const incident of toDelete) {
      try {
        await firestore.collection(COLLECTION_NAME).doc(incident.id).delete();
        deletedCount++;
        console.log(`✅ Deleted: ${incident.id} (KoBo ID: ${group.koboSubmissionId})`);
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
  console.log('🧹 KOBO DUPLICATE CLEANUP SCRIPT');
  console.log('='.repeat(80));
  console.log();

  // Check Firebase connection
  const firestore = await getFirestore();
  if (!firestore) {
    console.error('❌ Firebase not initialized. Check your environment variables.');
    process.exit(1);
  }
  console.log('✅ Firebase connected\n');

  // Find duplicates
  const duplicates = await findDuplicates();

  // Display results
  displayDuplicates(duplicates);

  if (duplicates.length === 0) {
    process.exit(0);
  }

  // Delete duplicates (or show dry run message)
  await deleteDuplicates(duplicates, !deleteMode);

  console.log('✨ Done!\n');
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
