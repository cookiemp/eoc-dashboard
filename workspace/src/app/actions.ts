'use server';

import { summarizeIncidentData } from '@/ai/flows/summarize-incident-data';
import { extractIncidentsFromNews } from '@/ai/flows/extract-incidents-from-news-flow';
import { generateIncidentDossier as generateIncidentDossierFlow } from '@/ai/flows/generate-incident-dossier-flow';
import type { GenerateIncidentDossierInput, GenerateIncidentDossierOutput } from '@/ai/flows/generate-incident-dossier-flow';
import { addIncidents, getIncidents, IncidentWithId } from '@/services/incident-service';
import type { NewsArticle, WeatherAlert } from '@/lib/types';
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


// --- Weather Fetching Logic ---
const cityCoordinates: { [city: string]: { lat: number; lon: number } } = {
  'Addis Ababa': { lat: 9.02497, lon: 38.74689 },
  'Dire Dawa': { lat: 9.5931, lon: 41.8661 },
  'Gondar': { lat: 12.6, lon: 37.4667 },
  'Mekelle': { lat: 13.4969, lon: 39.4769 },
  'Hawassa': { lat: 7.0625, lon: 38.4765 },
};

async function fetchWeatherForCity(city: string, apiKey: string): Promise<WeatherAlert | null> {
  const coords = cityCoordinates[city];
  if (!coords) {
    console.error(`Coordinates for city not found: ${city}`);
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch weather for ${city}. Status: ${response.status}`, errorText);
      return null;
    }
    const data = await response.json();
    return {
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0]?.description?.toLowerCase() || 'N/A',
    };
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
    return null;
  }
}

export async function getWeatherForCitiesAction(input: { cities: string[] }): Promise<{ weather: WeatherAlert[] }> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.error('OpenWeatherMap API key is not configured.');
    return { weather: [] };
  }
  
  try {
    const weatherResults = await Promise.all(
      input.cities.map((city) => fetchWeatherForCity(city, apiKey))
    );
    const validWeatherData = weatherResults.filter((data): data is WeatherAlert => data !== null);
    return { weather: validWeatherData };
  } catch (error) {
    console.error('Error in getWeatherForCities action:', error);
    return { weather: [] };
  }
}


/**
 * Fetches news from TheNewsAPI.
 * This is a reliable, server-side fetch.
 */
export async function getTheNewsApiArticles(): Promise<{ articles?: NewsArticle[], error?: string }> {
  const apiKey = process.env.THENEWSAPI_API_KEY;
  if (!apiKey) {
    return { error: 'TheNewsAPI API key is not configured. Please set THENEWSAPI_API_KEY in the .env file.' };
  }

  const query = '"humanitarian aid" OR "crisis response" Ethiopia';
  const url = `https://api.thenewsapi.com/v1/news/all?api_token=${apiKey}&search=${encodeURIComponent(query)}&language=en&limit=5`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('TheNewsAPI Error:', errorData);
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
    console.error('Failed to fetch from TheNewsAPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to connect to TheNewsAPI: ${errorMessage}` };
  }
}
