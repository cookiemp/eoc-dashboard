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
  1.  **Create One Incident Per Article:** Each humanitarian article should result in one map marker.
  2.  **Extract Specific Locations:** Look carefully for any mention of Ethiopian regions, cities, or areas in titles and snippets. Common locations include:
     - Border regions: Somali region (for South Sudan situations), Tigray, Afar
     - Agricultural areas: Oromia, Amhara, SNNPR (for farming/food security)
     - Conflict areas: Tigray, Amhara, Oromia
     - Drought-prone: Afar, Somali, parts of Oromia
  3.  **Smart Geographic Placement:** Use these coordinates based on content type:
     - **South Sudan displacement**: Somali region (6.5, 43.5) or Gambela (8.2, 34.6)
     - **Farming/agriculture**: Oromia (8.5, 39.5) or Amhara (11.5, 38.0)
     - **Health clusters**: Distribute across regions - Tigray (13.5, 39.5), Amhara (11.5, 38.0), Oromia (8.5, 39.5)
     - **Severe weather**: Afar (11.8, 41.0) for droughts, Somali (6.5, 43.5) for floods
     - **Logistics operations**: Major regions like Oromia (8.5, 39.5), Amhara (11.5, 38.0)
     - **Only use Addis Ababa (9.03, 38.74)** for truly national-level policy reports
  4.  **Categorize with Color:** Assign colors based on content:
      - Red (#ef4444): Health, WASH, medical
      - Blue (#3b82f6): Weather, severe weather, natural disasters
      - Green (#22c55e): Food, agriculture, displacement, logistics, humanitarian operations
      - Amber (#f59e0b): Conflict or security-related issues
  5.  **Distribute Geographically:** Don't cluster everything in Addis Ababa. Spread incidents across relevant Ethiopian regions based on the type of humanitarian activity.

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
