import { ai } from '../genkit';
import { z } from 'zod';
import { getEthiopianCoordinates } from '@/lib/ethiopian-locations';
import { getFirestore } from '@/lib/firebase-admin';

/**
 * Geocode Ethiopian Location Flow
 * 
 * Converts Ethiopian administrative location names (Region/Zone/Woreda/Kebele)
 * into approximate latitude/longitude coordinates using AI reasoning.
 */

const GeocodeLocationInputSchema = z.object({
  region: z.string().optional(),
  zone: z.string().optional(),
  woreda: z.string().optional(),
  kebele: z.string().optional(),
  locationScope: z.enum(['region', 'zone', 'woreda', 'kebele']).optional(),
});

const GeocodeLocationOutputSchema = z.object({
  latitude: z.number().describe('Latitude coordinate (decimal degrees)'),
  longitude: z.number().describe('Longitude coordinate (decimal degrees)'),
  locationName: z.string().describe('Full location name for display'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of geocoding'),
  reasoning: z.string().describe('Explanation of how coordinates were determined'),
});

export type GeocodeLocationInput = z.infer<typeof GeocodeLocationInputSchema>;
export type GeocodeLocationOutput = z.infer<typeof GeocodeLocationOutputSchema>;

/**
 * Cache geocoding results in Firestore to avoid duplicate AI calls
 */
async function getCachedGeocode(cacheKey: string): Promise<GeocodeLocationOutput | null> {
  try {
    const db = await getFirestore();
    if (!db) return null;
    
    const cacheDoc = await db.collection('geocode_cache').doc(cacheKey).get();
    
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      if (data && data.cachedAt) {
        // Cache valid for 90 days
        const cacheAge = Date.now() - data.cachedAt;
        if (cacheAge < 90 * 24 * 60 * 60 * 1000) {
          console.log(`✅ Using cached geocode for: ${cacheKey}`);
          return data.result as GeocodeLocationOutput;
        }
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  return null;
}

async function setCachedGeocode(cacheKey: string, result: GeocodeLocationOutput): Promise<void> {
  try {
    const db = await getFirestore();
    if (!db) return;
    
    await db.collection('geocode_cache').doc(cacheKey).set({
      result,
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

export const geocodeEthiopianLocation = ai.defineFlow(
  {
    name: 'geocodeEthiopianLocation',
    inputSchema: GeocodeLocationInputSchema,
    outputSchema: GeocodeLocationOutputSchema,
  },
  async (input) => {
    // Create cache key from input
    const cacheKey = [
      input.region || '',
      input.zone || '',
      input.woreda || '',
      input.kebele || '',
    ].filter(Boolean).join('_').toLowerCase().replace(/\s+/g, '_');

    // 1. Check cache first
    const cached = await getCachedGeocode(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Try static database lookup (FAST, NO API CALLS)
    const staticResult = getEthiopianCoordinates({
      region: input.region,
      zone: input.zone,
      woreda: input.woreda,
      kebele: input.kebele,
    });

    if (staticResult) {
      console.log(`📍 Static geocode found: ${staticResult.locationName}`);
      const result: GeocodeLocationOutput = {
        latitude: staticResult.latitude,
        longitude: staticResult.longitude,
        locationName: staticResult.locationName,
        confidence: staticResult.confidence,
        reasoning: 'Coordinates retrieved from authoritative Ethiopian location database',
      };
      
      // Cache the static result
      await setCachedGeocode(cacheKey, result);
      return result;
    }

    // 3. Fallback to AI only if static lookup fails (USES API QUOTA)
    console.log(`🤖 Using AI geocoding for unknown location: ${cacheKey}`);
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: `You are a geographic expert specializing in Ethiopian administrative divisions.

Your task is to provide approximate latitude and longitude coordinates for the following location:

${input.region ? `Region: ${input.region}` : ''}
${input.zone ? `Zone: ${input.zone}` : ''}
${input.woreda ? `Woreda: ${input.woreda}` : ''}
${input.kebele ? `Kebele: ${input.kebele}` : ''}
${input.locationScope ? `Geographic Scope: ${input.locationScope}` : ''}

Instructions:
1. Determine the approximate center point coordinates for this location
2. If the kebele is provided, give coordinates for that kebele
3. If only woreda is provided, give coordinates for the woreda center
4. If only zone is provided, give coordinates for the zone center
5. If only region is provided, give coordinates for the regional capital
6. Use your knowledge of Ethiopian geography and administrative boundaries
7. Provide decimal degree coordinates (e.g., 9.0333 latitude, 38.7469 longitude)
8. Indicate your confidence level based on how specific the location is
9. Explain your reasoning briefly

Return the coordinates and metadata in the specified format.`,
      output: {
        schema: GeocodeLocationOutputSchema,
      },
    });

    const result = response.output!;
    
    // Cache AI result
    await setCachedGeocode(cacheKey, result);
    
    return result;
  }
);
