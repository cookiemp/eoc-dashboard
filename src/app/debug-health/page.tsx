'use client';

import { useState, useEffect } from 'react';

export default function DebugHealthPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 Testing /api/crawler-health endpoint...');
        const response = await fetch('/api/crawler-health');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        setApiResponse(data);
      } catch (err) {
        console.error('❌ API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug: Crawler Health API Test</h1>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug: Crawler Health API Test</h1>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Crawler Health API Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">API Response Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Health Status:</strong> {apiResponse?.health?.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
          </div>
          <div>
            <strong>Last Run:</strong> {apiResponse?.health?.lastRunAt || 'Never'}
          </div>
          <div>
            <strong>Success Rate:</strong> {apiResponse?.stats?.successRate || 0}%
          </div>
          <div>
            <strong>Total Runs:</strong> {apiResponse?.stats?.totalRuns || 0}
          </div>
          <div>
            <strong>Articles Crawled:</strong> {apiResponse?.stats?.totalArticlesCrawled || 0}
          </div>
          <div>
            <strong>Data Source:</strong> {apiResponse?.debug?.source || 'unknown'}
          </div>
        </div>
      </div>

      <details className="mb-4">
        <summary className="cursor-pointer font-semibold">Raw API Response</summary>
        <pre className="bg-black text-green-400 p-4 rounded-lg mt-2 overflow-auto">
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      </details>
    </div>
  );
}
