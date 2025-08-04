import { OptimizedUnOchaCrawler } from '@/services/optimized-crawler-service';
import type { CrawlerResult } from '@/services/optimized-crawler-service';

// Test the UN OCHA Crawler
(async () => {
  const crawler = new OptimizedUnOchaCrawler();
  try {
    console.log('Starting UN OCHA Ethiopia Crawler Test...');
    const result: CrawlerResult = await crawler.crawl();
    console.log('Crawling Finished:', {
      source: result.source,
      articlesCount: result.articles.length,
      errors: result.errors,
      performance: result.performance
    });
  } catch (error) {
    console.error('Crawler Test Failed:', error);
  }
})();

