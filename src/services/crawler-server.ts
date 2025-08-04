import { optimizedCrawlerService } from '@/services/optimized-crawler-service';
import type { NewsArticle } from '@/lib/types';

export async function fetchCrawledArticles(): Promise<{ articles?: NewsArticle[], error?: string }> {
  // Disable crawlers in production since they require browser automation
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Crawlers disabled in production environment');
    return { articles: [] };
  }

  try {
    console.log('🚀 Starting optimized crawlers for general news...');
    const articles = await optimizedCrawlerService.getAllArticles();

    if (articles && articles.length > 0) {
      console.log(`✅ Successfully crawled ${articles.length} articles`);
      return { articles: articles.slice(0, 10) }; // Limit to 10 articles
    } else {
      console.log('⚠️ No articles found by crawlers');
      return { articles: [] }; // Return empty array, not undefined
    }
  } catch (error) {
    console.error('Crawler service failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Web crawlers failed: ${errorMessage}` };
  }
}

