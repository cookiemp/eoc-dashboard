# KoBo Duplicate Cleanup Guide

**Date:** October 20, 2025  
**Purpose:** Remove duplicate KoBo incidents from pending queue

---

## Overview

You have 300+ duplicate incidents in the pending queue from repeated KoBo syncs. This guide walks you through safely cleaning them up.

---

## Safety Features Built-In ✅

The cleanup script has **multiple safety layers**:

1. **Dry-run by default** - Shows what would be deleted WITHOUT actually deleting
2. **Only targets duplicates** - Leaves unique incidents untouched
3. **Keeps oldest incident** - Preserves the first synced version in each group
4. **5-second countdown** - Gives you time to cancel before deletion
5. **Detailed logging** - Shows exactly what it's doing
6. **Error handling** - Continues even if one deletion fails

---

## Step-by-Step Instructions

### Step 1: Run Dry-Run (Safe - No Changes)

This shows you what WOULD be deleted without actually deleting anything.

```bash
npm run cleanup:kobo-duplicates
```

**What you'll see:**
```
🔍 Scanning for duplicates...

📊 Found 450 incidents with KoBo submission IDs

================================================================================
📋 DUPLICATE ANALYSIS
================================================================================

🔢 Total duplicate groups: 150
📊 Total incidents in duplicates: 450
🗑️  Incidents to delete: 300
✅ Incidents to keep: 150

────────────────────────────────────────────────────────────────────────────────
DETAILED BREAKDOWN:
────────────────────────────────────────────────────────────────────────────────

Group 1: KoBo Submission ID 12345
  Total copies: 3

  ✅ KEEP - abc123xyz
    Synced: 2025-10-15T10:30:00.000Z
    Title: Flood Emergency - Addis Ababa
    Status: ⚠️  Pending Review

  🗑️  DELETE - def456uvw
    Synced: 2025-10-15T11:00:00.000Z
    Title: Flood Emergency - Addis Ababa
    Status: ⚠️  Pending Review

  🗑️  DELETE - ghi789rst
    Synced: 2025-10-15T11:30:00.000Z
    Title: Flood Emergency - Addis Ababa
    Status: ⚠️  Pending Review

────────────────────────────────────────────────────────────────────────────────

... and 149 more duplicate groups

🔒 DRY RUN MODE - No changes will be made

To actually delete duplicates, run with --delete flag:

  npm run cleanup:kobo-duplicates -- --delete
```

**Review this output carefully!** Make sure:
- ✅ It's only targeting duplicates (same KoBo ID)
- ✅ It's keeping the oldest incident in each group
- ✅ The numbers make sense (e.g., 300 to delete out of 450 total)

---

### Step 2: Actually Delete Duplicates

Once you've reviewed the dry-run and everything looks good:

```bash
npm run cleanup:kobo-duplicates -- --delete
```

**What happens:**
1. Shows the same analysis
2. **5-second countdown** - Press Ctrl+C to cancel if needed
3. Deletes duplicates one by one
4. Logs each deletion
5. Shows final summary

**Example output:**
```
⚠️  DELETE MODE ACTIVE - This will permanently remove duplicates!

Press Ctrl+C within 5 seconds to cancel...

Starting in 5... Starting in 4... Starting in 3... Starting in 2... Starting in 1... 

🗑️  Starting deletion process...

✅ Deleted: def456uvw (KoBo ID: 12345)
✅ Deleted: ghi789rst (KoBo ID: 12345)
✅ Deleted: jkl012mno (KoBo ID: 12346)
... (continues for all duplicates)

================================================================================
✅ CLEANUP COMPLETE
================================================================================
🗑️  Deleted: 300 duplicate incidents
✅ Kept: 150 original incidents
❌ Errors: 0

✨ Done!
```

---

## What Gets Deleted vs. Kept

### Logic:
For each group of duplicates with the same `koboSubmissionId`:
- **KEEP:** The incident with the **earliest** `reportedAt` timestamp (first synced)
- **DELETE:** All other incidents with the same `koboSubmissionId`

### Example:
```
KoBo Submission ID: 12345

Incident A - Synced: 2025-10-15 10:00 → ✅ KEEP (oldest)
Incident B - Synced: 2025-10-15 10:30 → 🗑️ DELETE
Incident C - Synced: 2025-10-15 11:00 → 🗑️ DELETE
```

