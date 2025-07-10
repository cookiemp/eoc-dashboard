'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { weatherAlerts } from '@/lib/mock-data';
import { Sun, CloudRain, CloudLightning, Wind } from 'lucide-react';

const conditionIcons: { [key: string]: React.ReactNode } = {
  Sunny: <Sun className="h-6 w-6 text-yellow-500" />,
  Rainy: <CloudRain className="h-6 w-6 text-blue-500" />,
  Stormy: <CloudLightning className="h-6 w-6 text-gray-600" />,
  Windy: <Wind className="h-6 w-6 text-gray-500" />,
};

const WeatherAlerts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {weatherAlerts.map((alert) => (
            <div key={alert.city} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-4">
                {conditionIcons[alert.condition]}
                <p className="font-semibold">{alert.city}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{alert.temperature}°C</p>
                <p className="text-sm text-muted-foreground">{alert.condition}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
