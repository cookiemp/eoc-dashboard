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

const SummarizeIncidentDataInputSchema = z.object({
  articles: z.array(NewsArticleSchema),
});
export type SummarizeIncidentDataInput = z.infer<typeof SummarizeIncidentDataInputSchema>;

const SummarizeIncidentDataOutputSchema = z.object({
  summary: z.string().describe('A concise, bullet-pointed summary of the provided news articles. Each bullet point should start with a markdown asterisk (*). If an article pertains to a health crisis, epidemic, or medical supply issue, start that bullet point with a ⚕️ emoji followed by the asterisk. Each bullet point must include a markdown link to the source article.'),
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

  Given the following news articles about Ethiopia, provide a concise summary as a single string. The summary must be in a bullet-pointed list format with each bullet point on a separate line.

  FORMATTING REQUIREMENTS:
  - Each bullet point must start with a markdown asterisk (*) followed by a space
  - Each bullet point must be on its own line (separated by \n)
  - Each bullet point must end with a markdown link to the original article: [Source](url)
  - If an article is about a public health issue (disease outbreak, health crisis, medical supplies), start that bullet point with ⚕️* (emoji + asterisk)

  For each article, create one bullet point that summarizes the key information from the title and snippet.

  Example format:
  * First summary point here. [Source](url1)
  * Second summary point here. [Source](url2)
  ⚕️* Health-related summary point here. [Source](url3)

  Articles:
  {{#each articles}}
  - Title: {{this.title}}
    Snippet: {{this.snippet}}
    Source: [{{this.source}}]({{this.url}})
  {{/each}}
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
