'use server';
/**
 * @fileOverview A Genkit flow for generating health alerts.
 *
 * - getHealthAlerts - A function that returns a list of health alerts.
 * - GetHealthAlertsOutput - The return type for the getHealthAlerts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HealthAlertSchema = z.object({
  id: z.string().describe('A unique identifier for the alert, e.g., "ha1".'),
  title: z.string().describe('A short, descriptive title for the health alert.'),
  severity: z.enum(['High', 'Medium', 'Low']).describe('The severity of the alert.'),
  region: z.string().describe('The specific region or state in Ethiopia affected by the alert.'),
  details: z.string().describe('A detailed paragraph explaining the health alert, its impact, and recommended actions.'),
  link: z.string().describe('A valid URL to a reputable source (like WHO or CDC) for more information.'),
});

const GetHealthAlertsOutputSchema = z.object({
  alerts: z.array(HealthAlertSchema).describe('An array of 3 distinct and realistic health alerts currently relevant to Ethiopia.'),
});
export type GetHealthAlertsOutput = z.infer<typeof GetHealthAlertsOutputSchema>;


export async function getHealthAlerts(): Promise<GetHealthAlertsOutput> {
  return getHealthAlertsFlow();
}

const getHealthAlertsPrompt = ai.definePrompt({
  name: 'getHealthAlertsPrompt',
  output: { schema: GetHealthAlertsOutputSchema },
  prompt: `You are a public health expert working for an Emergency Operations Center (EOC) in Ethiopia.

  Your task is to generate a list of 3 current, realistic, and distinct public health alerts for different regions within Ethiopia.

  For each alert, provide the following information:
  - id: A unique ID like 'ha1', 'ha2', etc.
  - title: A concise title (e.g., "Cholera Outbreak").
  - severity: Must be 'High', 'Medium', or 'Low'.
  - region: A specific, real region in Ethiopia.
  - details: A detailed paragraph describing the situation.
  - link: A valid, relevant URL from an authoritative source like the WHO.

  Ensure the alerts are diverse and reflect potential real-world public health challenges in the country.
  `,
});


const getHealthAlertsFlow = ai.defineFlow(
  {
    name: 'getHealthAlertsFlow',
    outputSchema: GetHealthAlertsOutputSchema,
  },
  async () => {
    const { output } = await getHealthAlertsPrompt();
    return output!;
  }
);
