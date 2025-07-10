import type { WeatherAlert, NewsArticle, HealthAlert, Incident } from '@/lib/types';

export const weatherAlerts: WeatherAlert[] = [
  { city: 'Addis Ababa', temperature: 22, condition: 'Sunny' },
  { city: 'Dire Dawa', temperature: 28, condition: 'Windy' },
  { city: 'Gondar', temperature: 18, condition: 'Rainy' },
  { city: 'Mekelle', temperature: 25, condition: 'Stormy' },
];

export const humanitarianNews: NewsArticle[] = [
  { id: 'hn1', title: 'Food Aid Distribution Begins in Tigray Region', source: 'ReliefWeb', snippet: 'International aid agencies have started distributing...', url: '#' },
  { id: 'hn2', title: 'Water Shortage Crisis Worsens in Somali Region', source: 'UN OCHA', snippet: 'Urgent action is needed as drought conditions persist...', url: '#' },
  { id: 'hn3', title: 'Displacement Camp in Amhara Receives Medical Supplies', source: 'WHO', snippet: 'Essential medical supplies were delivered to...', url: '#' },
];

export const generalNews: NewsArticle[] = [
  { id: 'gn1', title: 'Ethiopian Airlines Expands to New Asian Destinations', source: 'Ethiopian News Agency', snippet: 'The national carrier announced new flight routes...', url: '#' },
  { id: 'gn2', title: 'New Infrastructure Projects Launched in Oromia', source: 'Fana Broadcasting', snippet: 'The regional government has kicked off several...', url: '#' },
  { id: 'gn3', title: 'Cultural Festival Celebrated in Awassa', source: 'Addis Standard', snippet: 'The annual festival of cultures brought together...', url: '#' },
];

export const healthAlerts: HealthAlert[] = [
  { id: 'ha1', title: 'Cholera Outbreak', severity: 'High', region: 'Gambela' },
  { id: 'ha2', title: 'Malaria Season Warning', severity: 'Medium', region: 'Benishangul-Gumuz' },
  { id: 'ha3', title: 'Measles Vaccination Campaign', severity: 'Low', region: 'SNNPR' },
];

export const incidents: Incident[] = [
  { id: 1, title: 'Flood Warning', top: '48%', left: '52%', color: 'bg-blue-500' },
  { id: 2, title: 'Health Emergency', top: '65%', left: '80%', color: 'bg-red-500' },
  { id: 3, title: 'Conflict Zone', top: '25%', left: '60%', color: 'bg-yellow-500' },
  { id: 4, title: 'Displacement Camp', top: '70%', left: '45%', color: 'bg-green-500' },
];
