#!/usr/bin/env tsx

/**
 * Test script to verify AI news categorization integration
 * Usage: npx tsx src/scripts/test-ai-categorization.ts
 */

import { getAllNewsWithCategorization } from '@/app/actions';

async function testAiCategorization() {
  console.log('🔍 Testing AI News Categorization Integration...\n');
  
  try {
    console.log('📰 Fetching and categorizing news from all sources...');
    const result = await getAllNewsWithCategorization();
    
    if (result.error) {
      console.error('❌ Error:', result.error);
      return;
    }
    
    const humanitarian = result.humanitarian || [];
    const general = result.general || [];
    const summary = result.summary || { humanitarianCount: 0, generalCount: 0 };
    
    console.log('✅ AI Categorization Results:');
    console.log(`   📊 Total Articles: ${summary.humanitarianCount + summary.generalCount}`);
    console.log(`   🏥 Humanitarian: ${summary.humanitarianCount} articles`);
    console.log(`   📰 General: ${summary.generalCount} articles\n`);
    
    // Display sample humanitarian articles
    if (humanitarian.length > 0) {
      console.log('🏥 Sample Humanitarian Articles:');
      humanitarian.slice(0, 3).forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      Source: ${article.source}`);
        console.log(`      Confidence: ${Math.round(article.confidence * 100)}%`);
        console.log(`      Reasoning: ${article.reasoning}`);
        console.log('');
      });
    }
    
    // Display sample general articles
    if (general.length > 0) {
      console.log('📰 Sample General Articles:');
      general.slice(0, 3).forEach((article, index) => {
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      Source: ${article.source}`);
        console.log(`      Confidence: ${Math.round(article.confidence * 100)}%`);
        console.log(`      Reasoning: ${article.reasoning}`);
        console.log('');
      });
    }
    
    if (humanitarian.length === 0 && general.length === 0) {
      console.log('⚠️  No articles were returned. This might indicate:');
      console.log('   - API rate limits');
      console.log('   - Network connectivity issues');
      console.log('   - Configuration problems');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testAiCategorization()
    .then(() => {
      console.log('🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { testAiCategorization };
