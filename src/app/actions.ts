'use server';

import { summarizeIncidentData, type SummarizeIncidentDataInput } from '@/ai/flows/summarize-incident-data';
import { getHealthAlerts } from '@/ai/flows/get-health-alerts-flow';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the cache file
const cacheFilePath = path.resolve(process.cwd(), 'src/lib/summary-cache.json');

// Define a type for our cache structure
type SummaryCache = {
  summary: any;
  date: string | null;
};

// Helper function to read the cache
async function readCache(): Promise<SummaryCache> {
  try {
    const data = await fs.readFile(cacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist or is invalid, return an empty cache structure
    console.error('Error reading summary cache:', error);
    return { summary: null, date: null };
  }
}

// Helper function to write to the cache
async function writeCache(data: SummaryCache): Promise<void> {
  try {
    await fs.writeFile(cacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to summary cache:', error);
  }
}

export async function getSummary(input: SummarizeIncidentDataInput) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const cache = await readCache();

    // If a valid summary for today exists, return it immediately.
    if (cache.summary && cache.date === today) {
      return cache.summary;
    }

    // Otherwise, generate a new summary.
    const result = await summarizeIncidentData(input);
    
    // Save the new summary to the cache file.
    await writeCache({ summary: result, date: today });
    
    revalidatePath('/'); // Revalidate the path to show the new summary
    return result;

  } catch (error) {
    console.error('Error in getSummary action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to generate summary: ${errorMessage}` };
  }
}

export async function fetchHealthAlerts() {
  try {
    const alerts = await getHealthAlerts();
    return alerts;
  } catch (error) {
    console.error('Error fetching health alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to fetch health alerts: ${errorMessage}` };
  }
}
