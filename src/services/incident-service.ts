'use server';

import type { Incident } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// Define the shape of an incident once it's in our system
export type IncidentWithId = Incident & {
  id: string;
  addedAt: string; // ISO string for timestamp
};

// Define the path to the incident cache file (fallback)
const incidentCachePath = path.resolve(process.cwd(), 'src/lib/incidents-cache.json');
const MAX_INCIDENTS = 10;

// Import Firebase utilities
import { getFirestore } from '@/lib/firebase-admin';

console.log('Using Firestore for incident storage');

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
  const firestore = await getFirestore();
  if (firestore) {
    try {
      const incidentsCol = firestore.collection('incidents');
      const snapshot = await incidentsCol.orderBy('addedAt', 'desc').limit(MAX_INCIDENTS).get();
      return snapshot.docs.map((doc) => doc.data() as IncidentWithId);
    } catch (error) {
      console.error('Error fetching from Firestore, falling back to file cache', error);
      return await readIncidentCache(); // Fallback on error
    }
  } else {
    return await readIncidentCache();
  }
}

/**
 * Adds new incidents to our persistent store, manages the cap, and removes old ones.
 * @param newIncidents - An array of new incidents to add.
 */
export async function addIncidents(newIncidents: Incident[]): Promise<void> {
  if (!newIncidents || newIncidents.length === 0) {
    return;
  }

  const firestore = await getFirestore();
  if (firestore) {
    try {
      const incidentsCol = firestore.collection('incidents');
      const batch = firestore.batch();

      // Simple deduplication by checking for existing titles
      for (const incident of newIncidents) {
        const querySnapshot = await incidentsCol.where('title', '==', incident.title).limit(1).get();
        if (querySnapshot.empty) {
          const docRef = incidentsCol.doc(); // Auto-generate ID
          batch.set(docRef, {
            ...incident,
            id: docRef.id,
            addedAt: new Date().toISOString(),
          });
        }
      }
      await batch.commit();

      // After adding, enforce the MAX_INCIDENTS limit
      const snapshot = await incidentsCol.orderBy('addedAt', 'desc').get();
      if (snapshot.size > MAX_INCIDENTS) {
        const deleteBatch = firestore.batch();
        snapshot.docs.slice(MAX_INCIDENTS).forEach((doc) => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
      }
    } catch (error) {
      console.error('Error writing to Firestore, falling back to file cache', error);
      await addIncidentsToFile(newIncidents); // Fallback on error
    }
  } else {
    await addIncidentsToFile(newIncidents);
  }
}

// Extracted file-based logic to its own function for clarity
async function addIncidentsToFile(newIncidents: Incident[]): Promise<void> {
  const currentIncidents = await readIncidentCache();

  const incidentsToAdd: IncidentWithId[] = newIncidents.map((incident) => ({
    ...incident,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    addedAt: new Date().toISOString(),
  }));

  const allIncidents = [...currentIncidents, ...incidentsToAdd];

  const uniqueIncidents = allIncidents.filter((incident, index, self) =>
    index === self.findIndex((t) => t.title === incident.title)
  );

  const sortedIncidents = uniqueIncidents.sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  const updatedIncidents = sortedIncidents.slice(0, MAX_INCIDENTS);

  await writeIncidentCache(updatedIncidents);
}
