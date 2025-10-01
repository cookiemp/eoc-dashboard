/**
 * Cleanup Script: Remove Test Field Incidents and PDF Uploads
 * 
 * Run this script to clean up all test data before production deployment.
 * This will remove:
 * - All field incidents from the field_incidents collection
 * - All PDF upload logs from the pdf_uploads collection
 * - Dashboard cache (to force fresh data load)
 * 
 * Usage: npx tsx scripts/cleanup-test-data.ts
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n');
  
  // Initialize Firebase Admin
  try {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('🔥 Firebase Admin initialized\n');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    process.exit(1);
  }
  
  const firestore = admin.firestore();

  try {
    // 1. Clean up field incidents
    console.log('📋 Cleaning up field_incidents collection...');
    const incidentsSnapshot = await firestore.collection('field_incidents').get();
    const incidentCount = incidentsSnapshot.size;
    
    if (incidentCount > 0) {
      const incidentBatch = firestore.batch();
      incidentsSnapshot.docs.forEach((doc: any) => {
        incidentBatch.delete(doc.ref);
      });
      await incidentBatch.commit();
      console.log(`✅ Deleted ${incidentCount} field incidents`);
    } else {
      console.log('✅ No field incidents to delete');
    }

    // 2. Clean up PDF uploads
    console.log('\n📄 Cleaning up pdf_uploads collection...');
    const uploadsSnapshot = await firestore.collection('pdf_uploads').get();
    const uploadCount = uploadsSnapshot.size;
    
    if (uploadCount > 0) {
      const uploadBatch = firestore.batch();
      uploadsSnapshot.docs.forEach((doc: any) => {
        uploadBatch.delete(doc.ref);
      });
      await uploadBatch.commit();
      console.log(`✅ Deleted ${uploadCount} PDF upload logs`);
    } else {
      console.log('✅ No PDF uploads to delete');
    }

    // 3. Clear dashboard cache
    console.log('\n💾 Clearing dashboard cache...');
    const cacheDoc = firestore.collection('dashboard_cache').doc('current_data');
    const cacheExists = (await cacheDoc.get()).exists;
    
    if (cacheExists) {
      await cacheDoc.delete();
      console.log('✅ Dashboard cache cleared');
    } else {
      console.log('✅ No dashboard cache to clear');
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Field incidents removed: ${incidentCount}`);
    console.log(`  - PDF uploads removed: ${uploadCount}`);
    console.log(`  - Dashboard cache: cleared`);
    console.log('\n✨ Database is ready for production!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestData();
