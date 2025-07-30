'use server';

import { summarizeIncidentData } from '@/ai/flows/summarize-incident-data';
import { extractIncidentsFromNews } from '@/ai/flows/extract-incidents-from-news-flow';
import { generateIncidentDossier as generateIncidentDossierFlow } from '@/ai/flows/generate-incident-dossier-flow';
import type { GenerateIncidentDossierInput, GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import { addIncidents, getIncidents, IncidentWithId } from '@/services/incident-service';
import type { NewsArticle } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the summary cache file (fallback)
const summaryCacheFilePath = path.resolve(process.cwd(), 'src/lib/summary-cache.json');

// Define a type for our cache structure
type SummaryCache = {
  summary: any;
  date: string | null;
};

// Firebase integration with fallback
let useFirestore = false;
let firestore: any = null;

try {
  const { firestore: firestoreInstance } = require('@/lib/firebase-admin');
  firestore = firestoreInstance;
  useFirestore = true;
  console.log('Using Firestore for summary cache');
} catch (error) {
  console.log('Firestore not configured, falling back to file-based cache');
  useFirestore = false;
}

// Helper function to read the summary cache
async function readSummaryCache(): Promise<SummaryCache> {
  if (useFirestore) {
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
  if (useFirestore) {
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

export async function getSummary(input: { articles: NewsArticle[] }) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const cache = await readSummaryCache();

    // Prevent re-summarizing if we already have one for today
    if (cache.summary && cache.date === today) {
      return cache.summary;
    }

    // Don't generate a summary if there are no articles
    if (!input.articles || input.articles.length === 0) {
      return { summary: "No articles available to summarize." };
    }

    // Otherwise, generate a new summary.
    const result = await summarizeIncidentData(input);
    
    // Save the new summary to the cache file.
    await writeSummaryCache({ summary: result, date: today });
    
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
 */
export async function getLatestIncidents(): Promise<IncidentWithId[]> {
  try {
    return await getIncidents();
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
      next: { revalidate: 3600 }, // Cache for 1 hour
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
 * Fetches and merges humanitarian news from multiple high-quality sources.
 */
export async function getHumanitarianNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const [reliefWebResult, ifrcResult] = await Promise.all([
    fetch(`https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&profile=list&preset=latest&limit=5&filter[field]=primary_country.iso3&filter[value]=eth`).then(res => res.json()),
    getIfrcNews(),
  ]);

  const allArticles: NewsArticle[] = [];
  let combinedError: string | null = null;

  // Process ReliefWeb results
  if (reliefWebResult.data) {
    const reliefWebArticles: NewsArticle[] = (reliefWebResult.data || []).map((item: any) => ({
      id: item.id.toString(),
      title: item.fields.title || 'No Title Available',
      source: item.fields.source?.[0]?.name || 'Unknown Source',
      snippet: item.fields.body?.split('\n\n')[0] || 'No snippet available.',
      url: item.fields.url || item.href,
    }));
    allArticles.push(...reliefWebArticles);
  } else {
    combinedError = `ReliefWeb API Error: ${reliefWebResult.error?.message || 'Unknown error'}`;
  }

  // Process IFRC results
  if (ifrcResult.articles) {
    allArticles.push(...ifrcResult.articles);
  } else if (ifrcResult.error) {
    combinedError = combinedError ? `${combinedError}; ${ifrcResult.error}` : ifrcResult.error;
  }

  // Deduplicate articles based on title
  const uniqueArticles = allArticles.filter((article, index, self) =>
    index === self.findIndex((a) => a.title === article.title)
  );

  if (uniqueArticles.length > 0) {
    return { articles: uniqueArticles };
  } else {
    return { error: combinedError || "No humanitarian news could be fetched." };
  }
}


/**
 * Fetches general news about Ethiopia from NewsAPI.org (reliable sources only).
 */
export async function getGeneralNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const apiKey = process.env.NEWSAPI_API_KEY;
  if (!apiKey) {
    return { error: 'NewsAPI API key is not configured. Get one free at newsapi.org' };
  }

  // Query for Ethiopia news from reliable sources
  const url = `https://newsapi.org/v2/everything?q=Ethiopia&sources=bbc-news,reuters,associated-press,the-guardian-uk&language=en&pageSize=5&sortBy=publishedAt`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('NewsAPI General News Error:', errorData);
      const errorMessage = errorData?.message || `API responded with status ${response.status}`;
      return { error: `NewsAPI Error: ${errorMessage}` };
    }

    const data = await response.json();

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
