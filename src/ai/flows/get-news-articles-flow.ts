'use server';
/**
 * @fileOverview A flow for fetching real news articles from an RSS feed.
 *
 * - getNewsArticles - Fetches a list of news articles based on a category.
 * - GetNewsArticlesInput - The input type for the flow.
 * - GetNewsArticlesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { NewsArticle } from '@/lib/types';
import Parser from 'rss-parser';

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
  error: z.string().optional(),
});
export type GetNewsArticlesOutput = z.infer<typeof GetNewsArticlesOutputSchema>;


export async function getNewsArticles(
  input: GetNewsArticlesInput
): Promise<GetNewsArticlesOutput> {
  return getNewsArticlesFlow(input);
}


// This flow fetches real news from ReliefWeb's RSS feed for Ethiopia.
const getNewsArticlesFlow = ai.defineFlow(
  {
    name: 'getNewsArticlesFlow',
    inputSchema: GetNewsArticlesInputSchema,
    outputSchema: GetNewsArticlesOutputSchema,
  },
  async (input) => {
    // We only care about humanitarian news for now.
    if (input.category !== 'humanitarian') {
      return { articles: [] };
    }

    const parser = new Parser({
      // Add a custom User-Agent header to mimic a browser request.
      // This can help avoid being blocked or receiving non-XML responses.
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });

    const feedUrl = 'https://reliefweb.int/rss.xml?country=76'; // ReliefWeb RSS feed for Ethiopia

    // Let errors propagate up to the action to be handled there.
    const feed = await parser.parseURL(feedUrl);
    
    const articles: NewsArticle[] = feed.items.slice(0, 10).map((item) => ({
      id: item.guid || item.link || item.title!,
      title: item.title || 'No Title',
      source: 'ReliefWeb',
      snippet: item.contentSnippet || item.content || 'No Snippet',
      url: item.link || '',
    }));

    return { articles };
  }
);
