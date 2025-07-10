import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { weatherAlerts } from '@/lib/mock-data';
import { Sun, CloudRain, CloudLightning, Wind, Thermometer } from 'lucide-react';

const conditionIcons = {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weatherAlerts.map((alert) => (
            <div key={alert.city} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
              <div className="p-2 bg-background rounded-md shadow-inner">
                {conditionIcons[alert.condition]}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{alert.city}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Thermometer className="h-4 w-4" />
                  <span>{alert.temperature}°C</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherAlerts;
