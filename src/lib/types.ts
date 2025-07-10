export type WeatherAlert = {
  city: string;
  temperature: number;
  condition: 'Sunny' | 'Rainy' | 'Stormy' | 'Windy';
};

export type NewsArticle = {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
};

export type HealthAlert = {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  region: string;
};

export type Incident = {
  id: number;
  title: string;
  description?: string;
  top: string;
  left: string;
  color: string;
};