### Why keep the oldest?
- It was synced first
- May have been reviewed by admin already
- Most likely to have any manual edits/notes

---

## Safety Checklist

Before running with `--delete`:

- [ ] Ran dry-run first (`npm run cleanup:kobo-duplicates`)
- [ ] Reviewed the output - numbers make sense
- [ ] Verified it's only targeting duplicates (same KoBo ID)
- [ ] Confirmed it's keeping the oldest incident in each group
- [ ] Have Firebase backup (Vercel/Firebase auto-backup is enabled)
- [ ] Ready to press Ctrl+C during 5-second countdown if needed

---

## What If Something Goes Wrong?

### If You Need to Cancel
- **During dry-run:** Just Ctrl+C (nothing was changed anyway)
- **During countdown:** Press Ctrl+C within 5 seconds
- **During deletion:** Press Ctrl+C (already deleted items won't be restored, but it will stop)

### If Wrong Items Were Deleted
1. **Don't panic** - Firebase has automatic backups
2. Check Vercel deployment logs for the deletion output
3. Contact Firebase support to restore from backup (if needed)
4. Re-run KoBo sync to fetch submissions again

### If Script Errors Out
- Check the error message
- Verify Firebase connection (`.env.local` variables)
- Try running dry-run again
- If persistent, check Firestore console for any issues

---

## After Cleanup

### Verify Results
1. Go to `/admin/pending` page
2. Check that duplicates are gone
3. Verify unique incidents are still there
4. Confirm the count matches expectations

### Deploy Duplicate Detection
Once cleanup is done, deploy the duplicate detection code:
```bash
git add .
git commit -m "feat: add KoBo duplicate detection and cleanup"
git push
```

This prevents future duplicates from being created.

---

## Technical Details

### What the Script Does

1. **Connects to Firestore**
   ```typescript
   const firestore = await getFirestore();
   ```

2. **Queries all KoBo incidents**
   ```typescript
   const snapshot = await firestore
     .collection('field_incidents')
     .where('koboSubmissionId', '!=', null)
     .get();
   ```

3. **Groups by koboSubmissionId**
   ```typescript
   const groups = new Map<number, DuplicateGroup>();
   ```

4. **Finds duplicates** (groups with > 1 incident)

5. **Sorts by reportedAt** (oldest first)

6. **Deletes all except first** in each group
   ```typescript
   await firestore.collection('field_incidents').doc(id).delete();
   ```

### What It Doesn't Touch

- ❌ Incidents without `koboSubmissionId` (PDF uploads)
- ❌ Unique incidents (only 1 copy)
- ❌ Already approved incidents (still removes duplicates, but logs them)
- ❌ Archived incidents

---

## FAQ

### Q: Will this affect PDF-uploaded incidents?
**A:** No. The script only looks at incidents with `koboSubmissionId`. PDF uploads don't have this field.

### Q: What if I have duplicates that aren't from KoBo?
**A:** This script won't touch them. You'd need a different cleanup strategy for those.

### Q: Can I undo the deletion?
**A:** Not directly, but Firebase has automatic backups. Contact support if needed.

### Q: Will this run automatically?
**A:** No. It's a one-time manual script. You run it when needed.

### Q: What if new duplicates appear after cleanup?
**A:** They won't! Once you deploy the duplicate detection code, new syncs won't create duplicates.

### Q: How long does it take?
**A:** Depends on number of duplicates. ~1-2 seconds per deletion. For 300 duplicates, about 5-10 minutes.

### Q: Can I run this on production?
**A:** Yes, but run dry-run first! The script is designed to be safe for production use.

---

## Summary

**Safe Process:**
1. ✅ Run dry-run: `npm run cleanup:kobo-duplicates`
2. ✅ Review output carefully
3. ✅ Run with delete: `npm run cleanup:kobo-duplicates -- --delete`
4. ✅ Watch the 5-second countdown (cancel if needed)
5. ✅ Verify results in admin panel
6. ✅ Deploy duplicate detection code

**Result:**
- 🗑️ 300 duplicate incidents removed
- ✅ 150 unique incidents kept
- 🚀 Future duplicates prevented

---

**Questions?** Review the dry-run output first. If everything looks good, proceed with confidence!

**Last Updated:** October 20, 2025
