'use server';

import { summarizeIncidentData, type SummarizeIncidentDataInput } from '@/ai/flows/summarize-incident-data';
import { revalidatePath } from 'next/cache';

export async function getSummary(input: SummarizeIncidentDataInput) {
  try {
    const result = await summarizeIncidentData(input);
    revalidatePath('/');
    return result;
  } catch (error) {
    console.error('Error in getSummary action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: `Failed to generate summary: ${errorMessage}` };
  }
}
