'use server';
/**
 * @fileOverview A Genkit flow for generating a detailed dossier for a specific incident,
 * including an in-depth summary and a representative image.
 *
 * - generateIncidentDossier - The main function to generate the dossier.
 * - GenerateIncidentDossierInput - The input type for the flow.
 * - GenerateIncidentDossierOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIncidentDossierInputSchema = z.object({
  title: z.string().describe('The title of the incident.'),
  description: z.string().describe('The short description of the incident.'),
});
export type GenerateIncidentDossierInput = z.infer<typeof GenerateIncidentDossierInputSchema>;

const GenerateIncidentDossierOutputSchema = z.object({
  executiveSummary: z
    .string()
    .describe(
      'A detailed, professional, one-paragraph executive summary suitable for an emergency operations briefing. This should elaborate significantly on the provided title and description.'
    ),
  photoDataUri: z
    .string()
    .describe(
      "A photo representing the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  error: z.string().optional(),
});
export type GenerateIncidentDossierOutput = z.infer<typeof GenerateIncidentDossierOutputSchema>;

export async function generateIncidentDossier(
  input: GenerateIncidentDossierInput
): Promise<GenerateIncidentDossierOutput> {
  return generateIncidentDossierFlow(input);
}


// This flow now orchestrates two parallel AI calls: one for text and one for image generation.
const generateIncidentDossierFlow = ai.defineFlow(
  {
    name: 'generateIncidentDossierFlow',
    inputSchema: GenerateIncidentDossierInputSchema,
    outputSchema: GenerateIncidentDossierOutputSchema,
  },
  async (input) => {
    // Run text and image generation in parallel to save time.
    const [summaryResponse, imageResponse] = await Promise.all([
      // Text generation call
      ai.generate({
        prompt: `Generate a detailed, professional, one-paragraph executive summary for an emergency operations center briefing.
        Base the summary on the following incident details. Expand on the information given to create a comprehensive overview.
        
        Incident Title: ${input.title}
        Incident Description: ${input.description}`,
        output: {
          schema: z.object({ executiveSummary: GenerateIncidentDossierOutputSchema.shape.executiveSummary }),
        },
      }),

      // Image generation call
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a realistic, photo-style image that visually represents the following humanitarian incident in Ethiopia. Avoid showing text or logos.
        
        Incident: ${input.title} - ${input.description}`,
        config: {
          responseModalities: ['IMAGE', 'TEXT'], // Important: must include both
        },
      }),
    ]);
    
    const summary = summaryResponse.output;
    const image = imageResponse.media;

    if (!summary || !image) {
      throw new Error('Failed to generate either summary or image.');
    }

    return {
      executiveSummary: summary.executiveSummary,
      photoDataUri: image.url,
    };
  }
);
