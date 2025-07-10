'use server';

/**
 * @fileOverview A flow for fetching real weather data from the OpenWeatherMap API.
 *
 * - getWeatherForCities - A function that takes a list of cities and returns their current weather.
 * - GetWeatherForCitiesInput - The input type for the getWeatherForCities function.
 * - GetWeatherForCitiesOutput - The return type for the getWeatherForCities function.
 */

import { z } from 'zod';
import type { WeatherAlert } from '@/lib/types';
import { ai } from '@/ai/genkit';

// Define city coordinates
const cityCoordinates: { [city: string]: { lat: number; lon: number } } = {
  'Addis Ababa': { lat: 9.02497, lon: 38.74689 },
  'Dire Dawa': { lat: 9.5931, lon: 41.8661 },
  'Gondar': { lat: 12.6, lon: 37.4667 },
  'Mekelle': { lat: 13.4969, lon: 39.4769 },
  'Hawassa': { lat: 7.0625, lon: 38.4765 },
};

const WeatherSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
});

const GetWeatherForCitiesInputSchema = z.object({
  cities: z.array(z.string()).describe('A list of city names.'),
  apiKey: z.string().describe('The OpenWeatherMap API key.'),
});
export type GetWeatherForCitiesInput = z.infer<typeof GetWeatherForCitiesInputSchema>;

const GetWeatherForCitiesOutputSchema = z.object({
  weather: z.array(WeatherSchema),
});
export type GetWeatherForCitiesOutput = z.infer<typeof GetWeatherForCitiesOutputSchema>;

/**
 * Fetches the current weather for a single city using the OpenWeatherMap API.
 * @param city The name of the city.
 * @param apiKey The OpenWeatherMap API key.
 * @returns A promise that resolves to a WeatherAlert object or null if an error occurs.
 */
async function fetchWeatherForCity(city: string, apiKey: string): Promise<WeatherAlert | null> {
  const coords = cityCoordinates[city];
  if (!coords) {
    console.error(`Coordinates for city not found: ${city}`);
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for real-time data
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch weather for ${city}. Status: ${response.status}`, errorText);
      return null;
    }
    const data = await response.json();

    return {
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0]?.description?.toLowerCase() || 'N/A', // Use description for more detail
    };
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
    return null;
  }
}

const getWeatherForCitiesFlow = ai.defineFlow(
  {
    name: 'getWeatherForCitiesFlow',
    inputSchema: GetWeatherForCitiesInputSchema,
    outputSchema: GetWeatherForCitiesOutputSchema,
  },
  async (input) => {
    // Use Promise.all to wait for all weather fetches to complete.
    const weatherResults = await Promise.all(
      input.cities.map((city) => fetchWeatherForCity(city, input.apiKey))
    );
    
    // Filter out any null results from failed API calls
    const validWeatherData = weatherResults.filter(
      (data): data is WeatherAlert => data !== null
    );

    return { weather: validWeatherData };
  }
);


/**
 * The main exported function that retrieves weather for a list of cities.
 * This is the wrapper that the server action will call.
 */
export async function getWeatherForCities(input: GetWeatherForCitiesInput): Promise<GetWeatherForCitiesOutput> {
  return getWeather