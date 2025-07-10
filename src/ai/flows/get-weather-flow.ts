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

// This is the direct function that gets the weather.
// We can call this directly without needing the LLM.
async function fetchWeatherForCity(city: string): Promise<z.infer<typeof WeatherSchema>> {
  // In a real application, this would call a weather API.
  // For now, we'll use our mock data.
  const cityData = mockWeatherData[city] || { temperature: 20, condition: 'Partly Cloudy' };
  return {
    city: city,
    ...cityData,
  };
}


const getCurrentWeather = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Returns the current weather for a given city.',
    inputSchema: z.object({
      city: z.string().describe('The city to get the weather for.'),
    }),
    outputSchema: WeatherSchema,
  },
  async (input) => fetchWeatherForCity(input.city)
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
    // Instead of making N calls to the LLM, we make N calls to our direct function.
    // This is much more efficient and avoids rate limiting.
    const weatherPromises = input.cities.map((city) =>
      fetchWeatherForCity(city)
    );

    const weatherData = await Promise.all(weatherPromises);

    return { weather: weatherData };
  }
);
