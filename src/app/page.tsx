'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import NewsFeed from "@/components/dashboard/news-feed";
import CrawlerHealth from "@/components/dashboard/CrawlerHealth";
import { getLatestIncidents, processNewsIntoIncidents, getAllNewsWithCategorization } from "@/app/actions";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import type { CategorizedArticle } from '@/ai/flows/categorize-news-articles-flow';
import { Newspaper, BookHeart, Brain } from 'lucide-react';


export default function Home() {
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<CategorizedArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<CategorizedArticle[]>([]);

  const [newsLoading, setNewsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsStats, setNewsStats] = useState<{ humanitarianCount: number, generalCount: number } | null>(null);

  const fetchAllData = async () => {
    setIsRefreshing(true);
    setNewsLoading(true);
    setNewsError(null);
    
    try {
      // Step 1: Fetch and categorize all news with AI
      setLoadingMessage('Fetching news from all sources...');
      const newsResult = await getAllNewsWithCategorization();

      if (newsResult.error) {
        throw new Error(newsResult.error);
      }

      // Set categorized news data
      const humanitarian = newsResult.humanitarian || [];
      const general = newsResult.general || [];
      
      setHumanitarianNews(humanitarian);
      setGeneralNews(general);
      setNewsStats(newsResult.summary || { humanitarianCount: 0, generalCount: 0 });

      // Step 2: Process humanitarian articles for incident extraction
      if (humanitarian.length > 0) {
        setLoadingMessage('Extracting incidents from humanitarian news with AI...');
        // Convert CategorizedArticle back to NewsArticle for incident processing
        const articlesForIncidents: NewsArticle[] = humanitarian.map(article => ({
          id: article.id,
          title: article.title,
          source: article.source,
          snippet: article.snippet,
          url: article.url
        }));
        await processNewsIntoIncidents({ articles: articlesForIncidents });
      }
      
      // Step 3: Fetch latest incidents from database
      setLoadingMessage('Fetching latest incidents from database...');
      const latestIncidents = await getLatestIncidents();
      if (latestIncidents) {
        setIncidents(latestIncidents);
      }

    } catch (error) {
      console.error("Error in unified news fetching and categorization:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setNewsError(errorMessage);
      // Clear data on error
      setIncidents([]);
      setHumanitarianNews([]);
      setGeneralNews([]);
      setNewsStats(null);
    } finally {
      setNewsLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
      setLoadingMessage('');
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchAllData();

    // Set up auto-refresh every 30 minutes (1800000 milliseconds)
    const intervalId = setInterval(fetchAllData, 1800000);

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onRefresh={() => {if (!isRefreshing) fetchAllData()}} lastUpdated={lastUpdated} isLoading={isRefreshing} />
      {isRefreshing && loadingMessage && (
        <div className="p-2 text-center text-sm bg-blue-500 text-white animate-pulse">
          {loadingMessage}
        </div>
      )}
      {newsStats && !isRefreshing && (
        <div className="p-2 text-center text-sm bg-green-100 text-green-800 border-b border-green-200">
          <Brain className="inline h-4 w-4 mr-1" />
          AI Analysis Complete: {newsStats.humanitarianCount + newsStats.generalCount} articles categorized
          ({newsStats.humanitarianCount} humanitarian, {newsStats.generalCount} general)
        </div>
      )}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-4">
          <div className="lg:col-span-4">
            <IncidentMap incidents={incidents} />
          </div>

          {/* Crawler Health Section */}
          <div className="lg:col-span-4">
            <CrawlerHealth />
          </div>
          
          {/* News Feeds - moved up */}
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<BookHeart className="h-5 w-5 text-primary" />} 
              title={`Humanitarian News${newsStats ? ` (${newsStats.humanitarianCount})` : ''}`}
              items={humanitarianNews}
              isLoading={newsLoading}
              error={newsError}
            />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Brain className="h-5 w-5 text-primary" />} 
              title={`AI-Categorized General News${newsStats ? ` (${newsStats.generalCount})` : ''}`}
              items={generalNews}
              isLoading={newsLoading}
              error={newsError}
            />
          </div>
          
          {/* AI Summary - moved down */}
          <div className="lg:col-span-4">
             <AiSummary articles={humanitarianNews} isLoadingNews={newsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
