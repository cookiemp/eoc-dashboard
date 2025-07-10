'use server';
/**
 * @fileOverview A Genkit flow for generating realistic news articles.
 *
 * - getNewsArticles - Generates a list of news articles based on a category.
 * - GetNewsArticlesInput - The input type for the flow.
 * - GetNewsArticlesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { NewsArticle } from '@/lib/types';

const NewsArticleSchema = z.object({
  id: z.string().describe("A unique identifier for the news article, e.g., 'hn1' or 'gn1'."),
  title: z.string().describe('A realistic, concise, and engaging headline for the news article.'),
  source: z.string().describe('A plausible news source or organization (e.g., "ReliefWeb", "Ethiopian News Agency").'),
  snippet: z.string().describe('A one or two-sentence summary of the article content.'),
  url: z.string().describe('A plausible, well-formed URL for the news article.'),
});

const GetNewsArticlesInputSchema = z.object({
  category: z.enum(['humanitarian', 'general']).describe("The category of news to generate. 'humanitarian' for aid-related news, 'general' for other news about Ethiopia."),
});
export type GetNewsArticlesInput = z.infer<typeof GetNewsArticlesInputSchema>;

const GetNewsArticlesOutputSchema = z.object({
  articles: z.array(NewsArticleSchema),
});
export type GetNewsArticlesOutput = z.infer<typeof GetNewsArticlesOutputSchema>;


export async function getNewsArticles(
  input: GetNewsArticlesInput
): Promise<GetNewsArticlesOutput> {
  return getNewsArticlesFlow(input);
}


const getNewsArticlesPrompt = ai.definePrompt({
  name: 'getNewsArticlesPrompt',
  input: { schema: GetNewsArticlesInputSchema },
  output: { schema: GetNewsArticlesOutputSchema },
  prompt: `You are a news editor for an Emergency Operations Center dashboard focused on Ethiopia.
  Your task is to generate a list of 5 recent, realistic, and relevant news articles.

  The category of news to generate is: **{{category}}**.

  **Instructions:**
  - **Humanitarian News:** If the category is 'humanitarian', focus on topics like aid distribution, displacement, health crises, natural disasters, and food security in Ethiopia.
  - **General News:** If the category is 'general', focus on topics like infrastructure, economic development, cultural events, and politics in Ethiopia.
  - **Be Realistic:** Create plausible headlines, sources, and snippets. The information should sound like it's from a real news report.
  - **Generate 5 Articles:** Create exactly 5 distinct articles for the specified category.
  `,
});


const getNewsArticlesFlow = ai.defineFlow(
  {
    name: 'getNewsArticlesFlow',
    inputSchema: GetNewsArticlesInputSchema,
    outputSchema: GetNewsArticlesOutputSchema,
  },
  async (input) => {
    const { output } = await getNewsArticlesPrompt(input);
    return output!;
  }
);
