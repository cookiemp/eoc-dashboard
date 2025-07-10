'use server';

/**
 * @fileOverview A Genkit flow for generating mock incident data for the EOC dashboard map.
 *
 * - getIncidents - A function that returns a list of generated incidents.
 * - GetIncidentsOutput - The return type for the getIncidents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Incident } from '@/lib/types';

const IncidentSchema = z.object({
  id: z.number(),
  title: z.string().describe('A short, descriptive title for the incident.'),
  description: z.string().describe('A one or two-sentence description of the incident.'),
  latitude: z.number().describe('The geographical latitude of the incident.'),
  longitude: z.number().describe('The geographical longitude of the incident.'),
  color: z
    .string()
    .describe(
      "A hex color code representing the incident type. Use '#3b82f6' (blue) for weather/natural disasters, '#ef4444' (red) for health emergencies, '#f59e0b' (amber) for conflict, and '#22c55e' (green) for other operational updates like displacement camps."
    ),
});

const GetIncidentsOutputSchema = z.object({
  incidents: z.array(IncidentSchema),
});
export type GetIncidentsOutput = z.infer<typeof GetIncidentsOutputSchema>;

export async function getIncidents(): Promise<GetIncidentsOutput> {
  return getIncidentsFlow();
}

const getIncidentsPrompt = ai.definePrompt({
  name: 'getIncidentsPrompt',
  output: { schema: GetIncidentsOutputSchema },
  prompt: `You are an intelligence analyst for the Ethiopia Red Cross Society Emergency Operations Center.

  Generate a list of 4 to 6 realistic, current, and plausible humanitarian incidents occurring across Ethiopia.

  For each incident, provide:
  - A unique integer ID.
  - A short title.
  - A one or two-sentence description.
  - A plausible latitude and longitude within Ethiopia.
  - A color based on the incident category:
    - Blue (#3b82f6) for weather-related events (floods, droughts).
    - Red (#ef4444) for health emergencies (disease outbreaks).
    - Amber (#f59e0b) for conflict or security-related issues.
    - Green (#22c55e) for other operational updates (e.g., displacement camps, aid distribution points).

  Ensure the incidents are geographically dispersed across different regions of Ethiopia.
  `,
});

const getIncidentsFlow = ai.defineFlow(
  {
    name: 'getIncidentsFlow',
    outputSchema: GetIncidentsOutputSchema,
  },
  async () => {
    const { output } = await getIncidentsPrompt();
    return output!;
  }
);
