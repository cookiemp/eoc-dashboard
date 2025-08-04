'use server';
/**
 * @fileOverview A Genkit flow for categorizing news articles as humanitarian or general news.
 *
 * - categorizeNewsArticles - Categorizes articles based on content analysis
 * - CategorizeNewsArticlesInput - The input type for the flow
 * - CategorizeNewsArticlesOutput - The return type for the flow
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { NewsArticle } from '@/lib/types';

const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  url: z.string().url(),
});

const CategorizedArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  url: z.string(),
  category: z.enum(['humanitarian', 'general']).describe('The category of the article based on its content'),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1 for the categorization'),
  reasoning: z.string().describe('Brief explanation of why this article was categorized this way'),
});

const CategorizeNewsArticlesInputSchema = z.object({
  articles: z.array(NewsArticleSchema),
});
export type CategorizeNewsArticlesInput = z.infer<typeof CategorizeNewsArticlesInputSchema>;

const CategorizeNewsArticlesOutputSchema = z.object({
  categorizedArticles: z.array(CategorizedArticleSchema),
  summary: z.object({
    totalArticles: z.number(),
    humanitarianCount: z.number(),
    generalCount: z.number(),
  }),
});
export type CategorizeNewsArticlesOutput = z.infer<typeof CategorizeNewsArticlesOutputSchema>;
export type CategorizedArticle = z.infer<typeof CategorizedArticleSchema>;

export async function categorizeNewsArticles(
  input: CategorizeNewsArticlesInput
): Promise<CategorizeNewsArticlesOutput> {
  return categorizeNewsArticlesFlow(input);
}

const categorizeNewsPrompt = ai.definePrompt({
  name: 'categorizeNewsPrompt',
  input: { schema: CategorizeNewsArticlesInputSchema },
  output: { schema: CategorizeNewsArticlesOutputSchema },
  prompt: `You are an AI analyst for the Ethiopia Red Cross Society Emergency Operations Center. Your task is to categorize news articles as either "humanitarian" or "general" news based on their content.

**CATEGORIZATION CRITERIA:**

**HUMANITARIAN NEWS** (category: "humanitarian"):
- Emergency response and disaster relief
- Health crises, disease outbreaks, medical emergencies
- Food security, famine, malnutrition, hunger
- Water, sanitation, and hygiene (WASH) issues
- Displacement, refugees, internally displaced persons (IDPs)
- Humanitarian aid, relief operations, emergency assistance
- Conflict-related humanitarian impacts
- Natural disasters (drought, floods, earthquakes)
- Vulnerable populations (children, elderly, disabled)
- Humanitarian funding appeals and responses
- UN agency activities (OCHA, UNHCR, WFP, UNICEF, WHO)
- Red Cross/Red Crescent activities
- NGO humanitarian operations

**GENERAL NEWS** (category: "general"):
- Politics, government, elections, policy
- Economic developments, business, trade
- Sports, entertainment, culture
- Technology, innovation, development projects
- Education (non-emergency)
- Regular social news and events
- Infrastructure development (non-emergency)
- Diplomatic relations
- Regular agricultural updates (non-crisis)
- General crime and security (non-humanitarian impact)

**IMPORTANT GUIDELINES:**
1. **Context Matters**: Consider the humanitarian impact and urgency
2. **Ethiopia Focus**: Prioritize Ethiopian humanitarian situations
3. **Emergency vs. Development**: Emergency = humanitarian, development = general
4. **Vulnerable Populations**: Always consider humanitarian when vulnerable groups are affected
5. **Confidence Scoring**: 
   - 0.9-1.0: Very clear categorization
   - 0.7-0.8: Clear with minor ambiguity
   - 0.5-0.6: Moderate ambiguity, reasonable classification
   - Below 0.5: High ambiguity (avoid if possible)

**Articles to Categorize:**
{{#each articles}}
- **ID:** {{this.id}}
  **Title:** {{this.title}}
  **Source:** {{this.source}}
  **Snippet:** {{this.snippet}}
  **URL:** {{this.url}}

{{/each}}

For each article, provide:
1. All original article data (id, title, source, snippet, url)
2. Category classification ("humanitarian" or "general")
3. Confidence score (0-1)
4. Brief reasoning for the classification

Ensure the summary counts match the total articles categorized.`,
});

const categorizeNewsArticlesFlow = ai.defineFlow(
  {
    name: 'categorizeNewsArticlesFlow',
    inputSchema: CategorizeNewsArticlesInputSchema,
    outputSchema: CategorizeNewsArticlesOutputSchema,
  },
  async (input) => {
    // If there are no articles, return empty result
    if (!input.articles || input.articles.length === 0) {
      return {
        categorizedArticles: [],
        summary: {
          totalArticles: 0,
          humanitarianCount: 0,
          generalCount: 0,
        },
      };
    }

    const { output } = await categorizeNewsPrompt(input);
    return output!;
  }
);
