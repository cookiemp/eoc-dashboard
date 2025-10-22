'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Header from "@/components/dashboard/header";
import IncidentMap, { type IncidentMapHandle } from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import NewsFeed from "@/components/dashboard/news-feed";
import { DateRangeFilterCompact, type DateFilterPreset } from "@/components/dashboard/date-range-filter-compact";
import { getLatestIncidents, processNewsIntoIncidents, getAllNewsWithCategorization, getCachedDashboardDataFast } from "@/app/actions";
import { getFieldIncidents, type FieldIncident } from '@/services/field-incidents-service';
import { clearDashboardCache, setCachedDashboardData } from "@/services/dashboard-cache-service";
import type { IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import type { CategorizedArticle } from '@/ai/flows/categorize-news-articles-flow';
import { BookHeart, Brain } from 'lucide-react';


export default function Home() {
  const mapRef = useRef<IncidentMapHandle>(null);
  const [incidents, setIncidents] = useState<IncidentWithId[]>([]);
  const [humanitarianNews, setHumanitarianNews] = useState<CategorizedArticle[]>([]);
  const [generalNews, setGeneralNews] = useState<CategorizedArticle[]>([]);
  const [fieldIncidents, setFieldIncidents] = useState<FieldIncident[]>([]);
  
  // Date filter state
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);

  const [newsLoading, setNewsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsStats, setNewsStats] = useState<{ humanitarianCount: number, generalCount: number } | null>(null);

  // Filter field incidents by date range (news incidents not shown on map)
  const filteredFieldIncidents = useMemo(() => {
    if (!dateFilterStart || !dateFilterEnd) {
      return fieldIncidents;
    }
    
    return fieldIncidents.filter(incident => {
      const incidentDate = new Date(incident.reportedAt);
      return incidentDate >= dateFilterStart && incidentDate <= dateFilterEnd;
    });
  }, [fieldIncidents, dateFilterStart, dateFilterEnd]);

  // Convert field incidents to IncidentWithId format for the map
  const mapIncidents = useMemo(() => {
    return filteredFieldIncidents.map(incident => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      color: incident.color,
      addedAt: incident.reportedAt, // Use reportedAt as addedAt for compatibility
    }));
  }, [filteredFieldIncidents]);

  // Handle date range change
  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null, preset?: DateFilterPreset) => {
    setDateFilterStart(startDate);
    setDateFilterEnd(endDate);
  };

  const fetchAllData = async () => {
    setIsRefreshing(true);
    setNewsLoading(true);
    setNewsError(null);
    
    try {
      // Clear cache first to ensure fresh data is used on next reload
      setLoadingMessage('Clearing cache and fetching fresh data...');
      await clearDashboardCache();
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
      
      // Step 3: Fetch latest incidents and field incidents from database
      setLoadingMessage('Fetching latest incidents from database...');
      const [latestIncidents, latestFieldIncidents] = await Promise.all([
        getLatestIncidents(),
        getFieldIncidents()
      ]);
      if (latestIncidents) {
        setIncidents(latestIncidents);
      }
      // Filter for approved field incidents only (not needing review)
      const approvedFieldIncidents = latestFieldIncidents.filter(inc => !inc.needsReview);
      setFieldIncidents(approvedFieldIncidents);

      // Step 4: Cache the fresh data for future tab reloads
      setLoadingMessage('Caching fresh data...');
      if (humanitarian.length > 0 || general.length > 0) {
        await setCachedDashboardData(humanitarian, general, latestIncidents || []);
        console.log('💾 Fresh data from manual refresh cached for future requests');
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

  // Fast initial load with caching
  const fetchCachedDataFast = async () => {
    setIsRefreshing(true); // ← FIX: Enable loading banner
    setNewsLoading(true);
    setNewsError(null);
    setLoadingMessage('Loading dashboard...');
    
    try {
      const result = await getCachedDashboardDataFast();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // If data is from cache, show different message
      if (result.isFromCache) {
        setLoadingMessage('Loaded from cache - displaying data...');
      } else {
        // Show progress for fresh data
        setLoadingMessage('Fetching fresh data with AI processing...');
        // Brief delay to show the message for fresh data processing
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Set all data from cache or fresh fetch
      setHumanitarianNews(result.humanitarian || []);
      setGeneralNews(result.general || []);
      setIncidents(result.incidents || []);
      setNewsStats(result.summary || { humanitarianCount: 0, generalCount: 0 });
      
      // Also fetch field incidents for summary
      const latestFieldIncidents = await getFieldIncidents();
      const approvedFieldIncidents = latestFieldIncidents.filter(inc => !inc.needsReview);
      setFieldIncidents(approvedFieldIncidents);
      // Cache state is handled internally
      
      console.log(result.isFromCache ? '🚀 Dashboard loaded from cache - instant!' : '📥 Dashboard loaded with fresh data');
      
    } catch (error) {
      console.error('Error in fast cached data fetch:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setNewsError(errorMessage);
    } finally {
      setNewsLoading(false);
      setIsRefreshing(false); // ← FIX: Reset refreshing state
      setLastUpdated(new Date());
      setLoadingMessage('');
    }
  };

  useEffect(() => {
    // Use fast cached loading for initial load
    fetchCachedDataFast();

    // Set up auto-refresh every 30 minutes (1800000 milliseconds)
    // This will use the full fetch function to ensure fresh data
    const intervalId = setInterval(fetchAllData, 1800000);

    // Refetch data when window regains focus (e.g., after approving incidents in admin panel)
    const handleFocus = () => {
      fetchCachedDataFast();
    };
    
    window.addEventListener('focus', handleFocus);

    // Cleanup function to clear interval and event listener when component unmounts
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onRefresh={() => {if (!isRefreshing) fetchAllData()}} lastUpdated={lastUpdated} isLoading={isRefreshing} />
      {isRefreshing && loadingMessage && (
        <div className={`p-2 text-center text-sm text-white animate-pulse ${
          loadingMessage.includes('cache') ? 'bg-green-500' : 'bg-blue-500'
        }`}>
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
          {/* Map with integrated date filter in header */}
          <div className="lg:col-span-4">
            <IncidentMap 
              ref={mapRef} 
              incidents={mapIncidents}
              headerActions={
                <DateRangeFilterCompact onDateRangeChange={handleDateRangeChange} />
              }
            />
          </div>
          
          {/* News Feeds */}
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
             <AiSummary 
               articles={humanitarianNews} 
               fieldIncidents={filteredFieldIncidents} 
               isLoadingNews={newsLoading}
               onIncidentFocus={(id) => mapRef.current?.focusIncident(id)}
             />
          </div>
        </div>
      </main>
    </div>
  );
}
