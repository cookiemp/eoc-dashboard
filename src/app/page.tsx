'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import NewsFeed from "@/components/dashboard/news-feed";
import { getLatestIncidents, processNewsIntoIncidents, getTheNewsApiArticles } from "@/app/actions";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import { Newspaper, BookHeart } from 'lucide-react';


export default function Home() {
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<NewsArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      setNewsError(null);
      
      try {
        const result = await getTheNewsApiArticles();

        if (result.error) {
          throw new Error(result.error);
        }

        const articles = result.articles || [];
        
        // This is now safe, as an empty array is a valid state
        setHumanitarianNews(articles);

        // Only process incidents if there are articles to process
        if (articles.length > 0) {
          await processNewsIntoIncidents({ articles });
        }
        
        // Fetch incidents separately after processing
        const latestIncidents = await getLatestIncidents();
        if (latestIncidents) {
          setIncidents(latestIncidents);
        }

      } catch (error) {
        console.error("Error fetching or processing news data:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching news.";
        setNewsError(errorMessage);
        setIncidents([]);
        setHumanitarianNews([]);
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
            <NewsFeed 
              icon={<BookHeart className="h-5 w-5 text-primary" />} 
              title="Humanitarian News" 
              items={humanitarianNews}
              isLoading={loading}
              error={newsError}
            />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Newspaper className="h-5 w-5 text-primary" />} 
              title="General Ethiopia News" 
              items={generalNews}
              isLoading={false} // Since we are not fetching general news yet
            />
          </div>
        </div>
      </main>
    </div>
  );
}
