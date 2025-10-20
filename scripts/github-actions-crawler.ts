#!/usr/bin/env tsx

/**
 * GitHub Actions Crawler Script
 * 
 * This script runs in GitHub Actions environment to:
 * 1. Execute all news crawlers
 * 2. Save results to Firebase Firestore
 * 3. Handle errors gracefully
 * 4. Log performance metrics
 */

import { OptimizedCrawlerService } from '../src/services/optimized-crawler-service';
import { firestore } from '../src/lib/firebase-admin';
import type { CrawlerResult } from '../src/services/optimized-crawler-service';
import type { NewsArticle } from '../src/lib/types';
import { createHash } from 'crypto';

// Enhanced logging for GitHub Actions
class GitHubActionsLogger {
  static info(message: string, data?: any): void {
    console.log(`ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static success(message: string, data?: any): void {
    console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static warn(message: string, data?: any): void {
    console.log(`⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static error(message: string, error?: any): void {
    console.log(`❌ ${message}`, error);
    if (error?.stack) {
      console.log('Stack trace:', error.stack);
    }
  }
  
  static group(name: string): void {
    console.log(`::group::${name}`);
  }
  
  static endGroup(): void {
    console.log('::endgroup::');
  }
}

// Firebase collections
const COLLECTIONS = {
  ARTICLES: 'crawled_articles',
  CRAWLER_RUNS: 'crawler_runs',
  METADATA: 'crawler_metadata'
} as const;

/**
 * Save articles to Firestore with deduplication
 */
async function saveArticlesToFirestore(articles: NewsArticle[]): Promise<void> {
  if (articles.length === 0) {
    GitHubActionsLogger.warn('No articles to save');
    return;
  }

  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  GitHubActionsLogger.info(`Saving ${articles.length} articles to Firestore...`);
  
  const batch = firestore.batch();
  const timestamp = new Date().toISOString();
  
  for (const article of articles) {
    // Use a hash of the article URL for consistent, unique ID
    const articleId = createHash('md5').update(article.url).digest('hex');
    const docRef = firestore.collection(COLLECTIONS.ARTICLES).doc(articleId);
    
    const articleWithMetadata = {
      ...article,
      id: articleId, // Overwrite with consistent ID
      crawledAt: timestamp,
      lastUpdated: timestamp,
      isActive: true
    };
    
    batch.set(docRef, articleWithMetadata, { merge: true });
  }
  
  try {
    await batch.commit();
    GitHubActionsLogger.success(`Successfully saved ${articles.length} articles to Firestore`);
  } catch (error) {
    GitHubActionsLogger.error('Failed to save articles to Firestore', error);
    throw error;
  }
}

/**
 * Save crawler run metadata
 */
async function saveCrawlerRunMetadata(results: CrawlerResult[]): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const runId = `run_${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  const totalArticles = results.reduce((sum, r) => sum + r.articles.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0);
  const avgSuccessRate = results.reduce((sum, r) => sum + r.performance.successRate, 0) / results.length;
  
  const runMetadata = {
    runId,
    timestamp,
    crawlerResults: results.map(r => ({
      source: r.source,
      articlesFound: r.articles.length,
      errors: r.errors || [],
      performance: r.performance
    })),
    summary: {
      totalCrawlers: results.length,
      totalArticles,
      totalErrors,
      averageSuccessRate: Math.round(avgSuccessRate),
      isSuccessful: totalArticles > 0
    },
    environment: {
      platform: 'github-actions',
      nodeVersion: process.version,
      timestamp
    }
  };
  
  try {
    await firestore.collection(COLLECTIONS.CRAWLER_RUNS).doc(runId).set(runMetadata);
    GitHubActionsLogger.success('Saved crawler run metadata', {
      runId,
      totalArticles,
      totalErrors
    });
  } catch (error) {
    GitHubActionsLogger.error('Failed to save crawler run metadata', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Clean up old articles (keep only last 100 per source)
 */
async function cleanupOldArticles(): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  GitHubActionsLogger.info('Cleaning up old articles...');
  
  try {
    // Get all sources
    const sourcesQuery = await firestore.collection(COLLECTIONS.ARTICLES)
      .select('source')
      .get();
    
    const sources = [...new Set(sourcesQuery.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => (doc.data() as any).source as string))];
    
    for (const source of sources) {
      // Get articles for this source, ordered by crawledAt desc
      const sourceArticles = await firestore.collection(COLLECTIONS.ARTICLES)
        .where('source', '==', source)
        .orderBy('crawledAt', 'desc')
        .get();
      
      if (sourceArticles.docs.length > 100) {
        // Delete articles beyond the 100 most recent
        const articlesToDelete = sourceArticles.docs.slice(100);
        const batch = firestore.batch();
        
        articlesToDelete.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        GitHubActionsLogger.info(`Cleaned up ${articlesToDelete.length} old articles from ${source}`);
      }
    }
    
    GitHubActionsLogger.success('Article cleanup completed');
  } catch (error) {
    GitHubActionsLogger.error('Failed to cleanup old articles', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Update crawler metadata (last run time, status, etc.)
 */
async function updateCrawlerMetadata(isSuccessful: boolean, totalArticles: number): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const metadata = {
    lastRunAt: new Date().toISOString(),
    lastRunStatus: isSuccessful ? 'success' : 'partial_failure',
    lastRunArticleCount: totalArticles,
    lastRunEnvironment: 'github-actions',
    nextScheduledRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    isHealthy: isSuccessful
  };
  
  try {
    await firestore.collection(COLLECTIONS.METADATA).doc('status').set(metadata, { merge: true });
    GitHubActionsLogger.success('Updated crawler metadata');
  } catch (error) {
    GitHubActionsLogger.error('Failed to update crawler metadata', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Main crawler execution function
 */
async function runCrawlers(): Promise<void> {
  const startTime = Date.now();
  GitHubActionsLogger.info('🚀 Starting GitHub Actions crawler execution...');
  
  // Check if we have required environment variables
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing required Firebase environment variables');
  }
  
  GitHubActionsLogger.info('Environment check passed ✅');
  
  let crawlerService: OptimizedCrawlerService;
  let results: CrawlerResult[] = [];
  
  try {
    // Initialize crawler service
    GitHubActionsLogger.group('Initializing Crawler Service');
    crawlerService = new OptimizedCrawlerService();
    GitHubActionsLogger.success('Crawler service initialized');
    GitHubActionsLogger.endGroup();
    
    // Run all crawlers
    GitHubActionsLogger.group('Running News Crawlers');
    results = await crawlerService.crawlAll();
    GitHubActionsLogger.endGroup();
    
    // Extract all articles
    const allArticles = results.flatMap(result => result.articles);
    
    // Log results summary
    GitHubActionsLogger.group('Crawler Results Summary');
    results.forEach(result => {
      GitHubActionsLogger.info(`${result.source}:`, {
        articles: result.articles.length,
        errors: result.errors?.length || 0,
        performance: result.performance
      });
    });
    GitHubActionsLogger.endGroup();
    
    if (allArticles.length === 0) {
      GitHubActionsLogger.warn('No articles were crawled from any source');
    } else {
      // Save articles to Firestore
      GitHubActionsLogger.group('Saving to Firebase');
      await saveArticlesToFirestore(allArticles);
      GitHubActionsLogger.endGroup();
    }
    
    // Save run metadata
    GitHubActionsLogger.group('Saving Metadata');
    await saveCrawlerRunMetadata(results);
    await updateCrawlerMetadata(allArticles.length > 0, allArticles.length);
    GitHubActionsLogger.endGroup();
    
    // Cleanup old articles (run periodically)
    if (Math.random() < 0.1) { // 10% chance to run cleanup
      GitHubActionsLogger.group('Cleanup');
      await cleanupOldArticles();
      GitHubActionsLogger.endGroup();
    }
    
    const totalTime = Date.now() - startTime;
    GitHubActionsLogger.success(`✅ Crawler execution completed successfully!`, {
      totalTime: `${totalTime}ms`,
      totalArticles: allArticles.length,
      totalSources: results.length
    });
    
  } catch (error) {
    GitHubActionsLogger.error('❌ Crawler execution failed', error);
    
    // Still try to save metadata about the failure
    try {
      await updateCrawlerMetadata(false, 0);
    } catch (metadataError) {
      GitHubActionsLogger.error('Failed to save failure metadata', metadataError);
    }
    
    // Exit with error code for GitHub Actions
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runCrawlers().catch(error => {
    GitHubActionsLogger.error('Unhandled error in crawler execution', error);
    process.exit(1);
  });
}

export { runCrawlers };
