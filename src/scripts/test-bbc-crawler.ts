/**
 * Test crawler service with BBC Africa integration
 * Run: npx tsx src/scripts/test-bbc-crawler.ts
 */

import { crawlerService } from '@/services/crawler-service';

async function testBbcCrawler() {
  console.log('🕷️  Testing BBC Africa Crawler...\n');

  try {
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

  } catch (error) {
    console.error('❌ Error testing BBC Africa Crawler:', error);
  }
}

// Run the test
testBbcCrawler();
