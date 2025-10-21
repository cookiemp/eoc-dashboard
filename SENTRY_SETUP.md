# Sentry Error Tracking Setup

## What Was Installed

Sentry error tracking has been configured for the ERCS Intel Dashboard. This will capture and report errors in production.

## Files Created/Modified

1. ✅ **sentry.client.config.ts** - Client-side error tracking
2. ✅ **sentry.server.config.ts** - Server-side error tracking  
3. ✅ **sentry.edge.config.ts** - Edge runtime error tracking
4. ✅ **next.config.ts** - Modified to wrap with Sentry config
5. ✅ **package.json** - Added @sentry/nextjs dependency

## Setup Instructions

### Step 1: Create Sentry Account (Free)

1. Go to https://sentry.io/signup/
2. Sign up with your email or GitHub
3. Create a new project:
   - Platform: **Next.js**
   - Project name: **ercs-intel-dashboard** (or whatever you prefer)
   - Alert frequency: **On every new issue**

### Step 2: Get Your DSN

After creating the project, Sentry will show you a **DSN** (Data Source Name). It looks like:

```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

Copy this DSN - you'll need it for the next step.

### Step 3: Add Environment Variables

You need to add these environment variables in **two places**:

#### A. Local Development (.env.local)

Create or update `.env.local` file in your project root:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=ercs-intel-dashboard
```

**Note:** For local development, Sentry is **disabled by default** (only runs in production).

#### B. Vercel Production (REQUIRED)

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Your DSN from Sentry | Production, Preview |
| `SENTRY_ORG` | Your Sentry org slug | Production, Preview |
| `SENTRY_PROJECT` | ercs-intel-dashboard | Production, Preview |
| `SENTRY_AUTH_TOKEN` | (Optional) For source maps | Production, Preview |

**To get your org slug:**
- Go to Sentry → Settings → Organization Settings
- Copy the "Organization Slug" (e.g., `my-company-ab`)

**To get auth token (optional, for source maps):**
- Go to Sentry → Settings → Account → API → Auth Tokens
- Create new token with `project:releases` and `org:read` scopes
- Copy the token

### Step 4: Deploy to Vercel

After adding the environment variables in Vercel:

1. Commit your changes (but don't push yet if you want to test locally first)
2. Push to your repository
3. Vercel will automatically deploy
4. Sentry will start capturing errors in production

## How to Test

### Test in Production (After Deploy)

1. Visit your production site
2. Open browser console
3. Trigger a test error:

```javascript
// In browser console
throw new Error("Test Sentry error tracking");
```

4. Go to your Sentry dashboard
5. You should see the error appear within seconds

### Test Locally (Optional)

To test Sentry locally, temporarily enable it:

1. In `sentry.client.config.ts`, change:
   ```typescript
   enabled: process.env.NODE_ENV === 'production',
   ```
   to:
   ```typescript
   enabled: true,
   ```

2. Run `npm run dev`
3. Trigger an error in the browser
4. Check Sentry dashboard

**Don't forget to revert this change!**

## What Sentry Captures

✅ **Automatically captured:**
- JavaScript errors (client-side)
- API route errors (server-side)
- Unhandled promise rejections
- Network errors
- React component errors

❌ **Ignored (configured to reduce noise):**
- ResizeObserver errors (browser quirk)
- Localhost errors (development)
- Non-critical promise rejections

## Features Enabled

1. **Error Tracking** - All production errors
2. **Session Replay** - 10% of sessions, 100% of error sessions
3. **Performance Monitoring** - 10% of transactions
4. **Vercel Cron Monitoring** - Automatic monitoring of cron jobs
5. **Source Maps** - Hidden from public, uploaded to Sentry for debugging

## Cost

**Free Tier Limits:**
- 5,000 errors per month
- 10,000 performance units per month
- 50 replays per month

This is more than enough for your dashboard.

## Monitoring Your Errors

### Sentry Dashboard

Go to https://sentry.io and you'll see:

1. **Issues** - All errors grouped by type
2. **Performance** - API response times, page load times
3. **Replays** - Session recordings when errors occur
4. **Alerts** - Email notifications for new errors

### Recommended Alerts

Set up email alerts for:
- Every new issue (first time an error occurs)
- High-frequency issues (same error happening repeatedly)

## Troubleshooting

### "Sentry is not capturing errors"

1. Check environment variables are set in Vercel
2. Verify DSN is correct
3. Make sure you're testing in production (not localhost)
4. Check Sentry project settings → Client Keys (DSN) is enabled

### "Source maps not uploading"

1. Add `SENTRY_AUTH_TOKEN` to Vercel environment variables
2. Make sure token has correct scopes
3. Check build logs for Sentry upload errors

### "Too many errors being captured"

1. Adjust `ignoreErrors` in `sentry.client.config.ts`
2. Add more error patterns to ignore
3. Use `beforeSend` to filter errors

## Next Steps

After deploying:

1. ✅ Monitor Sentry dashboard for first few days
2. ✅ Adjust `ignoreErrors` if you see noise
3. ✅ Set up email alerts
4. ✅ Optional: Set up Slack/Discord integration

## Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/

---

**Status:** ✅ Configured and ready to deploy  
**Last Updated:** October 21, 2025
