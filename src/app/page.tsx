'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import { getLatestIncidents, processNewsIntoIncidents, getWeatherForCitiesAction } from "@/app/actions";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import { Newspaper, BookHeart } from 'lucide-react';
import type { WeatherAlert } from '@/lib/types';
import Parser from 'rss-parser';

export default function Home() {
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<NewsArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<NewsArticle[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetches news from an RSS feed using a CORS proxy.
    const fetchNews = async (category: 'humanitarian' | 'general'): Promise<{ articles: NewsArticle[], error?: string }> => {
        if (category !== 'humanitarian') {
            return { articles: [] };
        }

        // Using a public CORS proxy to fetch the RSS feed from the client-side.
        // This avoids server-side IP blocks.
        const feedUrl = 'https://reliefweb.int/rss.xml?country=76';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch from proxy. Status: ${response.status}`);
            }
            const xmlString = await response.text();
            if (!xmlString) {
                throw new Error("Received empty response from proxy.");
            }

            const parser = new Parser();
            const feed = await parser.parseString(xmlString);

            const articles: NewsArticle[] = feed.items.slice(0, 10).map((item) => ({
                id: item.guid || item.link || item.title!,
                title: item.title || 'No Title',
                source: 'ReliefWeb',
                snippet: item.contentSnippet || item.content || 'No Snippet',
                url: item.link || '',
            }));

            return { articles };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { articles: [], error: `Failed to fetch news feed: ${errorMessage}` };
        }
    };

    const fetchAndProcessData = async () => {
      setLoading(true);
      setNewsError(null);
      try {
        const [hNews, gNews] = await Promise.all([
          fetchNews('humanitarian'),
          fetchNews('general')
        ]);

        if (hNews.error) {
          setNewsError(hNews.error);
          setHumanitarianNews([]);
        } else {
          setHumanitarianNews(hNews.articles || []);
          await processNewsIntoIncidents({ articles: hNews.articles || [] });
        }
        
        setGeneralNews(gNews.articles || []);
        
        const latestIncidents = await getLatestIncidents();
        
        if (latestIncidents) {
          setIncidents(latestIncidents);
        }

      } catch (error) {
        console.error("Error fetching or processing news data:", error);
        setNewsError("An unexpected error occurred while fetching news.");
        setIncidents([]);
        setHumanitarianNews([]);
        setGeneralNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchWeatherData = async () => {
      setLoadingWeather(true);
      try {
        const citiesToFetch = ['Addis Ababa', 'Dire Dawa', 'Gondar', 'Mekelle', 'Hawassa'];
        const weatherResult = await getWeatherForCitiesAction({ cities: citiesToFetch });
        if (weatherResult.weather) {
          setWeatherData(weatherResult.weather);
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setWeatherData([]);
      } finally {
        setLoadingWeather(false);
      }
    };


    fetchAndProcessData();
    fetchWeatherData();
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
            <WeatherAlerts weatherData={weatherData} isLoading={loadingWeather} />
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
              isLoading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
