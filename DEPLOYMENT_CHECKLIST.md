# Deployment Checklist - PDF Field Reports Feature

**Commit:** `cf7c7c3` - feat: add PDF field reports system with AI extraction and admin panel  
**Date:** October 1, 2025  
**Feature:** PDF Field Reports Processing System

---

## Pre-Push Verification ✅

### Code Quality
- [x] **TypeScript Compilation:** `npx tsc --noEmit` - PASSED (0 errors)
- [x] **Build Test:** `npm run build` - PASSED (all routes compiled)
- [x] **Lint Check:** Minor warnings only (unused vars, acceptable)
- [x] **Test Data Cleaned:** Removed 29 test incidents, 4 PDF logs
- [x] **Debug Logs Removed:** Only operational logs remain
- [x] **Documentation Updated:** CODEBASE_OVERVIEW.md + ADMIN_GUIDE.md

### Commit Status
- [x] **Files Staged:** 30 files (3,241 additions, 33 deletions)
- [x] **Commit Message:** Comprehensive with conventional commits format
- [x] **Test Files Excluded:** All mock/test files left untracked
- [x] **Privacy Check:** No sensitive data in commit

---

## Push Command

```bash
git push origin main
```

---

## Post-Push Deployment Steps

### 1. Vercel Deployment (Automatic)

**Expected Behavior:**
- GitHub webhook triggers Vercel deployment
- Build takes 3-5 minutes
- Vercel deploys to production URL

**Monitor:**
- Vercel dashboard: https://vercel.com/dashboard
- Check deployment logs for errors
- Verify build success

### 2. Environment Variables (CRITICAL)

**Add to Vercel:**

```bash
ADMIN_PASSWORD=<secure-password>
```

**Steps:**
1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add `ADMIN_PASSWORD` for Production
4. Redeploy if already deployed (required for env var pickup)

**Existing vars (verify present):**
- `GOOGLE_API_KEY`
- `NEWSAPI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 3. Firebase Indexes (REQUIRED)

**What to do:**
1. Navigate to admin dashboard: `https://your-domain.vercel.app/admin`
2. Try accessing statistics or pending incidents
3. **Expected:** Firestore will show error with index creation link
4. Click the link to auto-create indexes
5. Wait 2-5 minutes for index building

**Alternative (Manual):**
Go to Firebase Console → Firestore Database → Indexes → Create Index

**Indexes needed:**
```
Collection: field_incidents
- status (Ascending) + reportedAt (Descending)

Collection: field_incidents  
- needsReview (Ascending) + status (Ascending) + reportedAt (Descending)

Collection: pdf_uploads
- uploadedAt (Descending)
```

### 4. First Admin Login Test

**Steps:**
1. Navigate to `/admin/login`
2. Enter ADMIN_PASSWORD
3. Should see admin dashboard with stats (all 0)
4. Test upload page navigation
5. Test logout

**If login fails:**
- Check Vercel logs for env variable
- Verify ADMIN_PASSWORD is set correctly
- Clear browser cookies
- Try incognito mode

### 5. Upload Test with Real PDF

**Steps:**
1. Upload a real ERCS field report PDF
2. Verify AI extraction works
3. Check incident details for accuracy
4. Test approve/reject workflow
5. Verify incident appears on main dashboard map

**Expected:**
- PDF processing: 30-60 seconds
- Incidents extracted with coordinates
- Map markers appear with correct styling
- Diamond shape for field reports

### 6. Main Dashboard Verification

**Check:**
- [ ] Map loads correctly
- [ ] News incidents still working
- [ ] Field incidents appear with diamond markers
- [ ] Markers offset correctly (no overlap)
- [ ] Color coding correct
- [ ] Click incident → dossier works

### 7. Monitor Production Logs

**Watch for:**
- PDF processing errors
- Firebase connection issues
- Authentication failures
- AI extraction timeouts

**Vercel Logs:**
```
vercel logs <project-name> --follow
```

---

## Rollback Plan

**If critical issues occur:**

### Option 1: Revert Commit
```bash
git revert cf7c7c3
git push origin main
```

### Option 2: Disable Feature
Set in Vercel env vars:
```bash
FEATURE_FLAG_PDF_REPORTS=false
```
(Would need code update to support this)

### Option 3: Previous Commit
```bash
git reset --hard 371bd27  # Previous commit
git push --force origin main
```
⚠️ **Use force push only if absolutely necessary**

---

## Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Monitor Vercel logs daily
- [ ] Check Firebase usage (Firestore reads/writes)
- [ ] Monitor Gemini API quota usage
- [ ] Track admin panel usage
- [ ] Collect user feedback from ERCS staff

### Key Metrics to Track
- PDF uploads per day
- AI extraction success rate
- Average processing time
- Incident approval rate
- Dashboard load times

### Known Limitations
- PDF size limit: 5MB
- Image-only PDFs won't work (need OCR)
- Single admin password (no multi-user)
- No incident editing (approve/reject only)
- No bulk operations

---

## Support Documentation

**For ERCS Staff:**
- User guide: ADMIN_GUIDE.md
- Admin panel: `/admin`
- Login: `/admin/login`

**For Developers:**
- Technical docs: CODEBASE_OVERVIEW.md
- Code structure: Well-documented inline
- AI flow: `src/ai/flows/extract-incidents-from-pdf-flow.ts`

---

## Success Criteria

### Must Have (Blocking)
- [x] Code compiles without errors
- [x] Build succeeds
- [ ] Vercel deployment succeeds
- [ ] Admin login works
- [ ] PDF upload and extraction works
- [ ] Incidents appear on map

### Should Have (Important)
- [ ] Firebase indexes created
- [ ] Real ERCS PDF tested
- [ ] Performance acceptable (<2 min per PDF)
- [ ] No errors in production logs
- [ ] ERCS staff trained

### Nice to Have (Optional)
- [ ] Multiple PDFs tested
- [ ] Edge cases documented
- [ ] Performance optimizations applied
- [ ] Analytics tracking added

---

## Next Steps After Deployment

1. **Train ERCS Staff:**
   - Walk through ADMIN_GUIDE.md
   - Demo upload process
   - Explain review workflow
   - Share admin password securely

2. **Collect Feedback:**
   - AI extraction accuracy
   - Upload workflow usability
   - Performance issues
   - Feature requests

3. **Plan Iterations:**
   - OCR support for scanned PDFs
   - Multi-user authentication
   - Incident editing capabilities
   - Bulk operations
   - Advanced filtering

4. **Monitor and Optimize:**
   - Review logs weekly
   - Optimize slow queries
   - Improve AI prompts based on feedback
   - Add analytics if needed

---

## Contact

**For deployment issues:**
- Check Vercel logs first
- Review Firebase Console
- Consult CODEBASE_OVERVIEW.md
- Review commit message details

**Emergency rollback:**
- Follow rollback plan above
- Document issues encountered
- Plan fix before redeployment

---

**Status:** Ready for push to production ✅  
**Risk Level:** Low (purely additive, no breaking changes)  
**Estimated Deployment Time:** 15-30 minutes  
**Testing Time:** 1-2 hours recommended before staff training