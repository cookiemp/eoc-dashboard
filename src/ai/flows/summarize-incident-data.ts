'use server';

/**
 * @fileOverview A Genkit flow for summarizing humanitarian news articles.
 *
 * - summarizeIncidentData - A function that summarizes incident data.
 * - SummarizeIncidentDataInput - The input type for the summarizeIncidentData function.
 * - SummarizeIncidentDataOutput - The return type for the summarizeIncidentData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  url: z.string().url(),
});

const FieldIncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  severity: z.string(),
  locationName: z.string(),
  reportedBy: z.string().optional(),
  affectedPeople: z.union([z.string(), z.number()]).optional(),
});

const SummarizeIncidentDataInputSchema = z.object({
  articles: z.array(NewsArticleSchema),
  fieldIncidents: z.array(FieldIncidentSchema).optional(),
});
export type SummarizeIncidentDataInput = z.infer<typeof SummarizeIncidentDataInputSchema>;

const SummarizeIncidentDataOutputSchema = z.object({
  summary: z.string().describe('A concise, bullet-pointed summary of the provided news articles and field incidents. Each bullet point should start with a markdown asterisk (*). If an article pertains to a health crisis, epidemic, or medical supply issue, start that bullet point with a ⚕️ emoji followed by the asterisk. News articles must include a [Source](url) link. Field incidents must include a [More](#incident-id) link.'),
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
  prompt: `You are an expert at summarizing humanitarian incident data for the Ethiopia Red Cross Society emergency operations center.

  Given the following field incidents and news articles about Ethiopia, provide a concise summary as a single string. The summary must be in a bullet-pointed list format with each bullet point on a separate line.

  IMPORTANT: Field incidents are DIRECT GROUND REPORTS and should be listed FIRST in the summary, as they are the most critical and reliable information.

  FORMATTING REQUIREMENTS:
  - Each bullet point MUST start with either * or ⚕️* (never just ⚕️ alone)
  - Each bullet point must be on its own line (separated by \n)
  - For field incidents: Each bullet point must end with a markdown link: [More](#incident-id)
  - For news articles: Each bullet point must end with a markdown link: [Source](url)
  - If an article or incident is about a public health issue (disease outbreak, health crisis, medical supplies), start that bullet point with ⚕️* (emoji directly followed by asterisk, no space between)
  - NEVER output just ⚕️ on a line by itself - always include the asterisk and summary text

  For each incident or article, create one bullet point that summarizes the key information.

  Example format (note field incidents come FIRST):
  * Field incident summary with details. [More](#inc123)
  ⚕️* Health-related field incident. [More](#inc456)
  * News article summary. [Source](url1)
  * Another news article summary. [Source](url2)

  {{#if fieldIncidents}}
  Field Incidents (PRIORITIZE THESE FIRST):
  {{#each fieldIncidents}}
  - ID: {{this.id}}
    Title: {{this.title}}
    Description: {{this.description}}
    Category: {{this.category}}
    Severity: {{this.severity}}
    Location: {{this.locationName}}
    {{#if this.affectedPeople}}Affected People: {{this.affectedPeople}}{{/if}}
  {{/each}}
  {{/if}}

  {{#if articles}}
  News Articles (list these AFTER field incidents):
  {{#each articles}}
  - Title: {{this.title}}
    Snippet: {{this.snippet}}
    URL: {{this.url}}
  {{/each}}
  {{/if}}
  `,
});

const summarizeIncidentDataFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentDataFlow',
    inputSchema: SummarizeIncidentDataInputSchema,
    outputSchema: SummarizeIncidentDataOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeIncidentDataPrompt(input);
    return output!;
  }
);
