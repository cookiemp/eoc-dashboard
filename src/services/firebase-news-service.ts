'use server';

/**
 * Firebase News Service
 * 
 * This service reads news articles from Firebase Firestore that were
 * crawled and saved by the GitHub Actions workflow.
 * 
 * Used by the Vercel app to display fresh news without running crawlers.
 */

import { firestore } from '@/lib/firebase-admin';
import type { NewsArticle } from '@/lib/types';

// Firebase collections (must match GitHub Actions script)
const COLLECTIONS = {
  ARTICLES: 'crawled_articles',
  CRAWLER_RUNS: 'crawler_runs',
  METADATA: 'crawler_metadata'
} as const;

export type CrawlerStatus = {
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'partial_failure' | 'failure';
  lastRunArticleCount?: number;
  lastRunEnvironment?: string;
  nextScheduledRun?: string;
  isHealthy?: boolean;
};

export type NewsServiceResult = {
  articles: NewsArticle[];
  status: CrawlerStatus;
  lastUpdated: string;
  sources: string[];
};

/**
 * Get latest crawled articles from Firebase
 */
export async function getCrawledNews(limit: number = 20): Promise<NewsServiceResult> {
  try {
    console.log('🔍 Fetching crawled news from Firebase...');
    
    // Get articles ordered by crawledAt desc
    const articlesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('isActive', '==', true)
      .orderBy('crawledAt', 'desc')
      .limit(limit)
      .get();

    const articles: NewsArticle[] = articlesQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title,
        source: data.source,
        snippet: data.snippet,
        url: data.url
      };
    });

    // Get crawler status
    const statusDoc = await firestore
      .collection(COLLECTIONS.METADATA)
      .doc('status')
      .get();

    const status: CrawlerStatus = statusDoc.exists ? statusDoc.data() as CrawlerStatus : {};

    // Get unique sources
    const sources = [...new Set(articles.map(article => article.source))];

    const result: NewsServiceResult = {
      articles,
      status,
      lastUpdated: new Date().toISOString(),
      sources
    };

    console.log(`✅ Retrieved ${articles.length} articles from ${sources.length} sources`);
    return result;

  } catch (error) {
    console.error('❌ Error fetching crawled news:', error);
    
    // Return empty result with error status
    return {
      articles: [],
      status: {
        isHealthy: false,
        lastRunStatus: 'failure'
      },
      lastUpdated: new Date().toISOString(),
      sources: []
    };
  }
}

/**
 * Get articles from a specific source
 */
export async function getCrawledNewsBySource(source: string, limit: number = 10): Promise<NewsArticle[]> {
  try {
    console.log(`🔍 Fetching ${source} articles from Firebase...`);
    
    const articlesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('source', '==', source)
      .where('isActive', '==', true)
      .orderBy('crawledAt', 'desc')
      .limit(limit)
      .get();

    const articles: NewsArticle[] = articlesQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title,
        source: data.source,
        snippet: data.snippet,
        url: data.url
      };
    });

    console.log(`✅ Retrieved ${articles.length} articles from ${source}`);
    return articles;

  } catch (error) {
    console.error(`❌ Error fetching ${source} articles:`, error);
    return [];
  }
}

/**
 * Get crawler run history for monitoring
 */
export async function getCrawlerRunHistory(limit: number = 10): Promise<any[]> {
  try {
    const runsQuery = await firestore
      .collection(COLLECTIONS.CRAWLER_RUNS)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const runs = runsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return runs;

  } catch (error) {
    console.error('❌ Error fetching crawler run history:', error);
    return [];
  }
}

/**
 * Check if crawler service is healthy
 */
export async function getCrawlerHealth(): Promise<{ isHealthy: boolean; lastRunAt?: string; status?: string }> {
  try {
    const statusDoc = await firestore
      .collection(COLLECTIONS.METADATA)
      .doc('status')
      .get();

    if (!statusDoc.exists) {
      return { isHealthy: false, status: 'No crawler runs found' };
    }

    const data = statusDoc.data() as CrawlerStatus;
    const lastRun = data.lastRunAt ? new Date(data.lastRunAt) : null;
    const now = new Date();
    
    // Consider healthy if last run was within 45 minutes (30 min schedule + 15 min buffer)
    const isRecent = lastRun ? (now.getTime() - lastRun.getTime()) < 45 * 60 * 1000 : false;
    
    return {
      isHealthy: (data.isHealthy || false) && isRecent,
      lastRunAt: data.lastRunAt,
      status: data.lastRunStatus || 'unknown'
    };

  } catch (error) {
    console.error('❌ Error checking crawler health:', error);
    return { isHealthy: false, status: 'Error checking health' };
  }
}

/**
 * Get available news sources
 */
export async function getAvailableSources(): Promise<string[]> {
  try {
    const sourcesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('isActive', '==', true)
      .select('source')
      .get();

    const sources = [...new Set(sourcesQuery.docs.map(doc => doc.data().source))];
    return sources.sort();

  } catch (error) {
    console.error('❌ Error fetching available sources:', error);
    return [];
  }
}
