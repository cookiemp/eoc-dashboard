# MongoDB Migration Guide

Detailed guide for migrating from Firebase Firestore to MongoDB, including all code changes required.

---

## Table of Contents

1. [Data Import Script](#data-import-script)
2. [MongoDB Adapter](#mongodb-adapter)
3. [Service File Updates](#service-file-updates)
4. [Testing Migration](#testing-migration)
5. [Rollback Plan](#rollback-plan)

---

## Data Import Script

### Create Import Script

```bash
cd ~
nano import-firestore-to-mongodb.js
```

**Paste the following**:

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://ercs_app:your-secure-app-password@localhost:27017/ercs_dashboard';
const BACKUP_DIR = './firestore-backup';

// Collections to import
const COLLECTIONS = [
  'crawled_articles',
  'field_incidents',
  'incidents',
  'crawler_runs',
  'crawler_metadata',
  'dashboard_cache',
  'pdf_uploads'
];

async function importData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ercs_dashboard');
    
    for (const collectionName of COLLECTIONS) {
      console.log(`\n📦 Processing ${collectionName}...`);
      
      const collectionPath = path.join(BACKUP_DIR, collectionName);
      
      if (!fs.existsSync(collectionPath)) {
        console.log(`⚠️  Collection ${collectionName} not found, skipping...`);
        continue;
      }
      
      const files = fs.readdirSync(collectionPath).filter(f => f.endsWith('.json'));
      const collection = db.collection(collectionName);
      
      let imported = 0;
      let skipped = 0;
      
      for (const file of files) {
        try {
          const filePath = path.join(collectionPath, file);
          const rawData = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(rawData);
          
          // Process Firestore-specific data types
          const processedData = processFirestoreDocument(data);
          
          // Check if document already exists
          const existingDoc = await collection.findOne({ id: processedData.id });
          
          if (existingDoc) {
            skipped++;
            continue;
          }
          
          await collection.insertOne(processedData);
          imported++;
          
        } catch (error) {
          console.error(`  ❌ Error importing ${file}:`, error.message);
        }
      }
      
      console.log(`  ✅ Imported: ${imported}, Skipped: ${skipped}`);
      
      // Create indexes
      await createIndexes(collection, collectionName);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

function processFirestoreDocument(data) {
  // Recursively process all fields
  for (const key in data) {
    if (data[key] && typeof data[key] === 'object') {
      // Handle Firestore Timestamp
      if (data[key]._seconds !== undefined) {
        data[key] = new Date(data[key]._seconds * 1000);
      }
      // Handle Firestore GeoPoint
      else if (data[key]._latitude !== undefined && data[key]._longitude !== undefined) {
        data[key] = {
          type: 'Point',
          coordinates: [data[key]._longitude, data[key]._latitude]
        };
      }
      // Recursively process nested objects
      else if (!Array.isArray(data[key])) {
        data[key] = processFirestoreDocument(data[key]);
      }
      // Process arrays
      else {
        data[key] = data[key].map(item => 
          typeof item === 'object' ? processFirestoreDocument(item) : item
        );
      }
    }
  }
  return data;
}

async function createIndexes(collection, collectionName) {
  console.log(`  🔧 Creating indexes for ${collectionName}...`);
  
  try {
    switch (collectionName) {
      case 'crawled_articles':
        await collection.createIndex({ isActive: 1, crawledAt: -1 });
        await collection.createIndex({ source: 1, isActive: 1 });
        await collection.createIndex({ crawledAt: -1 });
        break;
        
      case 'field_incidents':
        await collection.createIndex({ status: 1, reportedAt: -1 });
        await collection.createIndex({ needsReview: 1, status: 1 });
        await collection.createIndex({ koboSubmissionId: 1 }, { unique: true, sparse: true });
        break;
        
      case 'incidents':
        await collection.createIndex({ addedAt: -1 });
        await collection.createIndex({ title: 1 });
        break;
        
      case 'crawler_runs':
        await collection.createIndex({ timestamp: -1 });
        break;
        
      case 'pdf_uploads':
        await collection.createIndex({ uploadedAt: -1 });
        await collection.createIndex({ status: 1 });
        break;
    }
    console.log(`  ✅ Indexes created`);
  } catch (error) {
    console.log(`  ⚠️  Index creation warning:`, error.message);
  }
}

// Run import
importData().catch(console.error);
```

### Run Import

```bash
# Extract backup
tar -xzf firestore-backup.tar.gz

# Install MongoDB driver
npm install mongodb

# Run import
node import-firestore-to-mongodb.js
```

---

## MongoDB Adapter

### Create MongoDB Connection Module

```bash
cd /var/www/eoc-dashboard
nano src/lib/mongodb.ts
```

**Paste the following**:

```typescript
import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ercs_dashboard';
const DB_NAME = 'ercs_dashboard';

export async function connectToDatabase(): Promise<Db> {
  // Return existing connection if available
  if (db) {
    return db;
  }

  // Return existing connection promise if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create new connection
  connectionPromise = (async () => {
    try {
      console.log('🔄 Connecting to MongoDB...');
      
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await client.connect();
      db = client.db(DB_NAME);
      
      console.log('✅ Connected to MongoDB');
      return db;
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    return await connectToDatabase();
  }
  return db;
}

export async function getCollection<T = any>(name: string): Promise<Collection<T>> {
  const database = await getDatabase();
  return database.collection<T>(name);
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectionPromise = null;
    console.log('🔌 MongoDB connection closed');
  }
}

// Export helper to check if MongoDB is available
export const isMongoDBAvailable = () => db !== null;

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
  });
}
```

### Update package.json

```bash
nano package.json
```

Add MongoDB driver to dependencies:

```json
{
  "dependencies": {
    "mongodb": "^6.3.0",
    // ... existing dependencies
  }
}
```

Install:

```bash
npm install mongodb
```

---

## Service File Updates

### 1. Field Incidents Service

```bash
nano src/services/field-incidents-service.ts
```

**Replace the entire file**:

```typescript
'use server';

import { getCollection } from '@/lib/mongodb';
import type { FieldIncident } from '@/lib/types';

const COLLECTION_NAME = 'field_incidents';
const MAX_INCIDENTS = 100;

export async function getActiveFieldIncidents(): Promise<FieldIncident[]> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    const incidents = await collection
      .find({ status: 'active' })
      .sort({ reportedAt: -1 })
      .limit(MAX_INCIDENTS)
      .toArray();
    
    return incidents;
  } catch (error) {
    console.error('Error fetching field incidents:', error);
    return [];
  }
}

export async function getFieldIncidentsNeedingReview(): Promise<FieldIncident[]> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    const incidents = await collection
      .find({ 
        needsReview: true, 
        status: 'active' 
      })
      .sort({ reportedAt: -1 })
      .limit(MAX_INCIDENTS)
      .toArray();
    
    return incidents;
  } catch (error) {
    console.error('Error fetching incidents needing review:', error);
    return [];
  }
}

