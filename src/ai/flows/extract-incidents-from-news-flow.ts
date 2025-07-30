'use server';
/**
 * @fileOverview A Genkit flow for extracting structured incident data from news articles.
 *
 * - extractIncidentsFromNews - Extracts incidents from a list of news articles.
 * - ExtractIncidentsFromNewsInput - The input type for the flow.
 * - ExtractIncidentsFromNewsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Incident } from '@/lib/types';

const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  url: z.string().url(),
});

const IncidentSchema = z.object({
  title: z.string().describe('A short, descriptive title for the incident.'),
  description: z.string().describe('A one or two-sentence description of the incident, derived from the article.'),
  latitude: z.number().describe('A plausible geographical latitude for the incident location mentioned in the article.'),
  longitude: z.number().describe('A plausible geographical longitude for the incident location mentioned in the article.'),
  color: z
    .string()
    .describe(
      "A hex color code representing the incident type. Use '#3b82f6' (blue) for weather/natural disasters, '#ef4444' (red) for health emergencies, '#f59e0b' (amber) for conflict/security, and '#22c55e' (green) for other operational updates (e.g., displacement, aid distribution, funding)."
    ),
});

const ExtractIncidentsFromNewsInputSchema = z.object({
  articles: z.array(NewsArticleSchema),
});
export type ExtractIncidentsFromNewsInput = z.infer<typeof ExtractIncidentsFromNewsInputSchema>;

const ExtractIncidentsFromNewsOutputSchema = z.object({
  incidents: z.array(IncidentSchema),
});
export type ExtractIncidentsFromNewsOutput = z.infer<typeof ExtractIncidentsFromNewsOutputSchema>;


export async function extractIncidentsFromNews(
  input: ExtractIncidentsFromNewsInput
): Promise<ExtractIncidentsFromNewsOutput> {
  return extractIncidentsFromNewsFlow(input);
}


const extractIncidentsPrompt = ai.definePrompt({
  name: 'extractIncidentsPrompt',
  input: { schema: ExtractIncidentsFromNewsInputSchema },
  output: { schema: ExtractIncidentsFromNewsOutputSchema },
  prompt: `You are an intelligence analyst for the Ethiopia Red Cross Society Emergency Operations Center. Your task is to extract structured data about humanitarian incidents from a list of news articles to be plotted on a map.

  Review the following articles. For each article, try to identify Ethiopian locations and humanitarian activities from the TITLE and any available content.

  **IMPORTANT RULES:**
  1.  **Work with Limited Data:** Even if snippets are minimal or say "No summary available," try to extract incidents from article titles if they mention specific Ethiopian locations or regions.
  2.  **Ethiopian Locations:** Look for mentions of Ethiopian cities, regions, or areas like: Addis Ababa, Oromia, Amhara, Tigray, Afar, Somali, SNNPR, Gambela, Benishangul-Gumuz, Harari, Dire Dawa, etc.
  3.  **Plausible Geolocation:** Use your knowledge of Ethiopian geography to assign coordinates:
     - Addis Ababa: ~9.03, 38.74
     - Oromia region: ~8.5, 39.5
     - Amhara region: ~11.5, 38.0
     - Tigray region: ~13.5, 39.5
     - Afar region: ~11.8, 41.0
     - Somali region: ~6.5, 43.5
     - SNNPR: ~7.0, 37.5
  4.  **Categorize with Color:** Assign colors based on content:
      - Blue (#3b82f6) for weather/natural disasters (floods, droughts)
      - Red (#ef4444) for health emergencies (disease outbreaks, medical supply needs)
      - Amber (#f59e0b) for conflict or security-related issues
      - Green (#22c55e) for humanitarian operations (aid distribution, displacement camps, general humanitarian response)
  5.  **Default to Humanitarian Operations:** If the article type is unclear but mentions Ethiopia, default to green (humanitarian operations)
  6.  **Output:** Create incidents even from limited title information if it mentions Ethiopian locations

  **Articles to Analyze:**
  {{#each articles}}
  - **Title:** {{this.title}}
    **Snippet:** {{this.snippet}}
    **Source:** [{{this.source}}]({{this.url}})
  {{/each}}
  `,
});


const extractIncidentsFromNewsFlow = ai.defineFlow(
  {
    name: 'extractIncidentsFromNewsFlow',
    inputSchema: ExtractIncidentsFromNewsInputSchema,
    outputSchema: ExtractIncidentsFromNewsOutputSchema,
  },
  async (input) => {
    // If there are no articles, return an empty array to save an API call.
    if (!input.articles || input.articles.length === 0) {
      return { incidents: [] };
    }
    const { output } = await extractIncidentsPrompt(input);
    return output!;
  }
);
