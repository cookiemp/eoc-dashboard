'use server';

/**
 * Firebase News Service
 * 
 * This service reads news articles from Firebase Firestore that were
 * crawled and saved by the GitHub Actions workflow.
 * 
 * Used by the Vercel app to display fresh news without running crawlers.
 */

import { firestore, isFirebaseAvailable, getFirestore } from '@/lib/firebase-admin';
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
  // Check if Firebase is available
  if (!isFirebaseAvailable() || !firestore) {
    console.warn('⚠️ Firebase not available for getCrawledNews');
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

  try {
    console.log('🔍 Fetching crawled news from Firebase...');
    
    // Get articles with a simpler query to avoid index requirement
    // First try to get all active articles, then sort them
    const articlesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('isActive', '==', true)
      .limit(limit * 2) // Get more to sort properly
      .get();

    // Sort by crawledAt manually and limit
    const sortedDocs = articlesQuery.docs
      .sort((a: any, b: any) => {
        const aData = a.data();
        const bData = b.data();
        
        // Handle both Firestore Timestamp and string formats
        let aTime: Date;
        let bTime: Date;
        
        if (aData.crawledAt?.toDate) {
          // Firestore Timestamp
          aTime = aData.crawledAt.toDate();
        } else if (aData.crawledAt) {
          // String format
          aTime = new Date(aData.crawledAt);
        } else {
          aTime = new Date(0);
        }
        
        if (bData.crawledAt?.toDate) {
          // Firestore Timestamp
          bTime = bData.crawledAt.toDate();
        } else if (bData.crawledAt) {
          // String format
          bTime = new Date(bData.crawledAt);
        } else {
          bTime = new Date(0);
        }
        
        return bTime.getTime() - aTime.getTime(); // Descending order
      })
      .slice(0, limit);

    const articles: NewsArticle[] = sortedDocs.map((doc: any) => {
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
 * Get archived news articles from Firebase with pagination
 */
export async function getArchivedNews(page: number = 1, pageSize: number = 10, startDate?: string, endDate?: string, search?: string): Promise<any> {
  const firestoreInstance = await getFirestore();
  if (!firestoreInstance) {
    console.warn('⚠️ Firebase not available for getArchivedNews');
    return { articles: [], totalArticles: 0, page, pageSize };
  }

  try {
    console.log('🔍 Fetching archived articles from Firebase...');
    
    // Use a simple query to avoid index requirements
    let query = firestoreInstance.collection(COLLECTIONS.ARTICLES)
      .where('isActive', '==', true)
      .limit(pageSize * 5); // Get more documents to allow for filtering

    const snapshot = await query.get();
    console.log(`📄 Retrieved ${snapshot.size} total documents from Firebase`);
    
    // Convert to articles and sort manually
    let allArticles = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title,
        source: data.source,
        snippet: data.snippet,
        url: data.url,
        crawledAt: data.crawledAt
      };
    });

    // Sort by crawledAt (newest first)
    allArticles.sort((a: { crawledAt: string }, b: { crawledAt: string }) => {
      const aTime = new Date(a.crawledAt).getTime();
      const bTime = new Date(b.crawledAt).getTime();
      return bTime - aTime;
    });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      allArticles = allArticles.filter((article: { title: string; snippet: string }) => 
        article.title.toLowerCase().includes(searchLower) || 
        article.snippet.toLowerCase().includes(searchLower)
      );
    }

    // Apply date filtering if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Date.now();
      
      allArticles = allArticles.filter((article: { crawledAt: string }) => {
        const articleTime = new Date(article.crawledAt).getTime();
        return articleTime >= start && articleTime <= end;
      });
    }

    const totalArticles = allArticles.length;
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const articles = allArticles.slice(startIndex, endIndex);

    console.log(`✅ Returning ${articles.length} articles (page ${page}/${Math.ceil(totalArticles / pageSize)})`);

    return {
      articles,
      totalArticles,
      page,
      pageSize
    };
    
  } catch (error) {
    console.error('❌ Error fetching archived news:', error);
    return {
      articles: [],
      totalArticles: 0,
      page,
      pageSize,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get articles from a specific source
 */
export async function getCrawledNewsBySource(source: string, limit: number = 10): Promise<NewsArticle[]> {
  // Check if Firebase is available
  if (!isFirebaseAvailable() || !firestore) {
    console.warn(`⚠️ Firebase not available for getCrawledNewsBySource (${source})`);
    return [];
  }

  try {
    console.log(`🔍 Fetching ${source} articles from Firebase...`);
    
    const articlesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('source', '==', source)
      .where('isActive', '==', true)
      .orderBy('crawledAt', 'desc')
      .limit(limit)
      .get();

    const articles: NewsArticle[] = articlesQuery.docs.map((doc: any) => {
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
  // Use the async getFirestore function instead of checking isFirebaseAvailable
  const firestoreInstance = await getFirestore();
  if (!firestoreInstance) {
    console.warn('⚠️ Firebase not available for getCrawlerRunHistory');
    return [];
  }

  try {
    // First try with orderBy - this might fail if index doesn't exist
    let runsQuery;
    try {
      runsQuery = await firestoreInstance
        .collection(COLLECTIONS.CRAWLER_RUNS)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
    } catch (indexError) {
      console.warn('⚠️ Index issue, falling back to simple query:', indexError);
      // Fallback to simple query without orderBy
      runsQuery = await firestoreInstance
        .collection(COLLECTIONS.CRAWLER_RUNS)
        .limit(limit * 2) // Get more docs to sort manually
        .get();
    }

    let runs = runsQuery.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort manually if we used fallback query
    if (runs.length > 0 && runs[0].timestamp) {
      runs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      runs = runs.slice(0, limit); // Apply limit after sorting
    }

    console.log(`✅ Retrieved ${runs.length} crawler runs (requested: ${limit})`);
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
  // Use the async getFirestore function instead of checking isFirebaseAvailable
  const firestoreInstance = await getFirestore();
  if (!firestoreInstance) {
    console.warn('⚠️ Firebase not available for getCrawlerHealth');
    return { isHealthy: false, status: 'Firebase service unavailable' };
  }

  try {
    const statusDoc = await firestoreInstance
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
  // Check if Firebase is available
  if (!isFirebaseAvailable() || !firestore) {
    console.warn('⚠️ Firebase not available for getAvailableSources');
    return [];
  }

  try {
    const sourcesQuery = await firestore
      .collection(COLLECTIONS.ARTICLES)
      .where('isActive', '==', true)
      .select('source')
      .get();

    const sources = [...new Set(sourcesQuery.docs.map((doc: any) => doc.data().source as string))] as string[];
    return (sources as string[]).sort();

  } catch (error) {
    console.error('❌ Error fetching available sources:', error);
    return [];
  }
}
