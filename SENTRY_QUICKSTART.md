# Sentry Quick Start Guide

## ✅ What's Done

Sentry error tracking is **fully configured** and ready to use. All tests pass (45/45).

## 🚀 Before You Deploy

### 1. Create Sentry Account (2 minutes)
- Go to https://sentry.io/signup/
- Sign up (free)
- Create project: **Next.js** platform

### 2. Get Your DSN ✅ DONE
Your DSN:
```
https://738e283bb9da256811f4003a30b86cc1@o4510226100649984.ingest.de.sentry.io/4510226118410320
```

### 3. Add to Vercel (REQUIRED)
Go to Vercel → Your Project → Settings → Environment Variables

Add these **3 variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://738e283bb9da256811f4003a30b86cc1@o4510226100649984.ingest.de.sentry.io/4510226118410320` |
| `SENTRY_ORG` | (Get from Sentry → Settings → Organization Settings) |
| `SENTRY_PROJECT` | `ercs-intel-dashboard` |

**Optional (for source maps):**
| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `SENTRY_AUTH_TOKEN` | Auth token | Sentry → Settings → Auth Tokens → Create Token |

### 4. Deploy
```bash
git add .
git commit -m "Add Sentry error tracking"
git push
```

Vercel will automatically deploy. Sentry will start working immediately.

## 🧪 Test It Works

After deployment:

1. Visit your production site
2. Open browser console (F12)
3. Type: `throw new Error("Test Sentry");`
4. Go to Sentry dashboard
5. You should see the error within seconds

## 📊 What You'll See in Sentry

- **All JavaScript errors** in production
- **API route errors** from your backend
- **Session replays** when errors occur (10% of sessions)
- **Performance metrics** (page load times, API response times)
- **Email alerts** for new errors

## 🔒 Safety Features

✅ **Disabled in localhost** - Won't spam Sentry during development  
✅ **Ignores common noise** - ResizeObserver errors, etc.  
✅ **Free tier is enough** - 5,000 errors/month  
✅ **All tests pass** - 45/45 tests passing  
✅ **No breaking changes** - Existing code unchanged  

## 📝 Files Changed

- ✅ `sentry.client.config.ts` (new)
- ✅ `sentry.server.config.ts` (new)
- ✅ `sentry.edge.config.ts` (new)
- ✅ `next.config.ts` (modified - wrapped with Sentry)
- ✅ `package.json` (added @sentry/nextjs)

## 🆘 Need Help?

See `SENTRY_SETUP.md` for detailed instructions.

---

**Ready to deploy!** Just add the environment variables to Vercel and push.
