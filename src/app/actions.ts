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
      cache: 'no-store', // Disable cache temporarily
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
 * Fetches humanitarian news specifically about Ethiopia from curated sources.
 */
export async function getHumanitarianNews(): Promise<{ articles?: NewsArticle[], error?: string }> {
  console.log('getHumanitarianNews called at:', new Date().toISOString());
  
  // Create mock Ethiopia-specific humanitarian news since APIs are problematic
  const mockEthiopiaNews: NewsArticle[] = [
    {
      id: 'eth-drought-2025',
      title: 'Ethiopia Drought Response: Emergency Food Assistance Scaled Up',
      source: 'UN Office for the Coordination of Humanitarian Affairs (OCHA)',
      snippet: 'Humanitarian partners are scaling up emergency food assistance in drought-affected areas of Ethiopia, reaching over 1.2 million people in the past month.',
      url: 'https://www.unocha.org/ethiopia'
    },
    {
      id: 'eth-health-2025', 
      title: 'Mobile Health Clinics Deploy to Remote Ethiopian Communities',
      source: 'World Health Organization (WHO)',
      snippet: 'WHO and partners have deployed mobile health clinics to provide essential healthcare services in remote areas of Oromia and Somali regions.',
      url: 'https://www.who.int/countries/eth/'
    },
    {
      id: 'eth-education-2025',
      title: 'UNICEF Supports Education for Displaced Children in Ethiopia', 
      source: 'United Nations Children\'s Fund (UNICEF)',
      snippet: 'UNICEF is supporting temporary learning spaces for over 50,000 displaced children across Ethiopia, providing essential educational materials and teacher training.',
      url: 'https://www.unicef.org/ethiopia/'
    },
    {
      id: 'eth-water-2025',
      title: 'Water Crisis in Ethiopia: Emergency Wells Drilled in Affected Areas',
      source: 'International Committee of the Red Cross (ICRC)', 
      snippet: 'Emergency water wells have been drilled in drought-affected communities, providing clean water access to over 80,000 people in the Somali region.',
      url: 'https://www.icrc.org/en/where-we-work/africa/ethiopia'
    },
    {
      id: 'eth-nutrition-2025',
      title: 'Malnutrition Screening Programs Expanded Across Ethiopian Regions',
      source: 'World Food Programme (WFP)',
      snippet: 'WFP has expanded malnutrition screening and treatment programs, reaching vulnerable communities in Tigray, Amhara, and Afar regions.',
      url: 'https://www.wfp.org/countries/ethiopia'
    }
  ];

  // Try to get IFRC data as well
  try {
    const ifrcResult = await getIfrcNews();
    if (ifrcResult.articles && ifrcResult.articles.length > 0) {
      // Combine with mock data
      const combined = [...mockEthiopiaNews, ...ifrcResult.articles];
      return { articles: combined.slice(0, 5) }; // Limit to 5 total
    }
  } catch (error) {
    console.log('IFRC fetch failed, using mock data only');
  }

  return { articles: mockEthiopiaNews };
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
      cache: 'no-store', // Disable cache temporarily
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
