'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, CloudRain, CloudLightning, Wind, Cloud, Loader2, AlertCircle } from 'lucide-react';
import type { WeatherAlert } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

const conditionIcons: { [key: string]: React.ReactNode } = {
  'clear sky': <Sun className="h-6 w-6 text-yellow-500" />,
  'few clouds': <Cloud className="h-6 w-6 text-gray-400" />,
  'scattered clouds': <Cloud className="h-6 w-6 text-gray-400" />,
  'broken clouds': <Cloud className="h-6 w-6 text-gray-400" />,
  'overcast clouds': <Cloud className="h-6 w-6 text-gray-500" />,
  'shower rain': <CloudRain className="h-6 w-6 text-blue-400" />,
  rain: <CloudRain className="h-6 w-6 text-blue-500" />,
  thunderstorm: <CloudLightning className="h-6 w-6 text-gray-600" />,
  snow: <CloudRain className="h-6 w-6 text-blue-200" />, // Placeholder
  mist: <Wind className="h-6 w-6 text-gray-400" />,
  clouds: <Cloud className="h-6 w-6 text-gray-400" />,
  sunny: <Sun className="h-6 w-6 text-yellow-500" />,
  windy: <Wind className="h-6 w-6 text-gray-400" />,
  stormy: <CloudLightning className="h-6 w-6 text-gray-600" />,
};

const citiesToFetch = ['Addis Ababa', 'Dire Dawa', 'Gondar', 'Mekelle', 'Hawassa'];

interface WeatherAlertsProps {
  weatherData: WeatherAlert[];
  isLoading: boolean;
}

const WeatherAlerts = ({ weatherData, isLoading }: WeatherAlertsProps) => {

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
  
  const renderContent = () => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }
    
    if (weatherData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-secondary rounded-lg">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Could not load weather data.</p>
          <p className="text-xs text-muted-foreground mt-1">Please ensure your API key is correct.</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-4">
        {weatherData.map((alert) => (
          <div key={alert.city} className="flex items-center justify-between p-3 bg-secondary rounded-lg animate-in fade-in-50">
            <div className="flex items-center gap-4">
              {conditionIcons[alert.condition] || <Cloud className="h-6 w-6 text-gray-400" />}
              <p className="font-semibold">{alert.city}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{Math.round(alert.temperature)}°C</p>
              <p className="text-sm text-muted-foreground capitalize">{alert.condition}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sun className="h-5 w-5" />}
          Weather Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
