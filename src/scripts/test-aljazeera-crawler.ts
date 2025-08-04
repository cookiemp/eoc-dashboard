/**
 * Test script specifically for Al Jazeera Africa crawler
 * Run: npx tsx src/scripts/test-aljazeera-crawler.ts
 */

import { AlJazeeraAfricaCrawler } from '@/services/crawler-service';

async function testAlJazeeraCrawler() {
  console.log('🕷️  Testing Al Jazeera Africa Crawler...\n');

  try {
    // Create a standalone Al Jazeera crawler instance
    const alJazeeraCrawler = new AlJazeeraAfricaCrawler();
    
    console.log('⏳ Starting crawl of Al Jazeera Africa...');
    console.log('URL: https://www.aljazeera.com/africa');
    console.log('Expected: Extract articles about African news\n');
    
    const startTime = Date.now();
    const result = await alJazeeraCrawler.crawl();
    const duration = Date.now() - startTime;

    // Display results
    console.log('📊 CRAWL RESULTS');
    console.log('================');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🏷️  Source: ${result.source}`);
    console.log(`📰 Articles Found: ${result.articles.length}`);
    console.log(`🕐 Crawled At: ${result.crawledAt}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.length}`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log();
    }

    if (result.articles.length > 0) {
      console.log('\n📰 EXTRACTED ARTICLES');
      console.log('====================');
      result.articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   🏷️  Source: ${article.source}`);
        console.log(`   🔗 URL: ${article.url}`);
        console.log(`   📝 Snippet: ${article.snippet.substring(0, 150)}...`);
        console.log(`   🆔 ID: ${article.id}`);
        console.log();
      });
      
      console.log('✅ Al Jazeera crawler test SUCCESSFUL!');
      console.log(`✅ Successfully extracted ${result.articles.length} articles`);
    } else {
      console.log('⚠️  No articles were extracted');
      console.log('This might indicate:');
      console.log('- Site structure changed');
      console.log('- Network/timeout issues');
      console.log('- Selector issues');
      console.log('- Blocking by the website');
    }

    // Performance metrics
    console.log('\n📈 PERFORMANCE METRICS');
    console.log('=====================');
    console.log(`Average time per article: ${result.articles.length > 0 ? Math.round(duration / result.articles.length) : 'N/A'}ms`);
    console.log(`Success rate: ${result.errors && result.errors.length > 0 ? 'Partial' : 'Full'}`);

  } catch (error) {
    console.error('❌ CRAWLER TEST FAILED');
    console.error('======================');
    console.error('Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\n🔧 TROUBLESHOOTING SUGGESTIONS:');
    console.error('- Check internet connection');
    console.error('- Verify Al Jazeera website is accessible');
    console.error('- Check if selectors need updating');
    console.error('- Ensure puppeteer is properly installed');
    
    process.exit(1);
  }
}

// Run the test
testAlJazeeraCrawler().then(() => {
  console.log('\n🎯 NEXT STEPS:');
  console.log('- If successful: Integrate into main crawler service');
  console.log('- If failed: Debug and fix issues');
  console.log('- Test timeout handling');
  console.log('- Verify error recovery mechanisms');
  process.exit(0);
});
