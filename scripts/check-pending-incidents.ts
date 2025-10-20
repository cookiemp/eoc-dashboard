#!/usr/bin/env tsx

/**
 * Check Pending Incidents Script
 * Shows what's actually in the pending queue
 */

import { config } from 'dotenv';
import { getFirestore } from '../src/lib/firebase-admin';

config({ path: '.env.local' });

async function main() {
  const firestore = await getFirestore();
  if (!firestore) {
    console.error('❌ Firestore not initialized');
    process.exit(1);
  }

  console.log('🔍 Checking pending incidents...\n');

  // Get all pending incidents
  const snapshot = await firestore
    .collection('field_incidents')
    .where('needsReview', '==', true)
    .where('status', '==', 'active')
    .orderBy('reportedAt', 'desc')
    .get();

  console.log(`📊 Total pending incidents: ${snapshot.docs.length}\n`);

  if (snapshot.docs.length === 0) {
    console.log('✅ No pending incidents found!\n');
    return;
  }

  // Analyze the incidents
  let withKoboId = 0;
  let withoutKoboId = 0;
  const koboIds = new Set<number>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.koboSubmissionId) {
      withKoboId++;
      koboIds.add(data.koboSubmissionId);
    } else {
      withoutKoboId++;
    }
  }

  console.log('📈 Breakdown:');
  console.log(`  - With KoBo ID: ${withKoboId}`);
  console.log(`  - Without KoBo ID (PDF uploads): ${withoutKoboId}`);
  console.log(`  - Unique KoBo IDs: ${koboIds.size}`);
  console.log(`  - Potential KoBo duplicates: ${withKoboId - koboIds.size}\n`);

  // Show first few incidents
  console.log('📋 Sample incidents (first 5):\n');
  for (let i = 0; i < Math.min(5, snapshot.docs.length); i++) {
    const doc = snapshot.docs[i];
    const data = doc.data();
    console.log(`${i + 1}. ${doc.id}`);
    console.log(`   Title: ${data.title?.substring(0, 60)}...`);
    console.log(`   Reported: ${data.reportedAt}`);
    console.log(`   KoBo ID: ${data.koboSubmissionId || 'N/A (PDF upload)'}`);
    console.log(`   Reporter: ${data.reportedBy}`);
    console.log();
  }
}

main().catch(console.error);
