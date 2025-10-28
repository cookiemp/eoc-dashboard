/**
 * Script to re-geocode existing field incidents with improved accuracy
 * Uses the new static Ethiopian location database + AI fallback
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getFirestore } from '../src/lib/firebase-admin';
import { geocodeEthiopianLocation } from '../src/ai/flows/geocode-ethiopian-location-flow';

interface FieldIncident {
  id: string;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

async function fixFieldIncidentCoordinates() {
  console.log('🔧 Starting field incident coordinate fix...\n');

  const db = await getFirestore();
  if (!db) {
    console.error('❌ Firebase not available');
    return;
  }

  try {
    // Fetch all active field incidents
    const snapshot = await db
      .collection('field_incidents')
      .where('status', '==', 'active')
      .get();

    const incidents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FieldIncident[];

    console.log(`📋 Found ${incidents.length} active field incidents\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const incident of incidents) {
      console.log(`\n🔍 Processing: ${incident.title}`);
      console.log(`   Location: ${incident.locationName}`);
      console.log(`   Current coords: ${incident.latitude}, ${incident.longitude}`);

      // Parse location from locationName (format: "Region, Zone, Woreda")
      const locationParts = incident.locationName.split(',').map(s => s.trim());
      
      let region = '';
      let zone = '';
      let woreda = '';

      if (locationParts.length >= 1) region = locationParts[0];
      if (locationParts.length >= 2) zone = locationParts[1];
      if (locationParts.length >= 3) woreda = locationParts[2];

      if (!region) {
        console.log('   ⏭️  Skipping: No region found in locationName');
        skippedCount++;
        continue;
      }

      try {
        // Re-geocode using the improved flow
        const geocodeResult = await geocodeEthiopianLocation({
          region,
          zone,
          woreda,
          kebele: '',
          locationScope: 'woreda',
        });

        const newLat = geocodeResult.latitude;
        const newLng = geocodeResult.longitude;

        // Calculate distance change
        const latDiff = Math.abs(newLat - incident.latitude);
        const lngDiff = Math.abs(newLng - incident.longitude);
        const totalDiff = latDiff + lngDiff;

        console.log(`   ✅ New coords: ${newLat}, ${newLng}`);
        console.log(`   📊 Confidence: ${geocodeResult.confidence}`);
        console.log(`   📏 Coordinate shift: ${totalDiff.toFixed(4)} degrees`);

        // Update the incident with new coordinates
        await db.collection('field_incidents').doc(incident.id).update({
          latitude: newLat,
          longitude: newLng,
          locationName: geocodeResult.locationName,
          confidence: geocodeResult.confidence,
          updatedAt: new Date().toISOString(),
        });

        updatedCount++;
        console.log('   💾 Updated successfully');

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error geocoding: ${error}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
fixFieldIncidentCoordinates()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
