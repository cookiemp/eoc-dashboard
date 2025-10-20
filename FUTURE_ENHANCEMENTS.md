# Future Enhancements & Improvements

**Created:** October 20, 2025  
**Status:** Planned for future implementation

---

## Overview

This document outlines recommended improvements for the ERCS Intel Dashboard. All items are **optional** and can be implemented when time permits. The current system is production-ready without these enhancements.

---

## 1. Automated Testing (E2E)

### Current State
- ✅ 45 unit/integration tests passing (Vitest)
- ✅ 100% pass rate
- ❌ No end-to-end (E2E) tests

### Recommendation: Add Playwright E2E Tests

**What it tests:**
- Full user workflows in a real browser
- Integration between all system components
- Real API calls and database interactions

**Test Scenarios:**
1. **Dashboard Load Test**
   - Visit homepage
   - Verify news articles load
   - Check map displays incidents
   - Verify AI summary appears

2. **Admin Workflow Test**
   - Login to admin panel
   - Upload PDF field report
   - Verify AI extraction
   - Approve incident
   - Check incident appears on dashboard

3. **KoBo Sync Test**
   - Trigger KoBo sync
   - Verify incidents created
   - Check geocoding accuracy
   - Verify approval workflow

4. **Crawler Health Test**
   - Check crawler status endpoint
   - Verify articles are being crawled
   - Check cache is working

**Setup Steps:**

```bash
# 1. Install Playwright
npm install -D @playwright/test

# 2. Initialize Playwright
npx playwright install

# 3. Create test file: tests/e2e/dashboard.spec.ts
```

**Example Test:**
```typescript
import { test, expect } from '@playwright/test';

test('dashboard loads and displays data', async ({ page }) => {
  await page.goto('https://your-site.vercel.app');
  
  // Check news articles load
  await expect(page.locator('[data-testid="news-article"]')).toHaveCount(10, { timeout: 10000 });
  
  // Check map is visible
  await expect(page.locator('.leaflet-container')).toBeVisible();
  
  // Check AI summary
  await expect(page.locator('[data-testid="ai-summary"]')).toBeVisible();
});

test('admin can upload and approve field report', async ({ page }) => {
  // Login
  await page.goto('https://your-site.vercel.app/admin/login');
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');
  
  // Upload PDF
  await page.goto('https://your-site.vercel.app/admin/upload');
  await page.setInputFiles('input[type="file"]', './test-data/sample-field-report.pdf');
  await page.click('button:has-text("Upload")');
  
  // Wait for extraction
  await expect(page.locator('text=Extraction complete')).toBeVisible({ timeout: 30000 });
  
  // Approve incident
  await page.click('button:has-text("Approve All")');
  
  // Verify on dashboard
  await page.goto('https://your-site.vercel.app');
  await expect(page.locator('.leaflet-marker')).toHaveCount(1, { timeout: 5000 });
});
```

**Effort:** 4-8 hours  
**Priority:** Medium  
**Value:** High (catches integration bugs before production)

---

## 2. Error Tracking & Monitoring

### 2.1 Sentry Error Tracking

**What it does:**
- Captures JavaScript errors in production
- Shows full stack traces with context
- Alerts when error rate spikes
- Tracks error trends over time

**Setup Steps:**

```bash
# 1. Install Sentry
npm install @sentry/nextjs

# 2. Initialize Sentry
npx @sentry/wizard@latest -i nextjs

# 3. Add to environment variables
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
```

**Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  
  // Ignore expected errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Add user context
  beforeSend(event, hint) {
    // Don't send errors from localhost
    if (window.location.hostname === 'localhost') {
      return null;
    }
    return event;
  },
});
```

**Cost:** Free tier (5,000 errors/month)  
**Effort:** 15 minutes  
**Priority:** High  
**Value:** Critical for production debugging

---

### 2.2 Vercel Analytics

**What it monitors:**
- Page load times
- Core Web Vitals (LCP, FID, CLS)
- Real user performance data
- Geographic distribution

**Setup:**
1. Go to Vercel Dashboard → Your Project → Analytics
2. Click "Enable Analytics"
3. Add to `layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Cost:** Free on Hobby plan (basic metrics)  
**Effort:** 5 minutes  
**Priority:** Medium  
**Value:** Medium (nice to have performance insights)

---

### 2.3 Uptime Monitoring

