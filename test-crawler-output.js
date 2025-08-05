// Test script to check if optimized crawler service returns actual news
const { OptimizedCrawlerService, OptimizedBbcEthiopiaCrawler, OptimizedTestCrawler } = require('./dist/services/optimized-crawler-service.js');

async function testCrawlers() {
  console.log('🧪 Testing Optimized Crawler Service...\n');
  
  try {
    // Test 1: Run the test crawler (should return mock data)
    console.log('📋 Test 1: Testing Mock Crawler');
    const testCrawler = new OptimizedTestCrawler();
    const testResult = await testCrawler.crawl();
    
    console.log(`✅ Test Crawler Result:`);
    console.log(`   - Source: ${testResult.source}`);
    console.log(`   - Articles: ${testResult.articles.length}`);
    console.log(`   - Performance: ${testResult.performance.totalTime}ms`);
    if (testResult.articles.length > 0) {
      console.log(`   - Sample article: "${testResult.articles[0].title.substring(0, 60)}..."`);
    }
    console.log('');
    
    // Test 2: Try BBC Ethiopia crawler (real crawler)
    console.log('📰 Test 2: Testing BBC Ethiopia Crawler (Real)');
    const bbcCrawler = new OptimizedBbcEthiopiaCrawler();
    const bbcResult = await bbcCrawler.crawl();
    
    console.log(`✅ BBC Crawler Result:`);
    console.log(`   - Source: ${bbcResult.source}`);
    console.log(`   - Articles: ${bbcResult.articles.length}`);
    console.log(`   - Performance: ${bbcResult.performance.totalTime}ms`);
    console.log(`   - Success Rate: ${bbcResult.performance.successRate}%`);
    if (bbcResult.errors) {
      console.log(`   - Errors: ${bbcResult.errors.length}`);
    }
    
    if (bbcResult.articles.length > 0) {
      console.log(`   - Articles found:`);
      bbcResult.articles.forEach((article, i) => {
        console.log(`     ${i + 1}. "${article.title}"`);
        console.log(`        URL: ${article.url}`);
        console.log(`        Snippet: ${article.snippet.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No articles found - likely using fallback curated content');
    }
    
    // Test 3: Check if articles contain Ethiopia-related content
    console.log('🔍 Test 3: Analyzing Article Content');
    const allArticles = [...testResult.articles, ...bbcResult.articles];
    
    const ethiopiaKeywords = ['ethiopia', 'ethiopian', 'addis ababa', 'tigray', 'oromia'];
    const relevantArticles = allArticles.filter(article => 
      ethiopiaKeywords.some(keyword => 
        article.title.toLowerCase().includes(keyword) || 
        article.snippet.toLowerCase().includes(keyword)
      )
    );
    
    console.log(`✅ Content Analysis:`);
    console.log(`   - Total articles: ${allArticles.length}`);
    console.log(`   - Ethiopia-related: ${relevantArticles.length}`);
    console.log(`   - Relevance rate: ${Math.round((relevantArticles.length / allArticles.length) * 100)}%`);
    
    // Test 4: Run full crawler service
    console.log('\n🚀 Test 4: Testing Full Crawler Service');
    const crawlerService = new OptimizedCrawlerService();
    const serviceResults = await crawlerService.crawlAll();
    
    console.log(`✅ Crawler Service Results:`);
    serviceResults.forEach(result => {
      console.log(`   - ${result.source}: ${result.articles.length} articles`);
      if (result.errors) {
        console.log(`     Errors: ${result.errors.join(', ')}`);
      }
    });
    
    const totalArticles = serviceResults.reduce((sum, r) => sum + r.articles.length, 0);
    console.log(`   - Total articles across all sources: ${totalArticles}`);
    
    // Determine if we're getting real vs mock data
    const realDataSources = serviceResults.filter(r => 
      r.articles.length > 0 && 
      !r.articles[0].url.includes('example.com') &&
      !r.articles[0].url.includes('mock') &&
      !r.articles[0].url.includes('curated')
    );
    
    console.log(`\n📊 Final Assessment:`);
    if (realDataSources.length > 0) {
      console.log(`✅ SUCCESS: ${realDataSources.length} sources returning real news data`);
      console.log(`   Real sources: ${realDataSources.map(r => r.source).join(', ')}`);
    } else {
      console.log(`⚠️  WARNING: All sources appear to be returning fallback/mock data`);
      console.log(`   This could be due to:`);
      console.log(`   - Website blocking/rate limiting`);
      console.log(`   - Changed website structure`);
      console.log(`   - Network connectivity issues`);
      console.log(`   - Sites requiring additional authentication`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCrawlers().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