export async function addFieldIncidents(incidents: Partial<FieldIncident>[]): Promise<void> {
  if (!incidents || incidents.length === 0) return;

  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    const timestamp = new Date().toISOString();
    
    const documentsToInsert: FieldIncident[] = [];
    
    for (const incident of incidents) {
      // Check for duplicates if from KoBo
      if (incident.koboSubmissionId) {
        const existing = await collection.findOne({ 
          koboSubmissionId: incident.koboSubmissionId 
        });
        
        if (existing) {
          console.log(`Skipping duplicate KoBo submission: ${incident.koboSubmissionId}`);
          continue;
        }
      }
      
      documentsToInsert.push({
        ...incident,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        addedAt: timestamp,
      } as FieldIncident);
    }
    
    if (documentsToInsert.length > 0) {
      await collection.insertMany(documentsToInsert);
      console.log(`✅ Added ${documentsToInsert.length} field incidents`);
    }
    
  } catch (error) {
    console.error('Error adding field incidents:', error);
    throw error;
  }
}

export async function markIncidentAsReviewed(incidentId: string): Promise<void> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    await collection.updateOne(
      { id: incidentId },
      { $set: { needsReview: false } }
    );
    
    console.log(`✅ Marked incident ${incidentId} as reviewed`);
  } catch (error) {
    console.error('Error marking incident as reviewed:', error);
    throw error;
  }
}

export async function updateFieldIncident(
  incidentId: string, 
  updates: Partial<FieldIncident>
): Promise<void> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    await collection.updateOne(
      { id: incidentId },
      { $set: updates }
    );
    
    console.log(`✅ Updated incident ${incidentId}`);
  } catch (error) {
    console.error('Error updating incident:', error);
    throw error;
  }
}

