'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import { getIncidents } from '@/ai/flows/get-incidents-flow';
import { humanitarianNews, generalNews } from "@/lib/mock-data";
import type { Incident } from '@/lib/types';
import { Newspaper } from 'lucide-react';

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoadingIncidents(true);
      try {
        const result = await getIncidents();
        if (result.incidents) {
          setIncidents(result.incidents);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
        // Optionally set some default incidents on error
        setIncidents([]);
      } finally {
        setLoadingIncidents(false);
      }
    };

    fetchIncidents();
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
