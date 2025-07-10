'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-incident-data.ts';
import '@/ai/flows/get-weather-flow.ts';
import '@/ai/flows/extract-incidents-from-news-flow.ts';
import '@/ai/flows/get-news-articles-flow.ts';
import '@/ai/flows/generate-incident-dossier-flow.ts';
