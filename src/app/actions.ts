'use server';

import { summarizeIncidentData, type SummarizeIncidentDataOutput } from '@/ai/flows/summarize-incident-data';
import { extractIncidentsFromNews } from '@/ai/flows/extract-incidents-from-news-flow';
import { getNewsArticles as getNewsArticlesFlow } from '@/ai/flows/get-news-articles-flow';
import type { GetNewsArticlesInput, GetNewsArticlesOutput } from '@/ai/flows/get-news-articles-flow';
import { generateIncidentDossier as generateIncidentDossierFlow } from '@/ai/flows/generate-incident-dossier-flow';
import type { GenerateIncidentDossierInput, GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import { getWeatherForCities } from '@/ai/flows/get-weather-flow';
import type { GetWeatherForCitiesOutput } from '@/ai/flows/get-weather-flow';
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

    const { incidents: extractedIncidents } = await extractIncidentsFromNews(input);

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
 * Fetches news articles using the Genkit flow.
 */
export async function getNewsArticles(input: GetNewsArticlesInput): Promise<GetNewsArticlesOutput> {
  try {
    return await getNewsArticlesFlow(input);
  } catch (error) {
    console.error(`Error fetching '${input.category}' news:`, error);
    return { articles: [] }; // Return empty array on error
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
 * An action that fetches the weather by providing the required API key.
 */
export async function getWeatherForCitiesAction(input: { cities: string[] }): Promise<GetWeatherForCitiesOutput> {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is not configured.');
    }
    return await getWeatherForCities({ ...input, apiKey });
  } catch (error) {
    console.error('Error in getWeatherForCities action:', error);
    return { weather: [] };
  }
}