**Tool:** UptimeRobot (https://uptimerobot.com)

**What it does:**
- Pings your site every 5 minutes
- Alerts via email/SMS if site is down
- Tracks uptime percentage
- Public status page option

**Setup Steps:**
1. Create free account at UptimeRobot
2. Add monitors:
   - **Main Dashboard:** `https://your-site.vercel.app`
   - **Admin Panel:** `https://your-site.vercel.app/admin`
   - **API Health:** `https://your-site.vercel.app/api/crawler-health`
3. Configure alerts (email, SMS, Slack, Discord)
4. Set check interval to 5 minutes

**Alternative:** Better Uptime (https://betteruptime.com)
- More features
- Nicer UI
- Free tier: 10 monitors

**Cost:** Free (50 monitors)  
**Effort:** 10 minutes  
**Priority:** High  
**Value:** High (know immediately when site goes down)

---

### 2.4 Custom Health Check Endpoint

**Create:** `/api/health` endpoint to monitor system health

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { getCrawlerHealth } from '@/services/firebase-news-service';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, any>,
  };

  try {
    // Check Firestore
    const firestore = getFirestore();
    if (!firestore) {
      checks.services.firestore = { status: 'down', error: 'Not initialized' };
      checks.status = 'degraded';
    } else {
      await firestore.collection('_health').doc('check').set({ timestamp: Date.now() });
      checks.services.firestore = { status: 'up' };
    }

    // Check Crawler Health
    const crawlerHealth = await getCrawlerHealth();
    checks.services.crawler = {
      status: crawlerHealth.isHealthy ? 'up' : 'degraded',
      lastRun: crawlerHealth.lastRunAt,
      articlesCount: crawlerHealth.lastRunArticleCount,
    };

    // Check if crawler is stale (no run in 2 hours)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    if (new Date(crawlerHealth.lastRunAt).getTime() < twoHoursAgo) {
      checks.services.crawler.status = 'stale';
      checks.status = 'degraded';
    }

    // Check AI API (simple ping)
    checks.services.gemini = { status: 'unknown' }; // Add actual check if needed

  } catch (error) {
    checks.status = 'unhealthy';
    checks.services.error = { message: error instanceof Error ? error.message : 'Unknown error' };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

**Monitor this endpoint with UptimeRobot** to get alerts when:
- Firestore is down
- Crawler hasn't run in 2 hours
- Any service is degraded

**Effort:** 30 minutes  
**Priority:** Medium  
**Value:** High (proactive monitoring)

---

### 2.5 Application Monitoring (Session Replay)

**Tool:** LogRocket (https://logrocket.com)

**What it does:**
- Records user sessions (like a DVR for your app)
- Captures console logs, network requests, Redux actions
- Shows exactly what user saw when error occurred
- Useful for debugging hard-to-reproduce issues

**Setup:**
```bash
npm install logrocket
```

```typescript
// src/app/layout.tsx
import LogRocket from 'logrocket';

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('your-app-id');
}
```

**Cost:** Free tier (1,000 sessions/month)  
**Effort:** 20 minutes  
**Priority:** Low  
**Value:** Medium (helpful for debugging, but not critical)

---

## 3. Code Quality Improvements

### 3.1 Clean Up Remaining Lint Warnings

**Current:** 5 warnings remaining

**Files to fix:**

1. **src/hooks/use-toast.ts**
   ```typescript
   // Remove or properly use actionTypes
   - const actionTypes = { ... }
   + type ActionType = { ... } // If only used as type
   ```

2. **src/services/field-incidents-service.test.ts**
   ```typescript
   // Remove unused import
   - import { FieldIncident } from '@/lib/types';
   ```

3. **src/test-setup.ts**
   ```typescript
   // Remove unused variables
   - const fn = vi.fn();
   - const config = {};
   ```

4. **src/app/layout.tsx**
   - Custom font warning is expected (Next.js pattern)
   - Can ignore or move font to `_document.js`

**Effort:** 10 minutes  
**Priority:** Low  
**Value:** Low (cosmetic)

---

### 3.2 Extract Magic Numbers to Constants

**Create:** `src/lib/constants.ts`

```typescript
// Cache durations
export const CACHE_DURATION = {
  DASHBOARD: 15 * 60 * 1000,      // 15 minutes
  SUMMARY: 30 * 60 * 1000,        // 30 minutes
  CRAWLER_HEALTH: 5 * 60 * 1000,  // 5 minutes
} as const;

// Limits
export const LIMITS = {
  MAX_ARTICLES_PER_SOURCE: 100,
  MAX_INCIDENTS: 10,
  MAX_FIELD_INCIDENTS: 50,
  PDF_MAX_SIZE: 5 * 1024 * 1024,  // 5MB
} as const;

// Timeouts
export const TIMEOUTS = {
  CRAWLER: 30000,        // 30 seconds
  AI_EXTRACTION: 60000,  // 60 seconds
  API_REQUEST: 10000,    // 10 seconds
} as const;

// Collections
export const COLLECTIONS = {
  ARTICLES: 'crawled_articles',
  INCIDENTS: 'incidents',
  FIELD_INCIDENTS: 'field_incidents',
  CRAWLER_RUNS: 'crawler_runs',
  CRAWLER_METADATA: 'crawler_metadata',
  CACHE: 'cache',
  DASHBOARD_CACHE: 'dashboard_cache',
  PDF_UPLOADS: 'pdf_uploads',
} as const;
```

**Then replace throughout codebase:**
```typescript
// Before
const cacheExpiry = Date.now() + 15 * 60 * 1000;

// After
import { CACHE_DURATION } from '@/lib/constants';
const cacheExpiry = Date.now() + CACHE_DURATION.DASHBOARD;
```

**Effort:** 1 hour  
**Priority:** Low  
**Value:** Medium (improves maintainability)

---

### 3.3 Standardize Error Handling

**Create:** `src/lib/errors.ts`

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class FirestoreError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FIRESTORE_ERROR', 500, context);
  }
}

