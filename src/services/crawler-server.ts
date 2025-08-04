import { optimizedCrawlerService } from '@/services/optimized-crawler-service';
import type { NewsArticle } from '@/lib/types';

export async function fetchCrawledArticles(): Promise<{ articles?: NewsArticle[], error?: string }> {
  try {
    console.log('🚀 Starting optimized crawlers for general news...');
    const articles = await optimizedCrawlerService.getAllArticles();

    if (articles && articles.length > 0) {
      console.log(`✅ Successfully crawled ${articles.length} articles`);
      return { articles: articles.slice(0, 10) }; // Limit to 10 articles
    }
  } catch (error) {
    console.error('Crawler service failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Web crawlers failed: ${errorMessage}` };
  }
}

