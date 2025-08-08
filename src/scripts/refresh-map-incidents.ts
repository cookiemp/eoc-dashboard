#!/usr/bin/env tsx

/**
 * Script to force refresh map incidents from the latest news
 * Usage: npx tsx src/scripts/refresh-map-incidents.ts
 */

import { getAllNewsWithCategorization, processNewsIntoIncidents, getLatestIncidents } from '@/app/actions';
import type { NewsArticle } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

async function refreshMapIncidents() {
  console.log('🔄 Force Refreshing Map Incidents from Latest News...\n');
  
  try {
    // Step 1: Clear existing incidents to start fresh
    console.log('🗑️  Clearing existing incidents cache...');
    const incidentCachePath = path.resolve(process.cwd(), 'src/lib/incidents-cache.json');
    await fs.writeFile(incidentCachePath, '[]', 'utf-8');
    console.log('✅ Incident cache cleared');

    // Step 2: Fetch and categorize current news
    console.log('\n📰 Fetching and categorizing current news...');
    const newsResult = await getAllNewsWithCategorization();
    
    if (newsResult.error) {
      console.error('❌ Error fetching news:', newsResult.error);
      return;
    }
    
    const humanitarian = newsResult.humanitarian || [];
    const general = newsResult.general || [];
    
    console.log(`   📊 Found: ${humanitarian.length} humanitarian, ${general.length} general articles`);

    // Step 3: Show humanitarian articles that will generate map incidents
    if (humanitarian.length > 0) {
      console.log('\n🏥 Humanitarian Articles → Map Incidents:');
      humanitarian.forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      🏢 Source: ${article.source}`);
        console.log(`      🤖 AI Confidence: ${Math.round(article.confidence * 100)}%`);
        console.log(`      💭 Reasoning: ${article.reasoning.substring(0, 100)}...`);
        console.log('');
      });

      // Step 4: Convert and process humanitarian articles into map incidents
      console.log('🗺️  Converting humanitarian articles to map incidents...');
      
      const articlesForIncidents: NewsArticle[] = humanitarian.map(article => ({
        id: article.id,
        title: article.title,
        source: article.source,
        snippet: article.snippet,
        url: article.url
      }));
      
      await processNewsIntoIncidents({ articles: articlesForIncidents });
      console.log('✅ Humanitarian articles processed into map incidents');

      // Step 5: Verify new incidents were created
      const newIncidents = await getLatestIncidents();
      console.log(`\n📍 Map now has ${newIncidents.length} fresh incidents`);
      
      if (newIncidents.length > 0) {
        console.log('\n✨ Fresh Map Incidents:');
        newIncidents.forEach((incident, index) => {
          console.log(`   ${index + 1}. "${incident.title}"`);
          console.log(`      📍 Location: ${incident.latitude}, ${incident.longitude}`);
          console.log(`      🎨 Color: ${incident.color}`);
          console.log(`      F4DD Description: ${(incident.description || '').substring(0, 80)}...`);
          console.log('');
        });
      }

      // Step 6: Provide updated statistics
      const incidentsByColor = newIncidents.reduce((acc, incident) => {
        acc[incident.color] = (acc[incident.color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📊 Updated Map Statistics:');
      console.log(`   🔴 Health/Medical (Red): ${incidentsByColor['#ef4444'] || 0} incidents`);
      console.log(`   🔵 Weather/Natural (Blue): ${incidentsByColor['#3b82f6'] || 0} incidents`);
      console.log(`   🟢 Operations/Aid (Green): ${incidentsByColor['#22c55e'] || 0} incidents`);
      console.log(`   🟡 Conflict/Security (Amber): ${incidentsByColor['#f59e0b'] || 0} incidents`);
      console.log(`   📍 Total Map Markers: ${newIncidents.length} incidents`);

    } else {
      console.log('\n⚠️  No humanitarian articles found to generate map incidents');
      console.log('   This could be due to:');
      console.log('   - AI categorization service being unavailable');
      console.log('   - All articles being categorized as general news');
      console.log('   - No news sources returning humanitarian content');
    }

  } catch (error) {
    console.error('❌ Map refresh failed with error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
  }
}

// Run the refresh
if (require.main === module) {
  refreshMapIncidents()
    .then(() => {
      console.log('\n🎉 Map incident refresh completed!');
      console.log('💡 Refresh your browser to see the updated map');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Map refresh failed:', error);
      process.exit(1);
    });
}

export { refreshMapIncidents };