export class AIExtractionError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AI_EXTRACTION_ERROR', 500, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

// Error handler utility
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500);
  }
  
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
}
```

**Usage:**
```typescript
// Before
try {
  await firestore.collection('incidents').add(data);
} catch (error) {
  console.error('Error saving incident:', error);
  throw error;
}

// After
try {
  await firestore.collection('incidents').add(data);
} catch (error) {
  throw new FirestoreError('Failed to save incident', { 
    collection: 'incidents',
    originalError: error 
  });
}
```

**Effort:** 2-3 hours  
**Priority:** Medium  
**Value:** High (better debugging, consistent error responses)

---

### 3.4 Refactor Code Duplication

**Extract common patterns:**

**1. Firestore CRUD Helper:**
```typescript
// src/lib/firestore-helpers.ts
export async function getDocument<T>(
  collection: string,
  docId: string
): Promise<T | null> {
  const firestore = getFirestore();
  if (!firestore) throw new FirestoreError('Firestore not initialized');
  
  const doc = await firestore.collection(collection).doc(docId).get();
  return doc.exists ? (doc.data() as T) : null;
}

export async function addDocument<T>(
  collection: string,
  data: T
): Promise<string> {
  const firestore = getFirestore();
  if (!firestore) throw new FirestoreError('Firestore not initialized');
  
  const docRef = await firestore.collection(collection).add(data);
  return docRef.id;
}

// ... more helpers
```

**2. Cache Helper:**
```typescript
// src/lib/cache-helpers.ts
export async function getCachedData<T>(
  key: string,
  ttl: number
): Promise<T | null> {
  // Common cache retrieval logic
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number
): Promise<void> {
  // Common cache setting logic
}
```

**Effort:** 3-4 hours  
**Priority:** Low  
**Value:** Medium (reduces code, easier to maintain)

---

## 4. Multi-Region Deployment

**Create:** `vercel.json` in project root

```json
{
  "regions": ["iad1", "sfo1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "app/api/process-pdf/route.ts": {
      "maxDuration": 60,
      "memory": 2048
    }
  },
  "crons": [
    {
      "path": "/api/cron/crawler",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Benefits:**
- Redundancy if one region goes down
- Lower latency for global users
- Better resilience

**Considerations:**
- Keep regions close to Firestore location (probably `us-east1`)
- `iad1` (US East) + `sfo1` (US West) is a good combo for US-based Firestore

**Effort:** 15 minutes  
**Priority:** Medium  
**Value:** High (prevents future outages from affecting you)

---

## 5. Pre-commit Hooks

**Tool:** Husky + lint-staged

**What it does:**
- Runs type checking before commits
- Runs linting before commits
- Runs tests before push
- Prevents broken code from being committed

**Setup:**

```bash
# Install
npm install -D husky lint-staged

# Initialize
npx husky init
```

**Configuration:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky"
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm run typecheck
```

```bash
# .husky/pre-push
npm test
```

**Effort:** 30 minutes  
**Priority:** Low  
**Value:** Medium (prevents mistakes)

---

## Implementation Priority

### High Priority (Do Soon)
1. ✅ **Sentry Error Tracking** (15 min) - Critical for production
2. ✅ **UptimeRobot Monitoring** (10 min) - Know when site is down
3. ✅ **Multi-Region Deployment** (15 min) - Prevent future outages

**Total: ~40 minutes**

### Medium Priority (Do When Time Permits)
4. **Custom Health Check Endpoint** (30 min)
5. **Playwright E2E Tests** (4-8 hours)
6. **Standardize Error Handling** (2-3 hours)

**Total: ~7-12 hours**

### Low Priority (Nice to Have)
7. **Clean up lint warnings** (10 min)
8. **Extract constants** (1 hour)
9. **Refactor duplication** (3-4 hours)
10. **Pre-commit hooks** (30 min)
11. **Vercel Analytics** (5 min)
12. **LogRocket** (20 min)

**Total: ~6 hours**

---

## Cost Summary

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Sentry | 5,000 errors/month | $26/month (50k errors) |
| UptimeRobot | 50 monitors | $7/month (unlimited) |
| Vercel Analytics | Basic metrics | $10/month (advanced) |
| LogRocket | 1,000 sessions/month | $99/month (10k sessions) |
| Better Uptime | 10 monitors | $18/month (unlimited) |
| Playwright | Free (open source) | N/A |

**Recommended free tier setup:**
- Sentry (free)
- UptimeRobot (free)
- Playwright (free)
- Vercel Analytics (free basic)

**Total cost: $0/month** ✅

---

## Next Steps

When ready to implement:

1. Start with **High Priority** items (40 minutes total)
2. Test in development first
3. Deploy to production
4. Monitor for 1-2 weeks
5. Then tackle **Medium Priority** items

---

**Last Updated:** October 20, 2025  
**Status:** Ready for implementation when needed
