'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import { getLatestIncidents, processNewsIntoIncidents, getNewsArticles } from "@/app/actions";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import { Newspaper, BookHeart } from 'lucide-react';

export default function Home() {
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<NewsArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      try {
        // Step 1: Fetch news articles from our new AI flow.
        const [hNews, gNews] = await Promise.all([
          getNewsArticles({ category: 'humanitarian' }),
          getNewsArticles({ category: 'general' })
        ]);

        const humanitarianArticles = hNews.articles || [];
        setHumanitarianNews(humanitarianArticles);
        setGeneralNews(gNews.articles || []);
        
        // Step 2: Process the new humanitarian news to extract and store incidents.
        await processNewsIntoIncidents({ articles: humanitarianArticles });
        
        // Step 3: Fetch the latest list of incidents from the persistent store.
        const latestIncidents = await getLatestIncidents();
        
        if (latestIncidents) {
          setIncidents(latestIncidents);
        }

      } catch (error) {
        console.error("Error fetching or processing data:", error);
        // Set to empty on error to avoid crashing the UI
        setIncidents([]);
        setHumanitarianNews([]);
        setGeneralNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-4">
          <div className="lg:col-span-4">
            <IncidentMap incidents={incidents} />
          </div>
          <div className="lg:col-span-4">
             <AiSummary articles={humanitarianNews} />
          </div>
          <div className="lg:col-span-2">
            <WeatherAlerts />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<BookHeart className="h-5 w-5 text-primary" />} 
              title="Humanitarian News" 
              items={humanitarianNews}
              isLoading={loading}
            />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Newspaper className="h-5 w-5 text-primary" />} 
              title="General Ethiopia News" 
              items={generalNews}
              isLoading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
