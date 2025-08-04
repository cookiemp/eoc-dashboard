/**
 * Test script for the crawler framework
 * Run with: npx tsx src/scripts/test-crawler.ts
 */

import { crawlerService } from '@/services/crawler-service';

async function testCrawlerFramework() {
  console.log('🕷️  Testing Crawler Framework...\n');

  try {
    // Test the basic crawler service
    console.log('Phase 1.1 Test: Basic Framework Validation');
    console.log('============================================');

    // Test getAllArticles method
    const articles = await crawlerService.getAllArticles();
    
    console.log(`✅ Successfully crawled ${articles.length} articles`);
    
    if (articles.length > 0) {
      console.log('\n📰 Sample articles:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source}`);
        console.log(`   Snippet: ${article.snippet.substring(0, 100)}...`);
        console.log(`   URL: ${article.url}\n`);
      });
    }

    // Test crawler results with error handling
    console.log('🔍 Testing crawler results structure...');
    const results = await crawlerService.crawlAll();
    
    results.forEach(result => {
      console.log(`Source: ${result.source}`);
      console.log(`Articles: ${result.articles.length}`);
      console.log(`Crawled at: ${result.crawledAt}`);
      if (result.errors) {
        console.log(`Errors: ${result.errors.join(', ')}`);
      }
      console.log('---');
    });

    console.log('✅ Crawler framework test completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('- Phase 1.2: Identify target news sites');
    console.log('- Phase 1.3: Develop real spiders for Ethiopian news sites');

  } catch (error) {
    console.error('❌ Crawler framework test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCrawlerFramework();
