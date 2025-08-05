#!/usr/bin/env tsx

/**
 * Cleanup Duplicate Articles Script
 * 
 * This script removes duplicate articles from Firebase based on URL
 * and keeps only the most recent version of each article.
 */

import { createHash } from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Then import Firebase (after env vars are loaded)
import { getFirestore } from '../src/lib/firebase-admin';

const COLLECTIONS = {
  ARTICLES: 'crawled_articles'
} as const;

interface ArticleData {
  id: string;
  url: string;
  title: string;
  source: string;
  crawledAt: string;
  docId: string;
}

async function cleanupDuplicateArticles(): Promise<void> {
  console.log('🧹 Starting duplicate article cleanup...');
  
  // Debug environment variables
  console.log('🔍 Environment check:');
  console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
  console.log('   FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing');
  console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing');
  
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error('Firebase not available - check environment variables');
  }

  try {
    // Get all articles
    console.log('📄 Fetching all articles from Firebase...');
    const articlesSnapshot = await firestore.collection(COLLECTIONS.ARTICLES).get();
    
    console.log(`📊 Found ${articlesSnapshot.size} total articles`);
    
    // Group articles by URL
    const articlesByUrl = new Map<string, ArticleData[]>();
    
    articlesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const article: ArticleData = {
        id: data.id,
        url: data.url,
        title: data.title,
        source: data.source,
        crawledAt: data.crawledAt,
        docId: doc.id
      };
      
      if (!articlesByUrl.has(data.url)) {
        articlesByUrl.set(data.url, []);
      }
      articlesByUrl.get(data.url)!.push(article);
    });
    
    console.log(`🔗 Found ${articlesByUrl.size} unique URLs`);
    
    // Find duplicates
    const duplicateUrls = Array.from(articlesByUrl.entries())
      .filter(([url, articles]) => articles.length > 1);
    
    console.log(`🚨 Found ${duplicateUrls.length} URLs with duplicates`);
    
    let totalDuplicatesRemoved = 0;
    
    // Process each group of duplicates
    for (const [url, articles] of duplicateUrls) {
      console.log(`\n📰 Processing duplicates for: ${articles[0].title}`);
      console.log(`   URL: ${url}`);
      console.log(`   Found ${articles.length} duplicates`);
      
      // Sort by crawledAt (most recent first)
      articles.sort((a, b) => new Date(b.crawledAt).getTime() - new Date(a.crawledAt).getTime());
      
      // Keep the most recent one, delete the rest
      const keepArticle = articles[0];
      const deleteArticles = articles.slice(1);
      
      console.log(`   ✅ Keeping: ${keepArticle.id} (${keepArticle.crawledAt})`);
      
      // Create a consistent ID based on URL hash
      const newId = createHash('md5').update(url).digest('hex');
      
      // Update the kept article with consistent ID
      const batch = firestore.batch();
      
      // Delete old versions
      deleteArticles.forEach(article => {
        console.log(`   🗑️  Deleting: ${article.id} (${article.crawledAt})`);
        const docRef = firestore.collection(COLLECTIONS.ARTICLES).doc(article.docId);
        batch.delete(docRef);
        totalDuplicatesRemoved++;
      });
      
      // Update the kept article with new consistent ID
      const newDocRef = firestore.collection(COLLECTIONS.ARTICLES).doc(newId);
      const updatedArticle = {
        ...keepArticle,
        id: newId
      };
      delete (updatedArticle as any).docId; // Remove the temporary docId field
      
      batch.set(newDocRef, updatedArticle);
      
      // If the kept article had a different document ID, delete the old one
      if (keepArticle.docId !== newId) {
        const oldDocRef = firestore.collection(COLLECTIONS.ARTICLES).doc(keepArticle.docId);
        batch.delete(oldDocRef);
      }
      
      // Commit the batch
      await batch.commit();
      console.log(`   ✅ Updated article with consistent ID: ${newId}`);
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total articles processed: ${articlesSnapshot.size}`);
    console.log(`   - Unique URLs: ${articlesByUrl.size}`);
    console.log(`   - URLs with duplicates: ${duplicateUrls.length}`);
    console.log(`   - Duplicate articles removed: ${totalDuplicatesRemoved}`);
    console.log(`   - Articles remaining: ${articlesByUrl.size}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Execute if this file is run directly
if (require.main === module) {
  cleanupDuplicateArticles().catch(error => {
    console.error('❌ Unhandled error in cleanup:', error);
    process.exit(1);
  });
}

export { cleanupDuplicateArticles };