export async function archiveFieldIncident(incidentId: string): Promise<void> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    await collection.updateOne(
      { id: incidentId },
      { $set: { status: 'archived' } }
    );
    
    console.log(`✅ Archived incident ${incidentId}`);
  } catch (error) {
    console.error('Error archiving incident:', error);
    throw error;
  }
}

export async function deleteFieldIncident(incidentId: string): Promise<void> {
  try {
    const collection = await getCollection<FieldIncident>(COLLECTION_NAME);
    
    await collection.deleteOne({ id: incidentId });
    
    console.log(`✅ Deleted incident ${incidentId}`);
  } catch (error) {
    console.error('Error deleting incident:', error);
    throw error;
  }
}
```

### 2. Incident Service

```bash
nano src/services/incident-service.ts
```

**Replace the entire file**:

```typescript
'use server';

import { getCollection } from '@/lib/mongodb';
import type { IncidentWithId } from '@/lib/types';

const COLLECTION_NAME = 'incidents';
const MAX_INCIDENTS = 100;

export async function getIncidents(): Promise<IncidentWithId[]> {
  try {
    const collection = await getCollection<IncidentWithId>(COLLECTION_NAME);
    
    const incidents = await collection
      .find({})
      .sort({ addedAt: -1 })
      .limit(MAX_INCIDENTS)
      .toArray();
    
    return incidents;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return [];
  }
}

export async function addIncidents(incidents: Omit<IncidentWithId, 'id' | 'addedAt'>[]): Promise<void> {
  if (!incidents || incidents.length === 0) return;

  try {
    const collection = await getCollection<IncidentWithId>(COLLECTION_NAME);
    const timestamp = new Date().toISOString();
    
    // Simple deduplication by title
    const existingTitles = await collection
      .find({}, { projection: { title: 1 } })
      .toArray();
    
    const existingTitleSet = new Set(existingTitles.map(doc => doc.title));
    
    const newIncidents = incidents
      .filter(incident => !existingTitleSet.has(incident.title))
      .map(incident => ({
        ...incident,
        id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: timestamp,
      }));
    
    if (newIncidents.length > 0) {
      await collection.insertMany(newIncidents);
      console.log(`✅ Added ${newIncidents.length} new incidents`);
    } else {
      console.log('No new incidents to add (all duplicates)');
    }
    
  } catch (error) {
    console.error('Error adding incidents:', error);
    throw error;
  }
}
```

### 3. Dashboard Cache Service

```bash
nano src/services/dashboard-cache-service.ts
```

**Replace the entire file**:

```typescript
'use server';

import { getCollection } from '@/lib/mongodb';

const COLLECTION_NAME = 'dashboard_cache';
const CACHE_DOC_ID = 'current_data';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface DashboardCacheData {
  _id?: string;
  id: string;
  summary: string;
  incidents: any[];
  fieldIncidents: any[];
  cachedAt: string;
  expiresAt: string;
}

