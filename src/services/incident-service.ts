'use server';

import type { Incident } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// Define the shape of an incident once it's in our system
export type IncidentWithId = Incident & {
  id: string;
  addedAt: string; // ISO string for timestamp
};

// Define the path to the incident cache file
const incidentCachePath = path.resolve(process.cwd(), 'src/lib/incidents-cache.json');
const MAX_INCIDENTS = 10;

/**
 * Reads the current list of incidents from the cache file.
 * @returns A promise that resolves to an array of incidents.
 */
async function readIncidentCache(): Promise<IncidentWithId[]> {
  try {
    const data = await fs.readFile(incidentCachePath, 'utf-8');
    // If the file is empty or just whitespace, return an empty array
    if (!data.trim()) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, it's not an error, just an empty cache.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    // For other errors, log them.
    console.error('Error reading incident cache:', error);
    return [];
  }
}

/**
 * Writes a list of incidents to the cache file.
 * @param incidents - The array of incidents to write.
 */
async function writeIncidentCache(incidents: IncidentWithId[]): Promise<void> {
  try {
    await fs.writeFile(incidentCachePath, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to incident cache:', error);
  }
}

/**
 * Retrieves the current list of all incidents.
 * This is the primary function to be called from the UI actions.
 * @returns A promise that resolves to the current list of incidents.
 */
export async function getIncidents(): Promise<IncidentWithId[]> {
  return await readIncidentCache();
}

/**
 * Adds new incidents to our persistent store, manages the cap, and removes old ones.
 * @param newIncidents - An array of new incidents to add.
 */
export async function addIncidents(newIncidents: Incident[]): Promise<void> {
  if (!newIncidents || newIncidents.length === 0) {
    return;
  }

  let currentIncidents = await readIncidentCache();

  // Add new incidents with unique IDs and timestamps
  const incidentsToAdd: IncidentWithId[] = newIncidents.map((incident) => ({
    ...incident,
    // Create a simple unique ID. In a real app, use something like UUID.
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    addedAt: new Date().toISOString(),
  }));

  // Combine and sort incidents by time added (newest first)
  let allIncidents = [...currentIncidents, ...incidentsToAdd].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  // De-duplicate based on title and a close-enough lat/lon to avoid re-adding the same incident
   allIncidents = allIncidents.filter((incident, index, self) =>
    index === self.findIndex((t) => (
      t.title === incident.title && 
      Math.abs(t.latitude - incident.latitude) < 0.1 &&
      Math.abs(t.longitude - incident.longitude) < 0.1
    ))
  );

  // Enforce the cap by taking the most recent ones
  const updatedIncidents = allIncidents.slice(0, MAX_INCIDENTS);

  await writeIncidentCache(updatedIncidents);
}
