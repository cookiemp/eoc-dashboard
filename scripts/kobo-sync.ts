/**
 * KoBo Sync Script for GitHub Actions
 * 
 * Syncs emergency field reports from IFRC KoBoToolbox to Firestore
 * Runs automatically every 30 minutes via GitHub Actions
 */

import { syncKoBoToFieldIncidents, getKoBoSyncHealth } from '../src/services/kobo-sync-service';

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 KoBo Sync Job Started');
  console.log('='.repeat(60));
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  // Health check
  console.log('🏥 Checking KoBo connectivity...');
  const health = await getKoBoSyncHealth();
  
  if (!health.configured) {
    console.error('❌ KoBo not configured. Please set KOBO_API_KEY and KOBO_ASSET_UID.');
    process.exit(1);
  }

  if (!health.reachable) {
    console.error(`❌ Cannot reach KoBo server: ${health.error}`);
    process.exit(1);
  }

  console.log(`✅ KoBo server reachable (${health.submissionCount} total submissions)`);
  console.log('');

  // Sync recent submissions
  console.log('🔄 Starting sync...');
  const result = await syncKoBoToFieldIncidents({
    limit: 20, // Sync last 20 submissions
    autoApprove: false, // Require admin review for low-confidence geocoding
  });

  console.log('');
  console.log('='.repeat(60));
  console.log('📊 Sync Results');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${result.success}`);
  console.log(`📍 Incidents Created: ${result.incidentsCreated}`);
  console.log(`⏭️  Incidents Skipped: ${result.incidentsSkipped}`);
  console.log(`❌ Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('');
    console.log('Error Details:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log('');
  console.log(`⏰ Completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Exit with error if sync failed
  if (!result.success) {
    process.exit(1);
  }
}

// Run the sync
main().catch((error) => {
  console.error('💥 Fatal error during KoBo sync:', error);
  process.exit(1);
});
