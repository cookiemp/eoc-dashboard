'use server';

import { summarizeIncidentData } from '@/ai/flows/summarize-incident-data';
import { extractIncidentsFromNews } from '@/ai/flows/extract-incidents-from-news-flow';
import { generateIncidentDossier as generateIncidentDossierFlow } from '@/ai/flows/generate-incident-dossier-flow';
import { categorizeNewsArticles } from '@/ai/flows/categorize-news-articles-flow';
import type { GenerateIncidentDossierInput, GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import type { CategorizedArticle } from '@/ai/flows/categorize-news-articles-flow';
import { addIncidents, getIncidents, IncidentWithId } from '@/services/incident-service';
import { getFieldIncidents, type FieldIncident } from '@/services/field-incidents-service';
import type { NewsArticle } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { getCachedDashboardData, setCachedDashboardData } from '@/services/dashboard-cache-service';

// Define the path to the summary cache file (fallback)
const summaryCacheFilePath = path.resolve(process.cwd(), 'src/lib/summary-cache.json');

// Define a type for our cache structure
type SummaryCache = {
  summary: any;
  date: string | null;
};

// Import Firebase utilities
import { getFirestore } from '@/lib/firebase-admin';

console.log('Using Firestore for summary cache');

// Helper function to read the summary cache
async function readSummaryCache(): Promise<SummaryCache> {
  const firestore = await getFirestore();
  if (firestore) {
    try {
      const doc = await firestore.collection('cache').doc('daily-summary').get();
      if (doc.exists) {
        return doc.data() as SummaryCache;
      } else {
        return { summary: null, date: null };
      }
    } catch (error) {
      console.error('Error reading from Firestore, falling back to file cache', error);
      return await readSummaryCacheFromFile(); // Fallback on error
    }
  } else {
    return await readSummaryCacheFromFile();
  }
}

// Helper function to write to the summary cache
async function writeSummaryCache(data: SummaryCache): Promise<void> {
  const firestore = await getFirestore();
  if (firestore) {
    try {
      await firestore.collection('cache').doc('daily-summary').set(data);
    } catch (error) {
      console.error('Error writing to Firestore, falling back to file cache', error);
      await writeSummaryCacheToFile(data); // Fallback on error
    }
  } else {
    await writeSummaryCacheToFile(data);
  }
}

// File-based cache functions for fallback
async function readSummaryCacheFromFile(): Promise<SummaryCache> {
  try {
    const data = await fs.readFile(summaryCacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading summary cache from file:', error);
    return { summary: null, date: null };
  }
}

async function writeSummaryCacheToFile(data: SummaryCache): Promise<void> {
  try {
    await fs.writeFile(summaryCacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to summary cache file:', error);
  }
}

/**
 * Clears the summary cache to force regeneration.
 */
export async function clearSummaryCache(): Promise<void> {
  try {
    await writeSummaryCache({ summary: null, date: null });
    console.log('Summary cache cleared');
  } catch (error) {
    console.error('Error clearing summary cache:', error);
  }
}

export async function getSummary(input: { articles: NewsArticle[]; fieldIncidents?: FieldIncident[] }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
  
  try {
    // Don't generate a summary if there are no articles and no field incidents
    if ((!input.articles || input.articles.length === 0) && (!input.fieldIncidents || input.fieldIncidents.length === 0)) {
      return { summary: "No articles or incidents available to summarize." };
    }

    // Check if we have a valid cached summary
    const cache = await readSummaryCache();
    if (cache.summary && cache.date) {
      const cacheDate = new Date(cache.date);
      // Use cached summary if it's less than 30 minutes old
      if (cacheDate > thirtyMinutesAgo) {
        console.log('Using cached summary from:', cache.date);
        // Add debugging to check for truncated summaries
        if (typeof cache.summary.summary === 'string' && cache.summary.summary.length < 100) {
          console.warn('Cached summary appears truncated, regenerating...', cache.summary.summary);
        } else {
          return cache.summary;
        }
      }
    }

    console.log('Generating fresh summary...');
    
    // Generate a new summary
    const result = await summarizeIncidentData(input);
    
    // Ensure proper formatting with line breaks between bullet points
    if (result.summary) {
      // Clean up the summary formatting
      result.summary = result.summary
        .replace(/\*\s*/g, '\n* ') // Ensure newlines before asterisks
        .replace(/⚕️\*/g, '\n⚕️*') // Ensure newlines before health alerts
        .replace(/^\n/, '') // Remove leading newline
        .trim();
    }
    
    // Save the new summary to the cache with current timestamp
    await writeSummaryCache({ 
      summary: result, 
      date: now.toISOString() // Store full timestamp for 30-minute check
    });
    
    revalidatePath('/'); // Revalidate the path to show the new summary
    return result;

  } catch (error) {
    console.error('Error in getSummary action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to generate summary: ${errorMessage}` };
  }
}

/**
 * Orchestrates the process of extracting incidents from news articles and storing them.
 */
export async function processNewsIntoIncidents(input: { articles: NewsArticle[] }): Promise<void> {
  try {
    // Only proceed if there are articles to process
    if (!input.articles || input.articles.length === 0) {
      return;
    }

    const { incidents: extractedIncidents } = await extractIncidentsFromNews({
      articles: input.articles.map(article => ({
        ...article,
        // Ensure snippet is not too long for the prompt
        snippet: article.snippet.slice(0, 500),
      }))
    });

    if (extractedIncidents && extractedIncidents.length > 0) {
      // The service will handle caching, capping, and removing old incidents.
      await addIncidents(extractedIncidents);
      revalidatePath('/'); // Revalidate to update the map
    }
  } catch (error) {
    console.error('Error processing news into incidents:', error);
    // Decide if we should throw or just log. For now, logging is safer.
  }
}

/**
 * Fetches the latest list of incidents from our persistent service.
 * Merges news-based incidents with field report incidents.
 */
export async function getLatestIncidents(): Promise<IncidentWithId[]> {
  try {
    // Fetch both news incidents and field incidents
    const [newsIncidents, fieldIncidents] = await Promise.all([
      getIncidents(),
      getFieldIncidents()
    ]);

    // Filter field incidents to only include approved ones (not needing review)
    const approvedFieldIncidents = fieldIncidents
      .filter(incident => !incident.needsReview)
      .map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description || '',
        latitude: incident.latitude,
        longitude: incident.longitude,
        color: incident.color,
        addedAt: incident.reportedAt, // Map reportedAt to addedAt for type compatibility
        sourceType: 'field_report' as const,
      }));

    // Merge both arrays - field incidents first so they appear prominently
    const allIncidents = [...approvedFieldIncidents, ...newsIncidents];
    
    console.log(`📊 Serving ${allIncidents.length} total incidents (${approvedFieldIncidents.length} field + ${newsIncidents.length} news)`);
    
    return allIncidents;
  } catch (error) {
    console.error('Error fetching latest incidents:', error);
    return [];
  }
}

/**
 * Generates a detailed incident dossier using the Genkit flow.
 */
export async function generateIncidentDossier(input: GenerateIncidentDossierInput): Promise<GenerateIncidentDossierOutput> {
  try {
    return await generateIncidentDossierFlow(input);
  } catch (error) {
    console.error('Error generating incident dossier:', error);
    // Return a structured error object so the frontend can handle it gracefully.
    return { 
      error: `Failed to generate dossier: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
      executiveSummary: '',
    };
  }
}

/**
 * Fetches news from the International Federation of Red Cross (IFRC) API for Ethiopia.
 */
async function getIfrcNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const url = 'https://go-api.ifrc.org/api/v2/appeal/?country__in=ET';
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // 30 minutes cache
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: `IFRC API Error: ${errorData.detail || response.status}` };
    }

    const data = await response.json();

    const articles: NewsArticle[] = (data.results || []).map((item: any) => ({
      id: item.id.toString(),
      title: item.name || 'No Title Available',
      source: 'International Federation of Red Cross (IFRC)',
      snippet: item.summary || 'No summary available.',
      url: `https://go.ifrc.org/appeals/${item.id}`,
    }));

    return { articles };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to IFRC API: ${errorMessage}` };
  }
}

/**
 * Fetches humanitarian news from ReliefWeb API for Ethiopia.
 */
async function getReliefWebNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const url = 'https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&profile=list&preset=latest&limit=15&filter[field]=primary_country.iso3&filter[value]=eth';
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // 30 minutes cache
    });

    if (!response.ok) {
      return { error: `ReliefWeb API Error: ${response.status}` };
    }

    const data = await response.json();

    // Filter and map articles, ensuring they're Ethiopia-focused
    const articles: NewsArticle[] = (data.data || [])
      .filter((item: any) => {
        const title = item.fields?.title || '';
        // Only include articles that explicitly mention Ethiopia in the title
        // or are clearly about Ethiopia (not just refugees FROM other places TO Ethiopia)
        return (
          title.toLowerCase().includes('ethiopia') &&
          !title.toLowerCase().includes('sudan situation') &&
          !title.toLowerCase().includes('south sudan situation')
        );
      })
      .map((item: any) => ({
        id: item.id.toString(),
        title: item.fields?.title || 'No Title Available',
        source: item.fields?.source?.[0]?.name || 'ReliefWeb',
        snippet: item.fields?.body?.summary || item.fields?.body || item.fields?.summary || 'Ethiopian humanitarian situation update.',
        url: item.fields?.url || `https://reliefweb.int/node/${item.id}`,
      }));

    return { articles: articles.slice(0, 10) }; // Limit to 10 after filtering

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to ReliefWeb API: ${errorMessage}` };
  }
}

/**
 * Fetches humanitarian news specifically about Ethiopia from curated sources.
 */
export async function getHumanitarianNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  console.log('getHumanitarianNews called at:', new Date().toISOString());
  
  // Use Promise.allSettled to fetch from multiple sources for resilience
  const apiResults = await Promise.allSettled([
    getReliefWebNews(),
    getIfrcNews()
  ]);

  const allArticles: NewsArticle[] = [];
  const errors: string[] = [];

  // Process results from Promise.allSettled
  for (const result of apiResults) {
    if (result.status === 'fulfilled') {
      const { articles, error } = result.value;
      if (articles && articles.length > 0) {
        allArticles.push(...articles);
      } else if (error) {
        errors.push(error);
      }
    } else {
      errors.push(`API call failed: ${result.reason}`);
    }
  }

  // Deduplicate articles by title (simple match)
  const uniqueArticles = allArticles.filter((article, index, self) => 
    index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
  );

  // If we have articles, return them (limit to 10)
  if (uniqueArticles.length > 0) {
    return { articles: uniqueArticles.slice(0, 10) };
  }

  // If all API calls failed, return an error message
  if (errors.length > 0) {
    return { error: `All humanitarian news sources failed: ${errors.join('; ')}` };
  }

  // Fallback case
  return { error: 'No humanitarian news articles could be retrieved at this time.' };
}


/**
 * Fast dashboard data fetch with smart caching.
 * Returns cached data if available and fresh, otherwise fetches and caches new data.
 */
export async function getCachedDashboardDataFast(): Promise<{ humanitarian?: CategorizedArticle[], general?: CategorizedArticle[], incidents?: IncidentWithId[], summary?: { humanitarianCount: number, generalCount: number }, isFromCache: boolean, error?: string }> {
  console.log('getCachedDashboardDataFast called at:', new Date().toISOString());
  
  try {
    // First, check for cached data
    const cachedData = await getCachedDashboardData();
    
    if (cachedData) {
      console.log('🚀 Returning cached dashboard data - instant load!');
      return {
        humanitarian: cachedData.humanitarian,
        general: cachedData.general,
        incidents: cachedData.incidents,
        summary: cachedData.summary,
        isFromCache: true
      };
    }
    
    console.log('📥 No valid cache found, fetching fresh data...');
    
    // Fetch fresh data using the existing comprehensive function
    const [newsResult, incidentsResult] = await Promise.allSettled([
      getAllNewsWithCategorization(),
      getLatestIncidents()
    ]);
    
    let humanitarian: CategorizedArticle[] = [];
    let general: CategorizedArticle[] = [];
    let summary = { humanitarianCount: 0, generalCount: 0 };
    let incidents: IncidentWithId[] = [];
    
    // Process news results
    if (newsResult.status === 'fulfilled' && !newsResult.value.error) {
      humanitarian = newsResult.value.humanitarian || [];
      general = newsResult.value.general || [];
      summary = newsResult.value.summary || summary;
    }
    
    // Process incidents results
    if (incidentsResult.status === 'fulfilled') {
      incidents = incidentsResult.value || [];
    }
    
    // Cache the fresh data for future requests
    if (humanitarian.length > 0 || general.length > 0) {
      await setCachedDashboardData(humanitarian, general, incidents);
      console.log('💾 Fresh data cached for future requests');
    }
    
    return {
      humanitarian,
      general,
      incidents,
      summary,
      isFromCache: false,
      error: newsResult.status === 'fulfilled' ? newsResult.value.error : 'Failed to fetch news data'
    };
    
  } catch (error) {
    console.error('Error in getCachedDashboardDataFast:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { 
      error: `Failed to fetch dashboard data: ${errorMessage}`,
      isFromCache: false,
      summary: { humanitarianCount: 0, generalCount: 0 }
    };
  }
}

/**
 * Fetches all news from multiple sources and uses AI to categorize them.
 * Returns both humanitarian and general news articles with AI classification.
 */
export async function getAllNewsWithCategorization(): Promise<{ humanitarian?: CategorizedArticle[], general?: CategorizedArticle[], summary?: { humanitarianCount: number, generalCount: number }, error?: string }> {
  console.log('getAllNewsWithCategorization called at:', new Date().toISOString());
  
  try {
    // Fetch from all sources concurrently
    const [humanitarianResult, crawlerResult, newsApiResult] = await Promise.allSettled([
      getHumanitarianNews(),
      (async () => {
        try {
          // Use Firebase news service instead of direct crawler
          const { getCrawledNews } = await import('@/services/firebase-news-service');
          const result = await getCrawledNews(15); // Get up to 15 crawled articles
          return { articles: result.articles };
        } catch (error) {
          console.warn('Firebase crawler service unavailable:', error);
          return { articles: [], error: 'Crawled news service unavailable' };
        }
      })(),
      getNewsAPIFallback()
    ]);

    // Collect all articles from all sources
    const allArticles: NewsArticle[] = [];
    const errors: string[] = [];

    // Process humanitarian news (already known to be humanitarian)
    const humanitarianArticles: NewsArticle[] = [];
    if (humanitarianResult.status === 'fulfilled' && humanitarianResult.value.articles) {
      humanitarianArticles.push(...humanitarianResult.value.articles);
    } else if (humanitarianResult.status === 'fulfilled' && humanitarianResult.value.error) {
      errors.push(`Humanitarian sources: ${humanitarianResult.value.error}`);
    }

    // Process crawler results (need AI categorization)
    if (crawlerResult.status === 'fulfilled' && crawlerResult.value.articles) {
      allArticles.push(...crawlerResult.value.articles);
    } else if (crawlerResult.status === 'fulfilled' && crawlerResult.value.error) {
      errors.push(`Crawler sources: ${crawlerResult.value.error}`);
    }

    // Process NewsAPI results (need AI categorization)
    if (newsApiResult.status === 'fulfilled' && newsApiResult.value.articles) {
      allArticles.push(...newsApiResult.value.articles);
    } else if (newsApiResult.status === 'fulfilled' && newsApiResult.value.error) {
      errors.push(`NewsAPI: ${newsApiResult.value.error}`);
    }

    // Deduplicate articles by title
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
    );

    console.log(`Processing ${uniqueArticles.length} articles for AI categorization...`);

    let categorizedArticles: CategorizedArticle[] = [];
    
    // Only run AI categorization if we have articles to process
    if (uniqueArticles.length > 0) {
      try {
        const categorizationResult = await categorizeNewsArticles({ articles: uniqueArticles });
        categorizedArticles = categorizationResult.categorizedArticles || [];
        console.log(`AI categorization completed: ${categorizedArticles.length} articles processed`);
      } catch (categorizationError) {
        console.error('AI categorization failed:', categorizationError);
        // Fallback: treat all articles as general news
        categorizedArticles = uniqueArticles.map(article => ({
          ...article,
          category: 'general' as const,
          confidence: 0.5,
          reasoning: 'AI categorization failed, defaulted to general'
        }));
      }
    }

    // Separate AI-categorized articles and add pre-classified humanitarian articles
    const aiHumanitarian = categorizedArticles.filter(article => article.category === 'humanitarian');
    const aiGeneral = categorizedArticles.filter(article => article.category === 'general');
    
    // Convert pre-classified humanitarian articles to CategorizedArticle format
    const preClassifiedHumanitarian: CategorizedArticle[] = humanitarianArticles.map(article => ({
      ...article,
      category: 'humanitarian' as const,
      confidence: 1.0,
      reasoning: 'From dedicated humanitarian news sources (ReliefWeb, IFRC)'
    }));

    // Combine and deduplicate final results
    const allHumanitarian = [...preClassifiedHumanitarian, ...aiHumanitarian]
      .filter((article, index, self) => 
        index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
      )
      .slice(0, 15); // Limit humanitarian articles

    const finalGeneral = aiGeneral.slice(0, 10); // Limit general articles

    const summary = {
      humanitarianCount: allHumanitarian.length,
      generalCount: finalGeneral.length
    };

    console.log(`✅ News categorization complete: ${summary.humanitarianCount} humanitarian, ${summary.generalCount} general`);

    // Return error only if we have no articles at all
    if (allHumanitarian.length === 0 && finalGeneral.length === 0) {
      return { 
        error: errors.length > 0 ? `All news sources failed: ${errors.join('; ')}` : 'No articles could be retrieved from any source'
      };
    }

    return {
      humanitarian: allHumanitarian,
      general: finalGeneral,
      summary
    };

  } catch (error) {
    console.error('Error in getAllNewsWithCategorization:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch and categorize news: ${errorMessage}` };
  }
}

