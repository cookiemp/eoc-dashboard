# KoBo Duplicate Detection - Implementation Summary

**Date:** October 20, 2025  
**Status:** ✅ Implemented and Tested

---

## Problem

The KoBo sync GitHub Action runs every 30 minutes and fetches the last 5 submissions from KoBoToolbox. Without duplicate detection, it would create new field incidents for the same submissions every time, leading to duplicate entries in the pending approval queue.

---

## Solution

Implemented duplicate detection using KoBo submission IDs.

### Changes Made

#### 1. Updated `FieldIncident` Type
**File:** `src/services/field-incidents-service.ts`

Added optional `koboSubmissionId` field:
```typescript
export type FieldIncident = Incident & {
  // ... existing fields
  koboSubmissionId?: number; // Optional: KoBo submission ID for duplicate detection
};
```

**Why optional?** PDF-uploaded incidents don't have KoBo IDs, so this field is only present for KoBo-synced incidents.

---

#### 2. Added Duplicate Check Logic
**File:** `src/services/field-incidents-service.ts`

Modified `addFieldIncidents()` function to check for duplicates before adding:

```typescript
for (const incident of incidents) {
  // Check for duplicates if this is from KoBo (has koboSubmissionId)
  if (incident.koboSubmissionId) {
    const existingQuery = await firestore
      .collection(COLLECTION_NAME)
      .where('koboSubmissionId', '==', incident.koboSubmissionId)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      console.log(`⏭️  Skipping duplicate KoBo submission: ${incident.koboSubmissionId}`);
      skippedCount++;
      continue; // Skip this incident
    }
  }

  // Add incident if not duplicate
  const docRef = firestore.collection(COLLECTION_NAME).doc();
  batch.set(docRef, { ...incident });
  addedCount++;
}
```

**Logic:**
1. If incident has `koboSubmissionId`, query Firestore for existing incident with same ID
2. If found, skip it and increment `skippedCount`
3. If not found, add it normally
4. If incident doesn't have `koboSubmissionId` (PDF upload), add it without checking

---

#### 3. Include Submission ID in KoBo Sync
**File:** `src/services/kobo-sync-service.ts`

Updated `convertToFieldIncident()` to include the KoBo submission ID:

```typescript
return {
  title,
  description,
  // ... other fields
  koboSubmissionId: submission._id, // For duplicate detection
};
```

---

## How It Works

### First Sync Run
```
KoBo API → Fetch 5 submissions (IDs: 101, 102, 103, 104, 105)
  ↓
Convert to incidents
  ↓
Check Firestore for existing koboSubmissionId
  ↓
None found (first time)
  ↓
Add all 5 incidents to Firestore
  ↓
Result: 5 new incidents created
```

### Second Sync Run (30 minutes later)
```
KoBo API → Fetch 5 submissions (IDs: 103, 104, 105, 106, 107)
  ↓
Convert to incidents
  ↓
Check Firestore for existing koboSubmissionId
  ↓
Found: 103, 104, 105 (already exist)
Not found: 106, 107 (new submissions)
  ↓
Skip: 103, 104, 105
Add: 106, 107
  ↓
Result: 2 new incidents created, 3 skipped
```

---

## Benefits

✅ **No Duplicates** - Same KoBo submission won't create multiple incidents  
✅ **Backwards Compatible** - PDF uploads still work (no `koboSubmissionId` required)  
✅ **Efficient** - Only queries Firestore for KoBo incidents  
✅ **Transparent** - Logs show how many were added vs. skipped  
✅ **Safe** - Optional field doesn't break existing data

---

## Testing

### TypeScript Compilation
```bash
npm run typecheck
```
✅ **Result:** 0 errors

### Unit Tests
```bash
npm test
```
✅ **Result:** 45/45 tests passing

### Production Build
```bash
npm run build
```
✅ **Result:** Build successful

---

## Firestore Index Required

For optimal performance, create a Firestore index:

**Collection:** `field_incidents`  
**Fields:**
- `koboSubmissionId` (Ascending)

