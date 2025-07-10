'use server';
/**
 * @fileOverview A Genkit flow for generating a detailed dossier for a specific incident.
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
  error: z.string().optional(),
});
export type GenerateIncidentDossierOutput = z.infer<typeof GenerateIncidentDossierOutputSchema>;

export async function generateIncidentDossier(
  input: GenerateIncidentDossierInput
): Promise<GenerateIncidentDossierOutput> {
  return generateIncidentDossierFlow(input);
}


// This flow generates a detailed summary for a given incident.
const generateIncidentDossierFlow = ai.defineFlow(
  {
    name: 'generateIncidentDossierFlow',
    inputSchema: GenerateIncidentDossierInputSchema,
    outputSchema: GenerateIncidentDossierOutputSchema,
  },
  async (input) => {
    
    const { output } = await ai.generate({
      prompt: `Generate a detailed, professional, one-paragraph executive summary for an emergency operations center briefing.
      Base the summary on the following incident details. Expand on the information given to create a comprehensive overview.
      
      Incident Title: ${input.title}
      Incident Description: ${input.description}`,
      output: {
        schema: z.object({ executiveSummary: GenerateIncidentDossierOutputSchema.shape.executiveSummary }),
      },
    });

    if (!output) {
      throw new Error('Failed to generate summary.');
    }

    return {
      executiveSummary: output.executiveSummary,
    };
  }
);
