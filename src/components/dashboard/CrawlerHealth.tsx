'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface HealthMetrics {
  totalRuns: number;
  successfulRuns: number;
  successRate: number;
  averageArticlesPerRun: number;
  totalArticlesCrawled: number;
  averageRunTime: number;
}

interface CrawlerHealthData {
  health: {
    isHealthy: boolean;
    status: string;
    lastRunAt?: string;
  };
  metrics: any;
  stats: HealthMetrics;
  runHistory: any[];
  lastUpdated: string;
}

const CrawlerHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<CrawlerHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        console.log('🔍 Fetching crawler health data from API...');
        // Add cache-busting and explicit headers
        const response = await fetch(`/api/crawler-health?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('🌐 Response status:', response.status);
        console.log('🌐 Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🌐 Response error text:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('🌐 Raw response text length:', responseText.length);
        
        let data: CrawlerHealthData;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('🌐 JSON parse error:', parseError);
          console.error('🌐 Response text:', responseText.substring(0, 500));
          throw new Error('Failed to parse JSON response');
        }
        console.log('✅ Received crawler health data:', data);
        console.log('📊 Health status:', data.health);
        console.log('📈 Stats:', data.stats);
        setHealthData(data);
      } catch (err) {
        console.error('❌ Failed to fetch crawler health:', err);
        setError('Failed to load crawler health data.');
      } finally {
        setLoading(false);
      }
    };
    fetchHealthData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Crawler Health Monitor</h2>
        </div>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading crawler health...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Crawler Health Monitor</h2>
        </div>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Debug logging for rendered data
  if (healthData) {
    console.log('🎨 Rendering with health data:', {
      isHealthy: healthData.health.isHealthy,
      status: healthData.health.status,
      lastRunAt: healthData.health.lastRunAt,
      successRate: healthData.stats.successRate,
      totalRuns: healthData.stats.totalRuns,
      totalArticles: healthData.stats.totalArticlesCrawled
    });
  }

  const getStatusBadge = (isHealthy: boolean) => {
    return isHealthy ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />
        Healthy
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <AlertCircle className="h-3 w-3 mr-1" />
        Unhealthy
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Crawler Health Monitor</h2>
        </div>
        {healthData && getStatusBadge(healthData.health.isHealthy)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Last Run Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last Run
          </div>
          <div className="text-sm">
            {formatDate(healthData?.health.lastRunAt)}
          </div>
          <div className="text-xs text-muted-foreground">
            Status: {healthData?.health.status || 'Unknown'}
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Success Rate
          </div>
          <div className="text-2xl font-bold">
            {healthData?.stats.successRate || 0}%
          </div>
          <div className="text-xs text-muted-foreground">
            {healthData?.stats.successfulRuns || 0} of {healthData?.stats.totalRuns || 0} runs
          </div>
        </div>

        {/* Articles Crawled */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            Articles Crawled
          </div>
          <div className="text-2xl font-bold">
            {healthData?.stats.totalArticlesCrawled || 0}
          </div>
          <div className="text-xs text-muted-foreground">
            Avg: {healthData?.stats.averageArticlesPerRun || 0} per run
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      {healthData?.stats.averageRunTime && healthData.stats.averageRunTime > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Average Run Time: <span className="font-medium">{healthData.stats.averageRunTime}ms</span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          Last updated: {formatDate(healthData?.lastUpdated)}
        </div>
      </div>
    </Card>
  );
};

export default CrawlerHealth;
