'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import { humanitarianNews, generalNews, incidents as initialIncidents } from "@/lib/mock-data";
import type { Incident } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Newspaper, ShieldAlert } from 'lucide-react';

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);

  useEffect(() => {
    // Simulate a new incident appearing after 5 seconds
    const timer = setTimeout(() => {
      const newIncident: Incident = {
        id: 5,
        title: 'New: Food Security Alert',
        description: 'A new report indicates potential food security issues in the southern regions due to delayed rains. Monitoring is in effect.',
        latitude: 7.0,
        longitude: 38.0,
        color: '#8b5cf6', // A distinct purple color
      };
      
      // Add the new incident to the list, ensuring no duplicates by ID
      setIncidents(prevIncidents => {
        if (prevIncidents.find(inc => inc.id === newIncident.id)) {
          return prevIncidents;
        }
        return [...prevIncidents, newIncident];
      });

    }, 5000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
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
