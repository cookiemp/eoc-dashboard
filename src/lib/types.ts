export type NewsArticle = {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
};

export type WeatherAlert = {
  city: string;
  temperature: number;
  condition: string;
};

export type HealthAlert = {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  region: string;
  details: string;
  link: string;
};

export type Incident = {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  color: string;
};
