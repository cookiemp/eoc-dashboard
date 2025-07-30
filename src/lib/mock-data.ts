import type { WeatherAlert, NewsArticle, HealthAlert, Incident } from '@/lib/types';

export const weatherAlerts: WeatherAlert[] = [
  { city: 'Addis Ababa', temperature: 22, condition: 'Sunny' },
  { city: 'Dire Dawa', temperature: 28, condition: 'Windy' },
  { city: 'Gondar', temperature: 18, condition: 'Rainy' },
  { city: 'Mekelle', temperature: 25, condition: 'Stormy' },
];

export const humanitarianNews: NewsArticle[] = [
  { id: 'hn1', title: 'Food Aid Distribution Begins in Tigray Region', source: 'ReliefWeb', snippet: 'International aid agencies have started distributing...', url: 'https://reliefweb.int/report/ethiopia/food-aid-distribution-begins-tigray-region' },
  { id: 'hn2', title: 'Water Shortage Crisis Worsens in Somali Region', source: 'UN OCHA', snippet: 'Urgent action is needed as drought conditions persist...', url: 'https://www.unocha.org/ethiopia' },
  { id: 'hn3', title: 'Displacement Camp in Amhara Receives Medical Supplies', source: 'WHO', snippet: 'Essential medical supplies were delivered to...', url: 'https://www.who.int/countries/eth/' },
  { id: 'hn4', title: 'Urgent Appeal for Nutrition Support in Afar', source: 'UNICEF', snippet: 'Malnutrition rates among children are rising alarmingly...', url: 'https://www.unicef.org/ethiopia/' },
  { id: 'hn5', title: 'Flooding Displaces Thousands in Gambela Region', source: 'IOM', snippet: 'Heavy rains have led to widespread flooding, forcing families to flee...', url: 'https://ethiopia.iom.int/' },
];

export const generalNews: NewsArticle[] = [
  { id: 'gn1', title: 'Ethiopian Airlines Expands to New Asian Destinations', source: 'Ethiopian News Agency', snippet: 'The national carrier announced new flight routes...', url: 'https://www.ena.et' },
  { id: 'gn2', title: 'New Infrastructure Projects Launched in Oromia', source: 'Fana Broadcasting', snippet: 'The regional government has kicked off several...', url: 'https://www.fanabc.com/english/' },
  { id: 'gn3', title: 'Cultural Festival Celebrated in Awassa', source: 'Addis Standard', snippet: 'The annual festival of cultures brought together...', url: 'https://addisstandard.com/' },
];

export const healthAlerts: HealthAlert[] = [
  { id: 'ha1', title: 'Cholera Outbreak', severity: 'High', region: 'Gambela', details: 'A significant cholera outbreak has been reported in the Gambela region, with cases rising daily. Health officials are implementing emergency water purification measures and have established treatment centers. Residents are advised to boil all drinking water.', link: 'https://www.who.int/news-room/fact-sheets/detail/cholera' },
  { id: 'ha2', title: 'Malaria Season Warning', severity: 'Medium', region: 'Benishangul-Gumuz', details: 'The onset of the rainy season has increased the risk of malaria in Benishangul-Gumuz. Distribution of insecticide-treated bed nets is underway. Prophylactic medications are recommended for vulnerable groups.', link: 'https://www.who.int/news-room/fact-sheets/detail/malaria' },
  { id: 'ha3', title: 'Measles Vaccination Campaign', severity: 'Low', region: 'SNNPR', details: 'A preventative measles vaccination campaign is being launched across the Southern Nations, Nationalities, and Peoples\' Region (SNNPR) to boost immunity and prevent potential outbreaks. All children under 5 are eligible.', link: 'https://www.who.int/news-room/fact-sheets/detail/measles' },
];

export const incidents: Incident[] = [
  { title: 'Flood Warning', description: 'Heavy rainfall has led to severe flooding in the Afar region. Major rivers have overflowed their banks, displacing thousands of families and disrupting agricultural activities. Emergency response teams are on site.', latitude: 11.83, longitude: 41.0, color: '#3b82f6' }, // Afar Region
  { title: 'Health Emergency', description: 'A significant health emergency has been declared in the Somali region due to a fast-spreading disease. Mobile clinics have been dispatched, but more medical supplies and personnel are urgently needed.', latitude: 6.5, longitude: 43.5, color: '#ef4444' }, // Somali Region
  { title: 'Conflict Zone', description: 'Reports of localized conflict in the northern Tigray region have been confirmed. Humanitarian access is currently restricted, raising concerns for the safety and well-being of the civilian population.', latitude: 13.5, longitude: 39.5, color: '#f59e0b' }, // Tigray Region
  { title: 'Displacement Camp', description: 'A new displacement camp has been established near the capital to shelter families fleeing from drought-affected areas. The camp is in need of clean water, food, and sanitation facilities.', latitude: 9.03, longitude: 38.74, color: '#22c55e' }, // Addis Ababa
];
