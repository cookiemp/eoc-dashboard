import { NextResponse } from 'next/server';
import { getCrawlerHealth, getCrawlerRunHistory } from '@/services/firebase-news-service';

export async function GET() {
  try {
    console.log('🔍 Fetching crawler health data...');
    
    // Use the centralized Firebase service
    let useFirebase = true;
    let firebaseError = null;
    
    try {
      // Test Firebase connection by trying to get health data
      const healthCheck = await getCrawlerHealth();
      console.log('🔥 Firebase health check result:', healthCheck);
      
      if (healthCheck.isHealthy !== undefined) {
        console.log('✅ Firebase connection successful, fetching real data...');
        
        // Get detailed run history for statistics - fetch all available runs
        const runHistory = await getCrawlerRunHistory(5000); // High limit to capture all historical runs
        console.log(`📊 Retrieved ${runHistory.length} crawler runs from Firebase`);
        
        // Calculate health status and statistics
        const healthStatus = {
          isHealthy: healthCheck.isHealthy,
          status: healthCheck.status || 'unknown',
          lastRunAt: healthCheck.lastRunAt
        };
        
        const stats = calculateHealthStats(runHistory);
        
        // Get the latest metadata if available
        let detailedMetrics = null;
        try {
          // Try to get metadata using getFirestore function
          const { getFirestore } = await import('@/lib/firebase-admin');
          const firestoreInstance = await getFirestore();
          if (firestoreInstance) {
            const metadataDoc = await firestoreInstance.collection('crawler_metadata').doc('status').get();
            if (metadataDoc.exists) {
              detailedMetrics = metadataDoc.data();
              console.log('📋 Retrieved detailed metrics from Firebase');
            }
          }
        } catch (metadataError) {
          console.log('ℹ️ Could not fetch detailed metrics (this is normal):', metadataError);
        }
        
        const response = {
          health: healthStatus,
          metrics: detailedMetrics,
          stats,
          runHistory: runHistory.slice(0, 5), // Return only last 5 runs for UI
          lastUpdated: new Date().toISOString(),
          debug: {
            source: 'firebase-real-data',
            hasMetrics: !!detailedMetrics,
            runHistoryCount: runHistory.length,
            environment: detailedMetrics?.lastRunEnvironment || 'production'
          }
        };
        
        console.log('✅ Successfully returning REAL Firebase data!', {
          isHealthy: healthStatus.isHealthy,
          totalRuns: stats.totalRuns,
          successRate: stats.successRate
        });
        
        return NextResponse.json(response);
        
      } else {
        useFirebase = false;
        firebaseError = 'Health check returned undefined status';
      }
      
    } catch (firebaseErr) {
      console.error('❌ Firebase service error:', firebaseErr);
      useFirebase = false;
      firebaseError = firebaseErr instanceof Error ? firebaseErr.message : 'Firebase service unavailable';
    }
    
    // Final fallback to mock data
    console.log('⚠️ Using mock crawler health data as fallback');
    console.log('📝 Fallback reason:', firebaseError || 'Firebase unavailable');
    
    const mockResponse = {
      health: {
        isHealthy: false, // Mark as unhealthy when using mock data
        status: 'mock-data-fallback',
        lastRunAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
      },
      metrics: {
        lastRunAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        lastRunStatus: 'mock-data',
        lastRunArticleCount: 8,
        lastRunEnvironment: 'development-mock-fallback',
        nextScheduledRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        isHealthy: false
      },
      debug: {
        source: 'mock-fallback',
        firebaseError: firebaseError || 'Firebase service unavailable',
        reason: 'Real Firebase data could not be retrieved'
      },
      stats: {
        totalRuns: 0, // Show zeros to indicate no real data
        successfulRuns: 0,
        successRate: 0,
        averageArticlesPerRun: 0,
        totalArticlesCrawled: 0,
        averageRunTime: 0
      },
      runHistory: [],
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('❌ Error fetching crawler health:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch crawler health data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate health status from metadata
 */
function calculateHealthStatus(metadata: any) {
  if (!metadata) {
    return { isHealthy: false, status: 'No crawler runs found' };
  }
  
  const lastRun = metadata.lastRunAt ? new Date(metadata.lastRunAt) : null;
  const now = new Date();
  
  // Consider healthy if last run was within 45 minutes (30 min schedule + 15 min buffer)
  const isRecent = lastRun ? (now.getTime() - lastRun.getTime()) < 45 * 60 * 1000 : false;
  
  return {
    isHealthy: (metadata.isHealthy || false) && isRecent,
    lastRunAt: metadata.lastRunAt,
    status: metadata.lastRunStatus || 'unknown'
  };
}

/**
 * Calculate health statistics from run history
 */
function calculateHealthStats(runHistory: any[]) {
  if (!runHistory || runHistory.length === 0) {
    return {
      totalRuns: 0,
      successfulRuns: 0,
      successRate: 0,
      averageArticlesPerRun: 0,
      totalArticlesCrawled: 0,
      averageRunTime: 0
    };
  }

  const totalRuns = runHistory.length;
  const successfulRuns = runHistory.filter(run => run.summary?.isSuccessful).length;
  const totalArticles = runHistory.reduce((sum, run) => sum + (run.summary?.totalArticles || 0), 0);
  
  // Calculate average run time (if available)
  const runsWithTime = runHistory.filter(run => run.summary?.totalTime);
  const averageRunTime = runsWithTime.length > 0 
    ? runsWithTime.reduce((sum, run) => sum + run.summary.totalTime, 0) / runsWithTime.length
    : 0;

  return {
    totalRuns,
    successfulRuns,
    successRate: Math.round((successfulRuns / totalRuns) * 100),
    averageArticlesPerRun: Math.round(totalArticles / totalRuns),
    totalArticlesCrawled: totalArticles,
    averageRunTime: Math.round(averageRunTime)
  };
}
