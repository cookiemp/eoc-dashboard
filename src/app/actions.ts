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

// Define the path to the summary cache file
const summaryCacheFilePath = path.resolve(process.cwd(), 'src/lib/summary-cache.json');

// Define a type for our cache structure
type SummaryCache = {
  summary: any;
  date: string | null;
};

// Helper function to read the summary cache
async function readSummaryCache(): Promise<SummaryCache> {
  try {
    const data = await fs.readFile(summaryCacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist or is invalid, return an empty cache structure
    console.error('Error reading summary cache:', error);
    return { summary: null, date: null };
  }
}

// Helper function to write to the summary cache
async function writeSummaryCache(data: SummaryCache): Promise<void> {
  try {
    await fs.writeFile(summaryCacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to summary cache:', error);
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
 * Fetches the latest humanitarian reports about Ethiopia from the ReliefWeb API.
 */
export async function getTheNewsApiArticles(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const url = `https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&query[value]=Ethiopia&preset=latest&profile=list&limit=5`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ReliefWeb API Error:', errorData);
      const errorMessage = errorData?.error?.message || `API responded with status ${response.status}`;
      return { error: `ReliefWeb API Error: ${errorMessage}` };
    }

    const data = await response.json();

    const articles: NewsArticle[] = (data.data || []).map((item: any) => ({
      id: item.id.toString(),
      title: item.fields.title || 'No Title Available',
      source: item.fields.source?.[0]?.name || 'Unknown Source',
      // ReliefWeb uses 'body' for the main content, which can be long. We'll use it as a snippet.
      snippet: item.fields.body?.split('\n\n')[0] || 'No snippet available.',
      url: item.fields.url || item.href,
    }));
    
    return { articles };

  } catch (error) {
    console.error('Failed to fetch from ReliefWeb API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to ReliefWeb API: ${errorMessage}` };
  }
}


/**
 * Fetches general news about Ethiopia from TheNewsAPI.
 */
export async function getGeneralNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const apiKey = process.env.THENEWSAPI_API_KEY;
  if (!apiKey) {
    return { error: 'TheNewsAPI API key is not configured.' };
  }

  // A broader query for general news.
  const query = 'Ethiopia';
  const url = `https://api.thenewsapi.com/v1/news/all?api_token=${apiKey}&search=${encodeURIComponent(query)}&language=en&limit=5`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('TheNewsAPI General News Error:', errorData);
      const errorMessage = errorData?.error?.message || `API responded with status ${response.status}`;
      return { error: `TheNewsAPI Error: ${errorMessage}` };
    }

    const data = await response.json();

    const articles: NewsArticle[] = (data.data || []).map((item: any) => ({
      id: item.uuid,
      title: item.title || 'No Title Available',
      source: item.source || 'Unknown Source',
      snippet: item.snippet || 'No snippet available.',
      url: item.url,
    }));

    return { articles };

  } catch (error) {
    console.error('Failed to fetch general news from TheNewsAPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to TheNewsAPI: ${errorMessage}` };
  }
}
