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
  summary: z.string().describe('A concise, bullet-pointed summary of the provided news articles. Each bullet point should start with a markdown asterisk (*) and include a markdown link to the source article.'),
});
export type SummarizeIncidentDataOutput = z.infer<typeof SummarizeIncidentDataOutputSchema>;

export async function summarizeIncidentData(
  input: SummarizeIncidentDataInput
): Promise<SummarizeIncidentDataOutput> {
  return summarizeIncidentDataFlow(input);
}

const PromptInputSchema = z.object({
  articlesJson: z.string(),
});

const summarizeIncidentDataPrompt = ai.definePrompt({
  name: 'summarizeIncidentDataPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: SummarizeIncidentDataOutputSchema},
  prompt: `You are an expert at summarizing humanitarian incident data for an emergency operations center.

  Given the following JSON array of news articles, provide a concise summary as a single string. The summary must be in a bullet-pointed list format. Each bullet point must start with a markdown asterisk (*).

  For each article, create one bullet point that summarizes the key information from the title and snippet. Crucially, each bullet point must end with a markdown link to the original article, like this: [Source](url).

  Articles:
  {{{articlesJson}}}
  `,
});

const summarizeIncidentDataFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentDataFlow',
    inputSchema: SummarizeIncidentDataInputSchema,
    outputSchema: SummarizeIncidentDataOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeIncidentDataPrompt({
      articlesJson: JSON.stringify(input.articles, null, 2),
    });
    return output!;
  }
);
