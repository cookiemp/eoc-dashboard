# Deployment Checklist - Sentry Setup

## ✅ Already Done
- [x] Sentry package installed
- [x] Configuration files created
- [x] All tests passing (45/45)
- [x] TypeScript compiles successfully
- [x] DSN obtained from Sentry

## 📋 Before You Push to Production

### Step 1: Add Environment Variables to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **3 required variables** for **Production** and **Preview** environments:

#### Required Variables

**1. NEXT_PUBLIC_SENTRY_DSN**
```
https://738e283bb9da256811f4003a30b86cc1@o4510226100649984.ingest.de.sentry.io/4510226118410320
```

**2. SENTRY_ORG**
- Go to Sentry → Settings → Organization Settings
- Copy your "Organization Slug"
- Paste it here

**3. SENTRY_PROJECT**
```
ercs-intel-dashboard
```

#### Optional (for better error debugging)

**4. SENTRY_AUTH_TOKEN**
- Go to Sentry → Settings → Account → API → Auth Tokens
- Create new token with scopes: `project:releases` and `org:read`
- Copy and paste the token

---

### Step 2: Commit and Push

```bash
git add .
git commit -m "Add Sentry error tracking"
git push
```

Vercel will automatically deploy.

---

### Step 3: Test It Works

After deployment completes:

1. Visit your production site
2. Open browser console (F12)
3. Run this command:
   ```javascript
   throw new Error("Testing Sentry error tracking");
   ```
4. Go to your Sentry dashboard: https://sentry.io
5. You should see the error appear within 5-10 seconds

---

## 🎯 What Happens Next

Once deployed with the environment variables:

✅ **All production errors** will be captured automatically  
✅ **Email alerts** when new errors occur  
✅ **Session replays** for 10% of sessions (100% when errors occur)  
✅ **Performance monitoring** for API routes and page loads  
✅ **Zero impact** on development (Sentry disabled in localhost)  

---

## 🔒 Safety Notes

- Sentry **only runs in production** (disabled in development)
- If DSN is missing, app works normally (Sentry just won't capture errors)
- Free tier: 5,000 errors/month (more than enough)
- No breaking changes to existing code

---

## 📊 Monitoring Your App

After deployment, check your Sentry dashboard regularly:

- **Issues** tab: See all errors grouped by type
- **Performance** tab: API response times, page load speeds
- **Replays** tab: Watch user sessions when errors occurred
- **Alerts** tab: Configure email/Slack notifications

---

**Ready to deploy!** ✅

Just add those 3 environment variables to Vercel and push.