**How to create:**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `field_incidents`
4. Field: `koboSubmissionId`, Order: Ascending
5. Query scope: Collection
6. Click "Create"

**Note:** Firestore will auto-create this index when the query runs for the first time, but manual creation is faster.

---

## Logging

The system now logs duplicate detection:

### When Adding Incidents
```
✅ Added 2 field incidents (auto-approve: false, skipped: 3)
```

### When Skipping Duplicates
```
⏭️  Skipping duplicate KoBo submission: 12345
⏭️  Skipping duplicate KoBo submission: 12346
⏭️  Skipping duplicate KoBo submission: 12347
```

### When All Are Duplicates
```
⏭️  No new incidents to add (all 5 were duplicates)
```

---

## Edge Cases Handled

### 1. PDF Uploads (No KoBo ID)
- `koboSubmissionId` is `undefined`
- Duplicate check is skipped
- Incident is added normally

### 2. First KoBo Sync
- No existing incidents in Firestore
- All submissions are new
- All are added successfully

### 3. All Duplicates
- All submissions already exist
- None are added
- Batch commit is skipped (no empty writes)

### 4. Mixed New and Duplicate
- Some submissions exist, some don't
- Only new ones are added
- Duplicates are skipped

---

## Performance Impact

### Before (No Duplicate Detection)
- **Firestore Writes:** N incidents per sync
- **Duplicates:** Yes (every sync creates duplicates)

### After (With Duplicate Detection)
- **Firestore Reads:** N queries (one per KoBo incident)
- **Firestore Writes:** Only new incidents
- **Duplicates:** No

**Trade-off:** Slightly more reads, but prevents duplicate writes and keeps data clean.

**Cost:** Firestore reads are cheap (50k free per day), and we only sync 5 submissions every 30 minutes = ~240 reads/day (well within free tier).

---

## Future Enhancements (Optional)

### 1. Batch Duplicate Check
Instead of querying one-by-one, fetch all existing KoBo IDs in one query:
```typescript
const existingIds = await firestore
  .collection(COLLECTION_NAME)
  .where('koboSubmissionId', 'in', incidents.map(i => i.koboSubmissionId))
  .get();
```
**Benefit:** Fewer Firestore reads  
**Trade-off:** More complex code

### 2. Update Existing Incidents
Instead of skipping duplicates, update them with latest data:
```typescript
if (!existingQuery.empty) {
  const existingDoc = existingQuery.docs[0];
  batch.update(existingDoc.ref, { ...incident, updatedAt: timestamp });
}
```
**Benefit:** Keeps incidents up-to-date if KoBo submission is edited  
**Trade-off:** More writes, may overwrite admin changes

### 3. Track Last Sync Time
Store the last successful sync timestamp and only fetch submissions after that:
```typescript
const lastSync = await getLastSyncTime();
const url = `${KOBO_SERVER}/api/v2/assets/${ASSET_UID}/data/?query={"_submission_time":{"$gt":"${lastSync}"}}`;
```
**Benefit:** Fewer API calls, only fetch truly new submissions  
**Trade-off:** Need to store sync state, handle failures

---

## Deployment Notes

### Safe to Deploy
- ✅ All tests passing
- ✅ Build successful
- ✅ Backwards compatible (optional field)
- ✅ No breaking changes

### What Happens on Deploy
1. Existing incidents without `koboSubmissionId` continue to work
2. New KoBo syncs will include `koboSubmissionId`
3. Duplicate detection activates automatically
4. No data migration needed

### Rollback Plan
If issues arise, simply revert the commit. Existing data is unaffected since `koboSubmissionId` is optional.

---

## Summary

**Problem Solved:** ✅ KoBo sync no longer creates duplicate incidents  
**Breaking Changes:** ❌ None  
**Tests:** ✅ All passing  
**Production Ready:** ✅ Yes  
**Tech Debt:** ✅ Minimal (clean implementation)

---

**Last Updated:** October 20, 2025  
**Status:** Ready for production deployment
