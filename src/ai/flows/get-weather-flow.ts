'use server';

/**
 * @fileOverview A Genkit flow for fetching weather data for a list of cities.
 *
 * - getWeatherForCities - A function that takes a list of cities and returns their current weather.
 * - GetWeatherForCitiesInput - The input type for the getWeatherForCities function.
 * - GetWeatherForCitiesOutput - The return type for the getWeatherForCities function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mock weather data to simulate an API call
const mockWeatherData: { [city: string]: { temperature: number; condition: string } } = {
  'Addis Ababa': { temperature: 22, condition: 'Sunny' },
  'Dire Dawa': { temperature: 28, condition: 'Windy' },
  'Gondar': { temperature: 18, condition: 'Rainy' },
  'Mekelle': { temperature: 25, condition: 'Stormy' },
  'Hawassa': { temperature: 24, condition: 'Cloudy' },
  'Jimma': { temperature: 20, condition: 'Rainy' },
};

const WeatherSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
});

const GetWeatherForCitiesInputSchema = z.object({
  cities: z.array(z.string()).describe('A list of city names.'),
});
export type GetWeatherForCitiesInput = z.infer<typeof GetWeatherForCitiesInputSchema>;

const GetWeatherForCitiesOutputSchema = z.object({
  weather: z.array(WeatherSchema),
});
export type GetWeatherForCitiesOutput = z.infer<typeof GetWeatherForCitiesOutputSchema>;

const getCurrentWeather = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Returns the current weather for a given city.',
    inputSchema: z.object({
      city: z.string().describe('The city to get the weather for.'),
    }),
    outputSchema: WeatherSchema,
  },
  async (input) => {
    // In a real application, this would call a weather API.
    // For now, we'll use our mock data.
    const cityData = mockWeatherData[input.city] || { temperature: 20, condition: 'Partly Cloudy' };
    return {
      city: input.city,
      ...cityData,
    };
  }
);

export async function getWeatherForCities(
  input: GetWeatherForCitiesInput
): Promise<GetWeatherForCitiesOutput> {
  return getWeatherFlow(input);
}

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherForCitiesInputSchema,
    outputSchema: GetWeatherForCitiesOutputSchema,
  },
  async (input) => {
    const weatherPromises = input.cities.map((city) =>
      ai.generate({
        prompt: `What is the current weather in ${city}?`,
        tools: [getCurrentWeather],
        model: 'googleai/gemini-pro',
      })
    );

    const weatherResponses = await Promise.all(weatherPromises);

    const weatherData = weatherResponses.map((res) => {
      // FIX: The correct property is toolResponse.output
      const toolResponse = res.toolResponse;
      if (toolResponse) {
          return toolResponse.output as z.infer<typeof WeatherSchema>;
      }
      // Fallback or error handling if the tool wasn't called
      return null;
    });

    return { weather: weatherData.filter(Boolean) as z.infer<typeof WeatherSchema>[] };
  }
);