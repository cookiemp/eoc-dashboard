'use server';

/**
 * Dashboard Cache Service
 * 
 * Provides multi-layer caching for dashboard data to improve performance
 * and reduce redundant AI operations on page reloads.
 */

import { getFirestore } from '@/lib/firebase-admin';
import type { CategorizedArticle } from '@/ai/flows/categorize-news-articles-flow';
import type { IncidentWithId } from '@/services/incident-service';

// Cache duration constants
const CACHE_DURATIONS = {
  NEWS_DATA: 15 * 60 * 1000,    // 15 minutes for news data
  INCIDENTS: 10 * 60 * 1000,    // 10 minutes for incidents  
  SUMMARY: 30 * 60 * 1000,      // 30 minutes for AI summary
} as const;

export type CachedDashboardData = {
  humanitarian: CategorizedArticle[];
  general: CategorizedArticle[];
  incidents: IncidentWithId[];
  summary: { humanitarianCount: number; generalCount: number };
  lastUpdated: string;
  cacheValidUntil: string;
};

/**
 * Get cached dashboard data if valid, otherwise return null
 */
export async function getCachedDashboardData(): Promise<CachedDashboardData | null> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for dashboard cache');
    return null;
  }

  try {
    const cacheDoc = await firestore
      .collection('dashboard_cache')
      .doc('current_data')
      .get();

    if (!cacheDoc.exists) {
      console.log('📋 No cached dashboard data found');
      return null;
    }

    const cachedData = cacheDoc.data() as CachedDashboardData;
    const now = new Date();
    const cacheValidUntil = new Date(cachedData.cacheValidUntil);

    if (now > cacheValidUntil) {
      console.log('📋 Cached dashboard data expired');
      return null;
    }

    console.log(`✅ Using cached dashboard data (valid until ${cacheValidUntil.toISOString()})`);
    return cachedData;

  } catch (error) {
    console.error('❌ Error fetching cached dashboard data:', error);
    return null;
  }
}

/**
 * Cache dashboard data with expiration
 */
export async function setCachedDashboardData(
  humanitarian: CategorizedArticle[],
  general: CategorizedArticle[],
  incidents: IncidentWithId[]
): Promise<void> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for dashboard caching');
    return;
  }

  const now = new Date();
  const cacheValidUntil = new Date(now.getTime() + CACHE_DURATIONS.NEWS_DATA);

  const cacheData: CachedDashboardData = {
    humanitarian,
    general,
    incidents,
    summary: {
      humanitarianCount: humanitarian.length,
      generalCount: general.length,
    },
    lastUpdated: now.toISOString(),
    cacheValidUntil: cacheValidUntil.toISOString(),
  };

  try {
    await firestore
      .collection('dashboard_cache')
      .doc('current_data')
      .set(cacheData);

    console.log(`✅ Cached dashboard data (expires: ${cacheValidUntil.toISOString()})`);
  } catch (error) {
    console.error('❌ Error caching dashboard data:', error);
  }
}

/**
 * Clear dashboard cache (force refresh)
 */
export async function clearDashboardCache(): Promise<void> {
  const firestore = await getFirestore();
  if (!firestore) {
    console.warn('⚠️ Firebase not available for cache clearing');
    return;
  }

  try {
    await firestore
      .collection('dashboard_cache')
      .doc('current_data')
      .delete();

    console.log('✅ Dashboard cache cleared');
  } catch (error) {
    console.error('❌ Error clearing dashboard cache:', error);
  }
}
