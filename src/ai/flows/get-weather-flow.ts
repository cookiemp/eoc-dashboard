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
});
export type GetWeatherForCitiesInput = z.infer<typeof GetWeatherForCitiesInputSchema>;

const GetWeatherForCitiesOutputSchema = z.object({
  weather: z.array(WeatherSchema),
});
export type GetWeatherForCitiesOutput = z.infer<typeof GetWeatherForCitiesOutputSchema>;

/**
 * Fetches the current weather for a single city using the OpenWeatherMap API.
 * @param city The name of the city.
 * @returns A promise that resolves to a WeatherAlert object.
 */
async function fetchWeatherForCity(city: string): Promise<WeatherAlert> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key is not configured in .env file.');
  }

  const coords = cityCoordinates[city];
  if (!coords) {
    throw new Error(`Coordinates for city not found: ${city}`);
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather for ${city}. Status: ${response.status}`);
    }
    const data = await response.json();

    return {
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0]?.description || 'N/A',
    };
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error);
    // Return a default/error state
    return {
      city: city,
      temperature: NaN,
      condition: 'Error',
    };
  }
}

/**
 * The main exported function that retrieves weather for a list of cities.
 * This function does not use an AI model, it directly calls a real API.
 */
export async function getWeatherForCities(
  input: GetWeatherForCitiesInput
): Promise<GetWeatherForCitiesOutput> {
  
  const weatherPromises = input.cities.map((city) =>
    fetchWeatherForCity(city)
  );

  const weatherData = await Promise.all(weatherPromises);

  return { weather: weatherData };
}
