# KoBoToolbox Integration Guide

## Overview

The ERCS dashboard integrates with IFRC's KoBoToolbox to automatically sync emergency field reports and display them as incidents on the map.

## Features

- ✅ **Automatic Sync**: Field reports synced every 30 minutes via GitHub Actions
- ✅ **AI Geocoding**: Converts administrative locations (Region/Zone/Woreda/Kebele) to GPS coordinates using Gemini AI
- ✅ **Smart Categorization**: Auto-categorizes emergencies (health, food security, WASH, displacement, security)
- ✅ **Severity Detection**: Determines severity based on people affected
- ✅ **Admin Review**: Low-confidence geocoding results flagged for manual review
- ✅ **Rich Metadata**: Includes emergency type, people reached, response actions, and more

## Configuration

### 1. Get KoBo API Credentials

1. Log into https://kobo.ifrc.org
2. Go to **Account Settings** (click your username)
3. Scroll to **API Key** section
4. Copy your API token

### 2. Get Form Asset UID

The Asset UID is in the form URL:
```
https://kobo.ifrc.org/#/forms/[ASSET_UID]/summary
```

For the ERCS Field Report form: `aby6sxp4DyEiohs4XMn7Mu`

### 3. Set Environment Variables

Add to your `.env` file:

```bash
KOBO_SERVER=https://kobo.ifrc.org
KOBO_API_KEY=your_api_token_here
KOBO_ASSET_UID=aby6sxp4DyEiohs4XMn7Mu
```

### 4. Configure GitHub Secrets (for automated sync)

In your GitHub repository settings → Secrets and variables → Actions, add:

- `KOBO_API_KEY` - Your KoBo API token
- `KOBO_ASSET_UID` - The form asset UID (optional, defaults to ERCS form)
- `KOBO_SERVER` - KoBo server URL (optional, defaults to https://kobo.ifrc.org)

## Data Mapping

### Location Geocoding

KoBo submissions don't include GPS coordinates, so we use AI to geocode administrative locations:

| KoBo Field | Purpose |
|------------|---------|
| `location/region-one` | Main region (e.g., "Oromia") |
| `location/zone-one` | Zone within region (e.g., "West Shewa") |
| `location/woreda-one` | Woreda (district) name (e.g., "Bako Tibe") |
| `location/kebele` | Kebele (village) name |
| `location/location_scope` | Geographic scope (region/zone/woreda/kebele) |

The AI provides:
- Approximate lat/lon coordinates for the location
- Full location name for display
- Confidence level (high/medium/low)
- Reasoning for the coordinates

### Incident Categorization

| Emergency Type | Category | Color |
|---------------|----------|-------|
| Flood | `wash` | Blue |
| Drought | `food_security` | Orange |
| Cholera/Measles/Malaria | `health` | Red |
| Conflict | `security` | Dark Gray |
| Displacement/IDP | `displacement` | Purple |
| Other | `other` | Light Gray |

### Severity Levels

Based on people affected (`branch_sitrep/reached_population/g_reach`):

- **Critical**: > 10,000 people
- **High**: 5,001 - 10,000 people
- **Medium**: 1,001 - 5,000 people
- **Low**: 0 - 1,000 people

## Usage

### Manual Sync (Local Development)

```bash
npm run sync:kobo
```

### Automated Sync (Production)

The GitHub Actions workflow runs automatically every 30 minutes:
- `.github/workflows/kobo-sync.yml`

### Manual Trigger (GitHub Actions)

1. Go to your repository's **Actions** tab
2. Select **KoBo Sync** workflow
3. Click **Run workflow**

### View Synced Incidents

1. Go to `/admin` and login
2. Navigate to **Pending Review** to approve low-confidence geocoding
3. Go to **All Incidents** to see all KoBo-synced incidents
4. Approved incidents appear on the main dashboard map

## Incident Data Structure

Each synced KoBo submission becomes a field incident:

```typescript
{
  title: "EM-20250504-Wind storm-Oromia - West Shewa, Bako Tibe",
  description: "Emergency details, latest updates, and response actions",
  latitude: 9.1333,
  longitude: 37.0833,
  category: "other",
  severity: "critical",
  affectedPeople: 2954,
  locationName: "Bako Tibe Woreda, West Shewa Zone, Oromia Region",
  reportedBy: "Fikadu Wami Negera",
  needsReview: false, // true if AI confidence is low
  confidence: 0.9, // 0.5 (low), 0.7 (medium), 0.9 (high)
  sourceType: "field_report"
}
```

## Troubleshooting

### Check KoBo Connectivity

```bash
curl -H "Authorization: Token YOUR_API_KEY" \
  "https://kobo.ifrc.org/api/v2/assets/aby6sxp4DyEiohs4XMn7Mu/?format=json"
```

### Verify Environment Variables

```bash
echo $KOBO_API_KEY
echo $KOBO_ASSET_UID
```

### Check Sync Logs

GitHub Actions logs are available in the **Actions** tab of your repository.

### Common Issues

1. **"KoBo not configured"**: Set `KOBO_API_KEY` and `KOBO_ASSET_UID` environment variables
2. **"Cannot reach KoBo server"**: Check your API token and network connection
3. **"No incidents created"**: Check that the KoBo form has submissions
4. **Low confidence geocoding**: Admin review required - check `/admin/pending`

## API Reference

### `syncKoBoToFieldIncidents(options)`

Syncs KoBo submissions to field incidents.

**Options:**
- `limit` (number): Max submissions to fetch (default: 20)
- `autoApprove` (boolean): Skip review for low-confidence (default: false)

**Returns:** `KoBoSyncResult`

```typescript
{
  success: boolean;
  incidentsCreated: number;
  incidentsSkipped: number;
  errors: string[];
  lastSyncTime: string;
}
```

### `getKoBoSyncHealth()`

Checks KoBo API connectivity.

**Returns:**
```typescript
{
  configured: boolean;
  reachable: boolean;
  submissionCount?: number;
  error?: string;
}
```

### `geocodeEthiopianLocation(input)`

Geocodes Ethiopian administrative locations using AI.

**Input:**
```typescript
{
  region?: string;
  zone?: string;
  woreda?: string;
  kebele?: string;
  locationScope?: 'region' | 'zone' | 'woreda' | 'kebele';
}
```

**Output:**
```typescript
{
  latitude: number;
  longitude: number;
  locationName: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}
```

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review Firestore `field_incidents` collection
3. Test manually with `npm run sync:kobo`
4. Contact your system administrator
