#!/usr/bin/env tsx

/**
 * Diagnostic script to verify map incidents reflect current news
 * Usage: npx tsx src/scripts/verify-map-incidents.ts
 */

import { getAllNewsWithCategorization, getLatestIncidents, processNewsIntoIncidents } from '@/app/actions';
import type { NewsArticle } from '@/lib/types';

async function verifyMapIncidents() {
  console.log('🗺️  Verifying Map Incidents Against Current News...\n');
  
  try {
    // Step 1: Get current incidents on the map
    console.log('📍 Fetching current map incidents...');
    const currentIncidents = await getLatestIncidents();
    console.log(`   Found ${currentIncidents.length} incidents on the map`);
    
    if (currentIncidents.length > 0) {
      console.log('\n🏷️  Current Map Incidents:');
      currentIncidents.forEach((incident, index) => {
        const addedTime = new Date(incident.addedAt).toLocaleString();
        console.log(`   ${index + 1}. "${incident.title}"`);
        console.log(`      📍 Location: ${incident.latitude}, ${incident.longitude}`);
        console.log(`      🎨 Color: ${incident.color}`);
        console.log(`      📅 Added: ${addedTime}`);
        console.log(`      📝 Description: ${incident.description}`);
        console.log('');
      });
    }

    // Step 2: Get current news and check categorization
    console.log('📰 Fetching and categorizing current news...');
    const newsResult = await getAllNewsWithCategorization();
    
    if (newsResult.error) {
      console.error('❌ Error fetching news:', newsResult.error);
      return;
    }
    
    const humanitarian = newsResult.humanitarian || [];
    const general = newsResult.general || [];
    
    console.log(`   📊 Current News: ${humanitarian.length} humanitarian, ${general.length} general articles`);
    
    // Step 3: Show humanitarian articles that would generate incidents
    if (humanitarian.length > 0) {
      console.log('\n🏥 Humanitarian Articles (Source for Map Incidents):');
      humanitarian.slice(0, 5).forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      🏢 Source: ${article.source}`);
        console.log(`      🤖 AI Confidence: ${Math.round(article.confidence * 100)}%`);
        console.log(`      💭 Reasoning: ${article.reasoning}`);
        console.log('');
      });
    }

    // Step 4: Process fresh incidents and compare
    console.log('🔄 Processing fresh incident extraction from humanitarian news...');
    
    // Convert CategorizedArticle back to NewsArticle for incident processing
    const articlesForIncidents: NewsArticle[] = humanitarian.map(article => ({
      id: article.id,
      title: article.title,
      source: article.source,
      snippet: article.snippet,
      url: article.url
    }));
    
    if (articlesForIncidents.length > 0) {
      await processNewsIntoIncidents({ articles: articlesForIncidents });
      console.log('✅ Fresh incidents processed and added to map');
      
      // Get updated incidents
      const updatedIncidents = await getLatestIncidents();
      console.log(`   📍 Map now has ${updatedIncidents.length} incidents total`);
      
      // Show any new incidents
      const newIncidents = updatedIncidents.filter(incident => 
        !currentIncidents.some(current => current.title === incident.title)
      );
      
      if (newIncidents.length > 0) {
        console.log('\n✨ New Incidents Added to Map:');
        newIncidents.forEach((incident, index) => {
          console.log(`   ${index + 1}. "${incident.title}"`);
          console.log(`      📍 Location: ${incident.latitude}, ${incident.longitude}`);
          console.log(`      🎨 Color: ${incident.color}`);
          console.log(`      📝 Description: ${incident.description}`);
          console.log('');
        });
      } else {
        console.log('\n💡 No new incidents were added (may be duplicates of existing incidents)');
      }
    } else {
      console.log('⚠️  No humanitarian articles found to generate incidents from');
    }

    // Step 5: Provide map statistics
    const finalIncidents = await getLatestIncidents();
    const incidentsByColor = finalIncidents.reduce((acc, incident) => {
      acc[incident.color] = (acc[incident.color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Map Incident Statistics:');
    console.log(`   🔴 Health/Medical (Red): ${incidentsByColor['#ef4444'] || 0} incidents`);
    console.log(`   🔵 Weather/Natural (Blue): ${incidentsByColor['#3b82f6'] || 0} incidents`);
    console.log(`   🟢 Operations/Aid (Green): ${incidentsByColor['#22c55e'] || 0} incidents`);
    console.log(`   🟡 Conflict/Security (Amber): ${incidentsByColor['#f59e0b'] || 0} incidents`);
    console.log(`   📍 Total Map Markers: ${finalIncidents.length} incidents`);

  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
  }
}

// Run the verification
if (require.main === module) {
  verifyMapIncidents()
    .then(() => {
      console.log('\n🎉 Map verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

export { verifyMapIncidents };
