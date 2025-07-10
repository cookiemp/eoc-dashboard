'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, CloudRain, CloudLightning, Wind, Cloud, Loader2 } from 'lucide-react';
import { getWeatherForCities } from '@/ai/flows/get-weather-flow';
import type { WeatherAlert } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const conditionIcons: { [key: string]: React.ReactNode } = {
  Sunny: <Sun className="h-6 w-6 text-yellow-500" />,
  Rainy: <CloudRain className="h-6 w-6 text-blue-500" />,
  Stormy: <CloudLightning className="h-6 w-6 text-gray-600" />,
  Windy: <Wind className="h-6 w-6 text-gray-500" />,
  Cloudy: <Cloud className="h-6 w-6 text-gray-400" />,
  'Partly Cloudy': <Cloud className="h-6 w-6 text-gray-400" />,
};

const citiesToFetch = ['Addis Ababa', 'Dire Dawa', 'Gondar', 'Mekelle', 'Hawassa'];

const WeatherAlerts = () => {
  const [weatherData, setWeatherData] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const result = await getWeatherForCities({ cities: citiesToFetch });
        // The flow now returns an object with a 'weather' property
        if (result.weather) {
          setWeatherData(result.weather);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Optionally, set an error state to display to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const renderLoadingSkeleton = () => {
    return (
      <div className="flex flex-col gap-4">
        {citiesToFetch.map((city) => (
          <div key={city} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sun className="h-5 w-5" />}
          Weather Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderLoadingSkeleton()
        ) : (
          <div className="flex flex-col gap-4">
            {weatherData.map((alert) => (
              <div key={alert.city} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-4">
                  {conditionIcons[alert.condition] || <Cloud className="h-6 w-6 text-gray-400" />}
                  <p className="font-semibold">{alert.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{alert.temperature}°C</p>
                  <p className="text-sm text-muted-foreground">{alert.condition}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
