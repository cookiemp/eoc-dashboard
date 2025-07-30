'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import NewsFeed from "@/components/dashboard/news-feed";
import { getLatestIncidents, processNewsIntoIncidents, getHumanitarianNews, getGeneralNews } from "@/app/actions";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import { Newspaper, BookHeart } from 'lucide-react';


export default function Home() {
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<NewsArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<NewsArticle[]>([]);

  const [humanitarianNewsLoading, setHumanitarianNewsLoading] = useState(true);
  const [generalNewsLoading, setGeneralNewsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [humanitarianNewsError, setHumanitarianNewsError] = useState<string | null>(null);
  const [generalNewsError, setGeneralNewsError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setIsRefreshing(true);

    // Fetch humanitarian data
    setLoadingMessage('Fetching humanitarian news...');
    setHumanitarianNewsLoading(true);
    setHumanitarianNewsError(null);
    
    try {
      const result = await getHumanitarianNews();

      if (result.error) {
        throw new Error(result.error);
      }

      const articles = result.articles || [];
      setHumanitarianNews(articles);

      if (articles.length > 0) {
        setLoadingMessage('Extracting incidents from news with AI...');
        await processNewsIntoIncidents({ articles });
      }
      
      setLoadingMessage('Fetching latest incidents from database...');
      const latestIncidents = await getLatestIncidents();
      if (latestIncidents) {
        setIncidents(latestIncidents);
      }

    } catch (error) {
      console.error("Error fetching or processing humanitarian news data:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setHumanitarianNewsError(errorMessage);
      // Also clear related data on error
      setIncidents([]); 
      setHumanitarianNews([]);
    } finally {
      setHumanitarianNewsLoading(false);
    }

    // Fetch general news data
    setLoadingMessage('Fetching general news...');
    setGeneralNewsLoading(true);
    setGeneralNewsError(null);
    try {
      const result = await getGeneralNews();
      if (result.error) {
        throw new Error(result.error);
      }
      setGeneralNews(result.articles || []);
    } catch (error) {
       console.error("Error fetching general news data:", error);
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
       setGeneralNewsError(errorMessage);
       setGeneralNews([]);
    } finally {
      setGeneralNewsLoading(false);
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
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-4">
          <div className="lg:col-span-4">
            <IncidentMap incidents={incidents} />
          </div>
          <div className="lg:col-span-4">
             <AiSummary articles={humanitarianNews} />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<BookHeart className="h-5 w-5 text-primary" />} 
              title="Humanitarian News" 
              items={humanitarianNews}
              isLoading={humanitarianNewsLoading}
              error={humanitarianNewsError}
            />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Newspaper className="h-5 w-5 text-primary" />} 
              title="General Ethiopia News" 
              items={generalNews}
              isLoading={generalNewsLoading}
              error={generalNewsError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
