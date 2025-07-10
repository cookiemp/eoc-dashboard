'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import { getLatestIncidents, processNewsIntoIncidents } from "@/app/actions";
import { humanitarianNews, generalNews } from "@/lib/mock-data";
import type { Incident } from '@/lib/types';
import { Newspaper } from 'lucide-react';

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoadingIncidents(true);
      setIsProcessing(true);
      try {
        // Step 1: Process the latest news to extract and store incidents.
        // This action now encapsulates the AI extraction and storage logic.
        await processNewsIntoIncidents({ articles: humanitarianNews });
        
        // Step 2: Fetch the latest list of incidents from the persistent store.
        const latestIncidents = await getLatestIncidents();
        
        if (latestIncidents) {
          setIncidents(latestIncidents);
        }
      } catch (error) {
        console.error("Error processing or fetching incidents:", error);
        setIncidents([]); // Set to empty on error
      } finally {
        setLoadingIncidents(false);
        setIsProcessing(false);
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
          <div className="lg:col-span-2">
             <AiSummary articles={humanitarianNews} />
          </div>
          <div className="lg:col-span-2">
            <WeatherAlerts />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Newspaper className="h-5 w-5 text-primary" />} 
              title="Humanitarian News" 
              items={humanitarianNews} 
            />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed 
              icon={<Newspaper className="h-5 w-5 text-primary" />} 
              title="Ethiopia News" 
              items={generalNews} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
