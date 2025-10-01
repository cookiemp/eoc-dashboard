'use server';
/**
 * @fileOverview Genkit flow for extracting structured incidents from PDF field reports
 * 
 * Takes raw text from ERCS field reports (PDFs) and uses AI to:
 * - Identify distinct humanitarian incidents
 * - Extract key details (location, category, severity, affected people)
 * - Map region names to Ethiopian coordinates
 * - Assess confidence in extraction quality
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema
const ExtractFromPDFInputSchema = z.object({
  pdfText: z.string().describe('Full text extracted from the PDF report'),
  reportMetadata: z.object({
    uploadedBy: z.string().optional(),
    uploadedAt: z.string().optional(),
  }).optional(),
});

export type ExtractFromPDFInput = z.infer<typeof ExtractFromPDFInputSchema>;

// Ethiopian region coordinates mapping (for AI reference)
const ETHIOPIAN_REGIONS = `
- Addis Ababa: (9.03, 38.74)
- Tigray/Mekelle: (13.5, 39.5)
- Amhara/Bahir Dar: (11.5, 38.0)
- Oromia/Addis: (8.5, 39.5)
- Somali/Jijiga: (6.5, 43.5)
- Afar/Semera: (11.8, 41.0)
- SNNPR/Hawassa: (7.05, 38.5)
- Gambela: (8.2, 34.6)
- Harari: (9.3, 42.1)
- Dire Dawa: (9.6, 41.85)
`;

// Output schema
const FieldIncidentSchema = z.object({
  title: z.string().describe('Concise title summarizing the incident (max 100 chars)'),
  description: z.string().describe('2-3 sentence description of the incident'),
  latitude: z.number().describe('Latitude coordinate for incident location in Ethiopia'),
  longitude: z.number().describe('Longitude coordinate for incident location in Ethiopia'),
  locationName: z.string().describe('Human-readable location name (region, city, woreda)'),
  category: z.enum([
    'health',
    'food_security',
    'displacement',
    'wash',
    'security',
    'other'
  ]).describe('Type of humanitarian incident'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level based on language and impact'),
  color: z.string().describe('Hex color for map marker: health=#ef4444, food=#22c55e, displacement=#3b82f6, wash=#06b6d4, security=#f59e0b, other=#6b7280'),
  affectedPeople: z.number().optional().describe('Number of people affected (if mentioned)'),
  incidentDate: z.string().optional().describe('Date of incident if mentioned in report'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1 for this extraction'),
  needsReview: z.boolean().describe('True if any field has low confidence or missing critical info'),
});

const ExtractFromPDFOutputSchema = z.object({
  incidents: z.array(FieldIncidentSchema),
  summary: z.string().describe('Brief summary of the report content'),
  reportDate: z.string().optional().describe('Date of the report if identified'),
  totalIncidentsFound: z.number().describe('Count of incidents extracted'),
});

export type ExtractFromPDFOutput = z.infer<typeof ExtractFromPDFOutputSchema>;

// Define the AI prompt
const extractFromPDFPrompt = ai.definePrompt({
  name: 'extractFromPDFPrompt',
  input: { schema: ExtractFromPDFInputSchema },
  output: { schema: ExtractFromPDFOutputSchema },
  prompt: `You are an AI analyst for the Ethiopian Red Cross Society (ERCS). 
Your task is to extract structured humanitarian incident data from field reports.

**ETHIOPIAN REGION COORDINATES:**
${ETHIOPIAN_REGIONS}

**CATEGORIZATION GUIDELINES:**

**Health:** Medical emergencies, disease outbreaks, malnutrition, health facility issues
**Food Security:** Food shortages, famine, crop failure, livestock losses
**Displacement:** Refugees, IDPs, evacuations, forced migration
**WASH:** Water shortages, sanitation issues, hygiene concerns
**Security:** Conflict, violence, threats to aid workers or civilians
**Other:** Natural disasters, infrastructure damage, general emergencies

**SEVERITY ASSESSMENT:**
- **Critical:** Life-threatening, large-scale, urgent response needed
- **High:** Serious impact, significant population affected
- **Medium:** Moderate concern, localized impact
- **Low:** Minor issue, monitoring needed

**EXTRACTION RULES:**
1. **Be Precise:** Extract ONLY incidents explicitly mentioned in the report
2. **Location Mapping:** Map Ethiopian region/city names to coordinates using the reference above
3. **Confidence Scoring:** 
   - 1.0: All details clear and specific
   - 0.8-0.9: Most details clear, minor assumptions
   - 0.6-0.7: Some details missing or unclear
   - Below 0.6: Mark needsReview=true
4. **Numbers:** Extract affected population counts if mentioned
5. **Dates:** Parse incident dates if provided
6. **Color Coding:**
   - Health: #ef4444 (red)
   - Food Security: #22c55e (green)
   - Displacement: #3b82f6 (blue)
   - WASH: #06b6d4 (cyan)
   - Security: #f59e0b (amber)
   - Other: #6b7280 (gray)

**FIELD REPORT TEXT:**
{{pdfText}}

**TASK:**
Extract all humanitarian incidents from this report. For each incident:
1. Create a clear, concise title
2. Write a 2-3 sentence description
3. Map the location to Ethiopian coordinates
4. Categorize the incident type
5. Assess severity based on language and impact
6. Extract affected population if mentioned
7. Assign appropriate marker color
8. Calculate confidence score
9. Flag for review if confidence < 0.7

Provide a brief summary of the overall report and count of incidents found.`,
});

// Define the flow
export const extractIncidentsFromPDFFlow = ai.defineFlow(
  {
    name: 'extractIncidentsFromPDFFlow',
    inputSchema: ExtractFromPDFInputSchema,
    outputSchema: ExtractFromPDFOutputSchema,
  },
  async (input) => {
    // If PDF text is empty, return empty result
    if (!input.pdfText || input.pdfText.trim().length === 0) {
      return {
        incidents: [],
        summary: 'No text content found in PDF',
        totalIncidentsFound: 0,
      };
    }

    // Call the AI prompt
    const { output } = await extractFromPDFPrompt(input);
    
    // Ensure needsReview flag is set for low confidence incidents
    if (output && output.incidents) {
      output.incidents = output.incidents.map(incident => ({
        ...incident,
        needsReview: incident.confidence < 0.7 || incident.needsReview,
      }));
    }
    
    return output!;
  }
);

// Export function to be called from API routes or server actions
export async function extractIncidentsFromPDF(
  input: ExtractFromPDFInput
): Promise<ExtractFromPDFOutput> {
  return extractIncidentsFromPDFFlow(input);
}