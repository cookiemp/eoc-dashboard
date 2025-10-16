import { geocodeEthiopianLocation } from '@/ai/flows/geocode-ethiopian-location-flow';
import { addFieldIncidents, type FieldIncident } from './field-incidents-service';

/**
 * KoBoToolbox Sync Service
 * 
 * Fetches emergency field reports from IFRC KoBoToolbox and converts them
 * into field incidents with AI-geocoded coordinates.
 */

const KOBO_SERVER = process.env.KOBO_SERVER || 'https://kobo.ifrc.org';
const KOBO_API_KEY = process.env.KOBO_API_KEY;
const KOBO_ASSET_UID = process.env.KOBO_ASSET_UID;

export type KoBoSubmission = {
  _id: number;
  _submission_time: string;
  _submitted_by: string;
  'context/emergency-selection': string;
  'context/date_of_reported': string;
  'context/prepared_by': string;
  'context/reporting_branch': string;
  'location/location_scope': 'region' | 'zone' | 'woreda' | 'kebele';
  'location/region-one'?: string;
  'location/zone-one'?: string;
  'location/woreda-one'?: string;
  'location/kebele'?: string;
  'location/woreda-multiple'?: string; // Comma-separated
  'location/zone-multiple'?: string; // Comma-separated
  'latest_info/info_primary-source': string;
  'branch_sitrep/reached_population/g_reach'?: number;
  'branch_sitrep/action_taken'?: string; // Space-separated values
  'branch_sitrep/action_taken_description'?: string;
};

export type KoBoSyncResult = {
  success: boolean;
  incidentsCreated: number;
  incidentsSkipped: number;
  errors: string[];
  lastSyncTime: string;
};

/**
 * Map KoBo emergency types to incident categories
 */
function mapEmergencyToCategory(emergency: string): FieldIncident['category'] {
  const lower = emergency.toLowerCase();
  
  if (lower.includes('flood')) return 'wash';
  if (lower.includes('drought')) return 'food_security';
  if (lower.includes('cholera') || lower.includes('measles') || lower.includes('malaria')) return 'health';
  if (lower.includes('conflict')) return 'security';
  if (lower.includes('displacement') || lower.includes('idp')) return 'displacement';
  
  return 'other';
}

/**
 * Determine severity based on people affected and emergency type
 */
function determineSeverity(peopleAffected?: number, emergency?: string): FieldIncident['severity'] {
  if (!peopleAffected || peopleAffected === 0) return 'medium';
  
  if (peopleAffected > 10000) return 'critical';
  if (peopleAffected > 5000) return 'high';
  if (peopleAffected > 1000) return 'medium';
  
  return 'low';
}

/**
 * Map incident color based on category
 */
function getCategoryColor(category: FieldIncident['category']): string {
  const colorMap: Record<FieldIncident['category'], string> = {
    health: '#e74c3c', // Red
    food_security: '#f39c12', // Orange
    displacement: '#9b59b6', // Purple
    wash: '#3498db', // Blue
    security: '#34495e', // Dark gray
    other: '#95a5a6', // Light gray
  };
  
  return colorMap[category];
}

/**
 * Fetch submissions from KoBoToolbox API
 */