export async function getCachedDashboardData(): Promise<DashboardCacheData | null> {
  try {
    const collection = await getCollection<DashboardCacheData>(COLLECTION_NAME);
    
    const cacheDoc = await collection.findOne({ id: CACHE_DOC_ID });
    
    if (!cacheDoc) {
      console.log('No cache found');
      return null;
    }
    
    const now = new Date();
    const expiresAt = new Date(cacheDoc.expiresAt);
    
    if (now > expiresAt) {
      console.log('Cache expired');
      await collection.deleteOne({ id: CACHE_DOC_ID });
      return null;
    }
    
    console.log('✅ Cache hit');
    return cacheDoc;
    
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

export async function setCachedDashboardData(data: Omit<DashboardCacheData, 'id' | 'cachedAt' | 'expiresAt'>): Promise<void> {
  try {
    const collection = await getCollection<DashboardCacheData>(COLLECTION_NAME);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);
    
    const cacheData: DashboardCacheData = {
      ...data,
      id: CACHE_DOC_ID,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    await collection.replaceOne(
      { id: CACHE_DOC_ID },
      cacheData,
      { upsert: true }
    );
    
    console.log('✅ Cache updated');
    
  } catch (error) {
    console.error('Error writing cache:', error);
    throw error;
  }
}

export async function clearDashboardCache(): Promise<void> {
  try {
    const collection = await getCollection<DashboardCacheData>(COLLECTION_NAME);
    
    await collection.deleteOne({ id: CACHE_DOC_ID });
    
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
```

### 4. News Service

```bash
nano src/services/news-service.ts
```

**Create new file** (simplified version):

```typescript
'use server';

import { getCollection } from '@/lib/mongodb';
import type { NewsArticle } from '@/lib/types';

const COLLECTION_NAME = 'crawled_articles';

export async function getCrawledNews(limit: number = 20): Promise<NewsArticle[]> {
  try {
    const collection = await getCollection<NewsArticle>(COLLECTION_NAME);
    
    const articles = await collection
      .find({ isActive: true })
      .sort({ crawledAt: -1 })
      .limit(limit)
      .toArray();
    
    return articles;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export async function getNewsBySource(source: string, limit: number = 20): Promise<NewsArticle[]> {
  try {
    const collection = await getCollection<NewsArticle>(COLLECTION_NAME);
    
    const articles = await collection
      .find({ 
        source: source,
        isActive: true 
      })
      .sort({ crawledAt: -1 })
      .limit(limit)
      .toArray();
    
    return articles;
  } catch (error) {
    console.error(`Error fetching ${source} news:`, error);
    return [];
  }
}
```

### 5. PDF Uploads Service

```bash
nano src/services/pdf-uploads-service.ts
```

**Update the service**:

```typescript
'use server';

import { getCollection } from '@/lib/mongodb';

const COLLECTION_NAME = 'pdf_uploads';

export interface PDFUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'pending' | 'processed' | 'failed';
  extractedText?: string;
  incidents?: any[];
  error?: string;
}

export async function savePDFUpload(upload: Omit<PDFUpload, 'id'>): Promise<string> {
  try {
    const collection = await getCollection<PDFUpload>(COLLECTION_NAME);
    
    const doc: PDFUpload = {
      ...upload,
      id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    await collection.insertOne(doc);
    
    console.log(`✅ Saved PDF upload: ${doc.id}`);
    return doc.id;
    
  } catch (error) {
    console.error('Error saving PDF upload:', error);
    throw error;
  }
}

export async function getPDFUploads(limit: number = 50): Promise<PDFUpload[]> {
  try {
    const collection = await getCollection<PDFUpload>(COLLECTION_NAME);
    
    const uploads = await collection
      .find({})
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .toArray();
    
    return uploads;
  } catch (error) {
    console.error('Error fetching PDF uploads:', error);
    return [];
  }
}
```

---

## Testing Migration

### Create Test Script

```bash
nano test-mongodb-connection.js
```

```javascript
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://ercs_app:your-password@localhost:27017/ercs_dashboard';

async function testConnection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ercs_dashboard');
    
    // Test each collection
    const collections = [
      'crawled_articles',
      'field_incidents',
      'incidents',
      'dashboard_cache'
    ];
    
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      console.log(`  ${collName}: ${count} documents`);
    }
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

testConnection();
```

```bash
node test-mongodb-connection.js
```

---

## Rollback Plan

### If Migration Fails

**Option 1: Revert to Firebase**

```bash
# Stop application
pm2 stop eoc-dashboard

# Restore Firebase .env.local
cp ~/backups/env.local.BACKUP /var/www/eoc-dashboard/.env.local

# Checkout original code
cd /var/www/eoc-dashboard
git checkout main

# Rebuild
npm install
npm run build

# Restart
pm2 restart eoc-dashboard
```

**Option 2: Keep Both (Hybrid)**

Run Firebase and MongoDB in parallel during transition period. Update `.env.local`:

```bash
# Use both
MONGODB_URI=mongodb://ercs_app:password@localhost:27017/ercs_dashboard
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase vars
```

---

## Verification Checklist

After migration, verify:

- [ ] Application starts without errors
- [ ] Dashboard loads and displays data
- [ ] Field incidents appear on map
- [ ] News articles display correctly
- [ ] Admin panel works
- [ ] PDF upload functions
- [ ] KoBo sync works
- [ ] No console errors in browser
- [ ] PM2 logs show no errors
- [ ] MongoDB logs show no errors

---

## Performance Tuning

### MongoDB Indexes

```bash
mongosh
```

```javascript
use ercs_dashboard

// Verify indexes were created
db.field_incidents.getIndexes()
db.crawled_articles.getIndexes()
db.incidents.getIndexes()

// Add additional indexes if needed
db.field_incidents.createIndex({ "location.coordinates": "2dsphere" })
```

### Connection Pooling

Already configured in `mongodb.ts`:
- maxPoolSize: 10
- minPoolSize: 2

Adjust based on load.

---

**Migration complete!** Your application now uses MongoDB instead of Firebase Firestore.
