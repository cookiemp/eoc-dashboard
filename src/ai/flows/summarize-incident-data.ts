// Summarize incident data flow
'use server';

/**
 * @fileOverview A Genkit flow for summarizing incident data from multiple sources.
 *
 * - summarizeIncidentData - A function that summarizes incident data.
 * - SummarizeIncidentDataInput - The input type for the summarizeIncidentData function.
 * - SummarizeIncidentDataOutput - The return type for the summarizeIncidentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeIncidentDataInputSchema = z.object({
  incidentDetails: z
    .string()
    .describe('Details about the incident, potentially from multiple sources.'),
});
export type SummarizeIncidentDataInput = z.infer<typeof SummarizeIncidentDataInputSchema>;

const SummarizeIncidentDataOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the incident.'),
  location: z.string().describe('The location of the incident.'),
  casualtyFigures: z.string().describe('The number of casualties involved in the incident.'),
});
export type SummarizeIncidentDataOutput = z.infer<typeof SummarizeIncidentDataOutputSchema>;

export async function summarizeIncidentData(
  input: SummarizeIncidentDataInput
): Promise<SummarizeIncidentDataOutput> {
  return summarizeIncidentDataFlow(input);
}

const summarizeIncidentDataPrompt = ai.definePrompt({
  name: 'summarizeIncidentDataPrompt',
  input: {schema: SummarizeIncidentDataInputSchema},
  output: {schema: SummarizeIncidentDataOutputSchema},
  prompt: `You are an expert at summarizing incident data from various sources.

  Given the following incident details, provide a concise summary, extract the location, and identify the casualty figures.

  Incident Details: {{{incidentDetails}}}

  Summary:
  Location:
  Casualty Figures: `,
});

const summarizeIncidentDataFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentDataFlow',
    inputSchema: SummarizeIncidentDataInputSchema,
    outputSchema: SummarizeIncidentDataOutputSchema,
  },
  async input => {
    const {output} = await summarizeIncidentDataPrompt(input);
    return output!;
  }
);