async function fetchKoBoSubmissions(limit: number = 50): Promise<KoBoSubmission[]> {
  if (!KOBO_API_KEY || !KOBO_ASSET_UID) {
    throw new Error('KoBo API credentials not configured. Set KOBO_API_KEY and KOBO_ASSET_UID in environment variables.');
  }

  const url = `${KOBO_SERVER}/api/v2/assets/${KOBO_ASSET_UID}/data/?format=json&limit=${limit}`;
  
  console.log(`🔍 Fetching KoBo submissions from: ${KOBO_SERVER}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Token ${KOBO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`KoBo API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Convert KoBo submission to field incident with geocoding
 */
async function convertToFieldIncident(submission: KoBoSubmission): Promise<Omit<FieldIncident, 'id' | 'sourceType' | 'reportedAt' | 'status'> | null> {
  try {
    // Extract location data
    const locationScope = submission['location/location_scope'];
    const region = submission['location/region-one'];
    const zone = submission['location/zone-one'];
    const woreda = submission['location/woreda-one'];
    const kebele = submission['location/kebele'];

    // Skip if no location data
    if (!region) {
      console.warn(`⚠️ Skipping submission ${submission._id}: No region specified`);
      return null;
    }

    // Geocode the location using AI
    console.log(`🗺️ Geocoding: ${region} > ${zone || ''} > ${woreda || ''} > ${kebele || ''}`);
    
    const geocodeResult = await geocodeEthiopianLocation({
      region,
      zone,
      woreda,
      kebele,
      locationScope,
    });

    // Extract emergency details
    const emergencyName = submission['context/emergency-selection'] || 'Unknown Emergency';
    const category = mapEmergencyToCategory(emergencyName);
    const peopleReached = submission['branch_sitrep/reached_population/g_reach'];
    const severity = determineSeverity(peopleReached, emergencyName);
    
    // Build description
    const primaryInfo = submission['latest_info/info_primary-source'] || '';
    const actionDescription = submission['branch_sitrep/action_taken_description'] || '';
    
    const description = `**Emergency:** ${emergencyName}\n\n**Latest Update:**\n${primaryInfo}\n\n${actionDescription ? `**Response Actions:**\n${actionDescription}` : ''}${peopleReached ? `\n\n**People Reached:** ${peopleReached.toLocaleString()}` : ''}`;

    // Build title
    const title = `${emergencyName} - ${geocodeResult.locationName}`;

    return {
      title,
      description,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      color: getCategoryColor(category),
      category,
      severity,
      affectedPeople: peopleReached,
      locationName: geocodeResult.locationName,
      reportedBy: submission['context/prepared_by'] || submission._submitted_by || 'KoBo System',
      needsReview: geocodeResult.confidence === 'low', // Low confidence requires review
      confidence: geocodeResult.confidence === 'high' ? 0.9 : geocodeResult.confidence === 'medium' ? 0.7 : 0.5,
    };
  } catch (error) {
    console.error(`❌ Error converting submission ${submission._id}:`, error);
    return null;
  }
}

/**
 * Sync KoBo submissions to field incidents
 */
export async function syncKoBoToFieldIncidents(options: {
  limit?: number;
  autoApprove?: boolean;
} = {}): Promise<KoBoSyncResult> {
  const { limit = 20, autoApprove = false } = options;
  
  const result: KoBoSyncResult = {
    success: false,
    incidentsCreated: 0,
    incidentsSkipped: 0,
    errors: [],
    lastSyncTime: new Date().toISOString(),
  };

  try {
    console.log('🚀 Starting KoBo sync...');
    
    // Fetch submissions
    const submissions = await fetchKoBoSubmissions(limit);
    console.log(`📥 Retrieved ${submissions.length} submissions from KoBo`);

    if (submissions.length === 0) {
      result.success = true;
      return result;
    }

    // Convert submissions to incidents
    const incidents: Omit<FieldIncident, 'id' | 'sourceType' | 'reportedAt' | 'status'>[] = [];
    
    for (const submission of submissions) {
      const incident = await convertToFieldIncident(submission);
      
      if (incident) {
        incidents.push(incident);
      } else {
        result.incidentsSkipped++;
      }
    }

    // Save to database
    if (incidents.length > 0) {
      console.log(`💾 Saving ${incidents.length} incidents to database...`);
      
      const saveResult = await addFieldIncidents(incidents, autoApprove);
      
      if (saveResult.success) {
        result.incidentsCreated = saveResult.count;
        result.success = true;
        console.log(`✅ Successfully synced ${result.incidentsCreated} incidents from KoBo`);
      } else {
        result.errors.push(saveResult.error || 'Failed to save incidents');
      }
    } else {
      result.success = true;
      console.log('⚠️ No valid incidents to save');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('❌ KoBo sync failed:', error);
  }

  return result;
}

/**
 * Get sync status/health check
 */
export async function getKoBoSyncHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  submissionCount?: number;
  error?: string;
}> {
  if (!KOBO_API_KEY || !KOBO_ASSET_UID) {
    return {
      configured: false,
      reachable: false,
      error: 'KoBo API credentials not configured',
    };
  }

  try {
    const url = `${KOBO_SERVER}/api/v2/assets/${KOBO_ASSET_UID}/?format=json`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${KOBO_API_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        configured: true,
        reachable: false,
        error: `KoBo API returned ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      configured: true,
      reachable: true,
      submissionCount: data.deployment__submission_count || 0,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