/**
 * Legacy function - now calls the unified categorization system and returns only general news.
 * Maintained for backward compatibility.
 */
export async function getGeneralNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  console.log('getGeneralNews (legacy) called at:', new Date().toISOString());
  
  try {
    const result = await getAllNewsWithCategorization();
    
    if (result.error) {
      return { error: result.error };
    }
    
    // Convert CategorizedArticle back to NewsArticle for backward compatibility
    const articles: NewsArticle[] = (result.general || []).map(article => ({
      id: article.id,
      title: article.title,
      source: article.source,
      snippet: article.snippet,
      url: article.url
    }));
    
    return { articles };
    
  } catch (error) {
    console.error('Error in getGeneralNews (legacy):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch general news: ${errorMessage}` };
  }
}

/**
 * Fallback function using NewsAPI.org (reliable sources only).
 */
async function getNewsAPIFallback(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const apiKey = process.env.NEWSAPI_API_KEY;
  
  // Debug logging
  console.log('🔍 NewsAPI Debug Info:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- API Key exists:', !!apiKey);
  console.log('- API Key length:', apiKey?.length || 0);
  console.log('- API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT_SET');
  
  if (!apiKey) {
    console.error('❌ NewsAPI API key is missing!');
    return { error: 'NewsAPI API key is not configured. Get one free at newsapi.org' };
  }

  // Query for Ethiopia news from reliable sources
  const url = `https://newsapi.org/v2/everything?q=Ethiopia&sources=bbc-news,reuters,associated-press,the-guardian-uk&language=en&pageSize=5&sortBy=publishedAt`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
      next: { revalidate: 1800 }, // 30 minutes cache
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NewsAPI General News Error:', errorData);
      const errorMessage = errorData?.message || `API responded with status ${response.status}`;
      return { error: `NewsAPI Error: ${errorMessage}` };
    }

    const data = await response.json();

    // Check if the response has the expected structure
    if (!data || !data.articles) {
      console.error('NewsAPI returned unexpected response structure:', data);
      return { error: `NewsAPI Error: ${data?.message || 'Invalid response structure'}` };
    }

    const articles: NewsArticle[] = (data.articles || []).map((item: any) => ({
      id: item.url, // Use URL as unique ID
      title: item.title || 'No Title Available',
      source: item.source?.name || 'Unknown Source',
      snippet: item.description || 'No description available.',
      url: item.url,
    }));

    return { articles };

  } catch (error) {
    console.error('Failed to fetch general news from NewsAPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to NewsAPI: ${errorMessage}` };
  }
}
