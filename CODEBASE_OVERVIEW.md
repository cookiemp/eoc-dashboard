# ERCS Intel Dashboard - Complete Codebase Overview

**Last Updated:** 2025-10-01  
**Production:** Deployed on Vercel, linked to GitHub  
**Status:** Production-ready with PDF field reports feature

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Key Components](#key-components)
5. [Data Flow](#data-flow)
6. [AI Integration](#ai-integration)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Critical Files Reference](#critical-files-reference)
9. [Safety Guidelines](#safety-guidelines)

---

## 1. Project Overview

### Purpose
Intelligence dashboard for the **Ethiopian Red Cross Society (ERCS) Emergency Operations Center** to monitor:
- Humanitarian crises and emergencies
- Health alerts and disease outbreaks
- Food security and displacement
- General news affecting Ethiopia

### Core Features
1. **Interactive Incident Map** - Leaflet-based map showing humanitarian incidents across Ethiopia
2. **AI-Powered News Categorization** - Uses Google's Gemini AI to classify news as humanitarian vs. general
3. **Automated News Crawling** - GitHub Actions crawler runs every 30 minutes
4. **PDF Field Reports Processing** - Upload PDF reports, AI extracts incidents automatically
5. **Admin Panel** - Review, approve, and manage field incidents with authentication
6. **Real-time Dashboard** - Shows categorized news feeds with AI summaries
7. **Crawler Health Monitor** - Tracks crawler performance and reliability
8. **Smart Caching** - Multi-layer caching for fast page loads

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 15.3.3 (React 18.3.1)
- **Styling:** Tailwind CSS 3.4.1 with custom components
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React
- **Maps:** Leaflet 1.9.4 + React Leaflet 4.2.1
- **Charts:** Recharts 2.15.1
- **Forms:** React Hook Form + Zod validation

### Backend & Services
- **Runtime:** Node.js with TypeScript 5
- **AI Framework:** Genkit 1.13.0 with Google AI integration
- **PDF Processing:** pdf-parse 1.1.1 for text extraction
- **Web Scraping:** Puppeteer 24.15.0
- **Database:** Firebase Firestore (via firebase-admin 12.7.0)
- **Caching:** Firebase Firestore-based caching layer

### Development
- **Build Tool:** Turbopack (Next.js turbopack mode)
- **Type Checking:** TypeScript strict mode
- **Package Manager:** npm
- **Testing:** tsx for running TypeScript tests

---

## 3. Architecture

### Application Structure
```
eoc-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main dashboard page (CLIENT-SIDE)
│   │   ├── layout.tsx         # Root layout
│   │   ├── actions.ts         # Server actions (SERVER-SIDE)
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── page.tsx       # Admin dashboard
│   │   │   ├── login/         # Admin authentication
│   │   │   ├── upload/        # PDF upload page
│   │   │   └── pending/       # Review pending incidents
│   │   └── api/               # API routes
│   │       ├── crawler-health/
│   │       ├── process-pdf/   # PDF processing endpoint
│   │       └── admin/         # Admin API routes
│   │
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   │   ├── CrawlerHealth.tsx
│   │   │   ├── incident-map.tsx
│   │   │   ├── news-feed.tsx
│   │   │   └── ai-summary.tsx
│   │   └── ui/                # Shadcn UI components
│   │
│   ├── services/              # Business logic
│   │   ├── firebase-news-service.ts      # Read from Firebase
│   │   ├── incident-service.ts           # News-based incidents
│   │   ├── field-incidents-service.ts    # PDF field reports
│   │   ├── pdf-uploads-service.ts        # PDF upload tracking
│   │   ├── dashboard-cache-service.ts    # Dashboard caching
│   │   └── optimized-crawler-service.ts  # Web crawler base
│   │
│   ├── ai/                    # AI/Genkit flows
│   │   ├── genkit.ts          # AI configuration
│   │   └── flows/
│   │       ├── categorize-news-articles-flow.ts
│   │       ├── extract-incidents-from-news-flow.ts
│   │       ├── extract-incidents-from-pdf-flow.ts  # PDF extraction
│   │       ├── summarize-incident-data.ts
│   │       └── generate-incident-dossier-flow.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── firebase-admin.ts  # Firebase initialization
│   │   ├── types.ts           # Type definitions
│   │   └── utils.ts
│   │
│   └── config/
│       └── news-sites.ts      # Crawler site configurations
│
├── scripts/                   # Standalone scripts
│   └── github-actions-crawler.ts  # CI/CD crawler
│
├── .github/workflows/
│   └── crawler.yml           # GitHub Actions workflow
│
└── tests/                    # Test scripts
```

---

## 4. Key Components

### 4.1 Main Dashboard (`src/app/page.tsx`)
**Type:** Client Component (`'use client'`)

**State Management:**
- `incidents` - Map markers from AI extraction
- `humanitarianNews` - Categorized humanitarian articles
- `generalNews` - Categorized general news
- `newsLoading` - Loading state
- `isRefreshing` - Refresh indicator
- `lastUpdated` - Timestamp

**Data Fetching Functions:**
1. `fetchCachedDataFast()` - Initial load with cache
2. `fetchAllData()` - Full refresh with cache clearing
3. Auto-refresh every 30 minutes

**Component Layout:**
```tsx
<Header /> // Refresh button, last updated time
{loadingMessage && <Banner />} // Progress indicator
{newsStats && <StatsBar />} // AI analysis summary
<main>
  <IncidentMap /> // Leaflet map with incidents
  <CrawlerHealth /> // Crawler status monitor
  <NewsFeed humanitarian /> // Humanitarian news feed
  <NewsFeed general /> // General news feed
  <AiSummary /> // AI-generated summary
</main>
```

### 4.2 Server Actions (`src/app/actions.ts`)
**Type:** Server-only (`'use server'`)

**Key Functions:**

#### News Fetching
- `getAllNewsWithCategorization()` - Main orchestrator
  - Fetches from ReliefWeb, IFRC APIs
  - Gets crawled news from Firebase
  - Gets NewsAPI fallback
  - Runs AI categorization
  - Deduplicates and limits results

#### Caching
- `getCachedDashboardDataFast()` - Smart cache fetch
  - Returns cache if valid (15 min TTL)
  - Falls back to fresh data + caching
  
#### Incident Processing
- `processNewsIntoIncidents()` - Extracts map markers
- `getLatestIncidents()` - Fetches from Firestore
- `addIncidents()` - Stores with deduplication

#### AI Operations
- `getSummary()` - Generates AI summaries (30 min cache)
- `generateIncidentDossier()` - Detailed incident analysis

### 4.3 Firebase News Service (`src/services/firebase-news-service.ts`)
**Purpose:** Read crawler results from Firestore

**Collections:**
- `crawled_articles` - Scraped news articles
- `crawler_runs` - Execution history
- `crawler_metadata` - Health status

**Functions:**
- `getCrawledNews(limit)` - Get latest articles
- `getCrawlerHealth()` - Get health status
- `getCrawlerRunHistory(limit)` - Get run history

### 4.4 Dashboard Cache Service (`src/services/dashboard-cache-service.ts`)
**Purpose:** Performance optimization via Firestore caching

**Cache Structure:**
```typescript
{
  humanitarian: CategorizedArticle[],
  general: CategorizedArticle[],
  incidents: IncidentWithId[],
  summary: { humanitarianCount, generalCount },
  lastUpdated: string,
  cacheValidUntil: string  // 15-minute TTL
}
```

**Storage:** `dashboard_cache/current_data` document

### 4.5 Incident Service (`src/services/incident-service.ts`)
**Purpose:** Manage map incidents

**Storage:** Firestore `incidents` collection (max 10 incidents)

**Operations:**
- Deduplication by title
- Auto-cleanup of old incidents
- Sorted by `addedAt` timestamp

### 4.6 Crawler Health Monitor (`src/components/dashboard/CrawlerHealth.tsx`)
**Purpose:** Display crawler system health

**Displays:**
- Last run timestamp
- Success rate (%)
- Total articles crawled
- Average articles per run
- Health status badge

**Data Source:** `/api/crawler-health` endpoint

### 4.7 PDF Field Reports System

#### Overview
Allows ERCS staff to upload PDF field reports and automatically extract structured incident data using AI.

#### Components

**Admin Panel (`src/app/admin/`)**
- **Authentication:** Cookie-based session (ADMIN_PASSWORD env variable)
- **Upload Page:** Multi-file PDF upload with drag-and-drop
- **Pending Review:** List incidents awaiting approval
- **Dashboard:** Statistics (total incidents, pending, recent uploads)

**Services:**
- `field-incidents-service.ts` - Manage field incidents in Firestore
- `pdf-uploads-service.ts` - Track PDF upload history

**Firestore Collections:**
- `field_incidents` - Extracted incidents with metadata
- `pdf_uploads` - Upload tracking for statistics

**AI Flow (`extract-incidents-from-pdf-flow.ts`)**
- Extracts text from PDF using pdf-parse
- AI identifies humanitarian incidents
- Maps location names to Ethiopian coordinates
- Categorizes by type (health, food security, displacement, WASH, security, other)
- Assigns severity levels (low, medium, high, critical)
- Calculates confidence scores
- Flags low-confidence incidents for review

**Features:**
- Auto-approve option for trusted reports
- Manual review and approval workflow
- Visual marker distinction (diamond shape for field reports)
- Automatic marker offsetting for overlapping locations
- Cache clearing on approval for instant dashboard updates

---

## 5. Data Flow

### 5.1 Initial Page Load
```
User visits dashboard
    ↓
page.tsx useEffect → fetchCachedDataFast()
    ↓
getCachedDashboardDataFast() server action
    ↓
Check Firestore cache (15 min TTL)
    ↓
├─ Cache HIT → Return instantly
│
└─ Cache MISS → Fresh fetch:
    ├─ getAllNewsWithCategorization()
    │   ├─ Humanitarian APIs (ReliefWeb, IFRC)
    │   ├─ Firebase crawled news
    │   ├─ NewsAPI fallback
    │   └─ AI categorization (Gemini)
    │
    ├─ getLatestIncidents() from Firestore
    │
    └─ setCachedDashboardData() → Store in cache
    ↓
Display on UI
```

### 5.2 Manual Refresh Flow
```
User clicks refresh
    ↓
fetchAllData()
    ↓
clearDashboardCache() → Delete cache
    ↓
getAllNewsWithCategorization() → Fresh data
    ↓
processNewsIntoIncidents() → Extract incidents
    ↓
getLatestIncidents() → Get from Firestore
    ↓
setCachedDashboardData() → Cache results
    ↓
Update UI
```

### 5.3 GitHub Actions Crawler Flow (Every 30 minutes)
```
GitHub Actions trigger (cron: */30 * * * *)
    ↓
scripts/github-actions-crawler.ts
    ↓
OptimizedCrawlerService
    ├─ BBC Africa crawler
    ├─ Al Jazeera Africa crawler
    └─ Other configured sites
    ↓
Save to Firestore:
    ├─ crawled_articles (with deduplication)
    ├─ crawler_runs (metadata)
    └─ crawler_metadata/status (health info)
    ↓
Cleanup old articles (keep last 100 per source)
    ↓
Dashboard auto-refreshes or serves from cache
```

### 5.4 PDF Field Report Processing Flow
```
Admin uploads PDF(s)
    ↓
/admin/upload page (client)
    ↓
POST /api/process-pdf
    ├─ Validate PDF file (type, size < 5MB)
    ├─ Extract text with pdf-parse
    └─ Call AI: extractIncidentsFromPDF()
        ├─ Parse incident details
        ├─ Map locations to coordinates
        ├─ Categorize and assess severity
        └─ Calculate confidence scores
    ↓
Return extracted incidents to client
    ↓
Admin reviews incidents (if not auto-approve)
    ↓
POST /api/admin/publish-incidents
    ├─ Save to field_incidents collection
    ├─ Log to pdf_uploads collection
    └─ Set needsReview flag
    ↓
Admin approves incident (if needed)
    ↓
POST /api/admin/approve-incident
    ├─ Update needsReview = false
    ├─ Clear dashboard cache
    └─ Revalidate main page
    ↓
Incident appears on main dashboard map
```

---

## 6. AI Integration

### 6.1 Genkit Configuration (`src/ai/genkit.ts`)
**Model:** Google Gemini via `@genkit-ai/googleai`

**Environment Variables:**
- `GOOGLE_API_KEY` or `GEMINI_API_KEY`

### 6.2 AI Flows

#### News Categorization (`categorize-news-articles-flow.ts`)
**Input:** Array of news articles
**Output:** 
```typescript
{
  categorizedArticles: CategorizedArticle[],
  summary: {
    totalArticles: number,
    humanitarianCount: number,
    generalCount: number
  }
}
```

**Prompt Engineering:**
- Humanitarian indicators: Emergency response, health crises, food security, displacement, WASH, etc.
- General indicators: Politics, economy, sports, culture, development projects
- Confidence scoring (0-1)
- Reasoning for classification

#### Incident Extraction (`extract-incidents-from-news-flow.ts`)
**Input:** Humanitarian articles
**Output:** Array of incidents with:
```typescript
{
  title: string,
  description: string,
  latitude: number,
  longitude: number,
  color: string  // '#ef4444' (red), '#3b82f6' (blue), etc.
}
```

**Smart Geographic Distribution:**
- Maps article content to Ethiopian regions
- Avoids clustering in Addis Ababa
- Uses region-specific coordinates based on incident type

#### Summary Generation (`summarize-incident-data.ts`)
**Input:** News articles
**Output:** Formatted AI summary with bullet points
**Cache:** 30-minute TTL in Firestore

#### Incident Dossier (`generate-incident-dossier-flow.ts`)
**Input:** Single incident details
**Output:** Executive summary with recommendations
**Trigger:** User clicks map marker

#### PDF Incident Extraction (`extract-incidents-from-pdf-flow.ts`)
**Input:** PDF text content
**Output:** Array of structured field incidents with:
```typescript
{
  title: string,
  description: string,
  latitude: number,
  longitude: number,
  locationName: string,
  category: 'health' | 'food_security' | 'displacement' | 'wash' | 'security' | 'other',
  severity: 'low' | 'medium' | 'high' | 'critical',
  color: string,
  affectedPeople?: number,
  confidence: number,  // 0-1
  needsReview: boolean  // true if confidence < 0.7
}
```

**Geographic Intelligence:**
- Maps Ethiopian region/city names to coordinates
- Uses reference list of major Ethiopian regions
- Falls back to regional capitals when exact location unclear
- Flags uncertain locations for review

---

## 7. Deployment & Infrastructure

### 7.1 Vercel Deployment
**Platform:** Vercel
**Repo:** GitHub (auto-deploy on push to main)
**Build Command:** `npm run build`
**Environment Variables:**
```bash
GOOGLE_API_KEY=xxx
NEWSAPI_API_KEY=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
ADMIN_PASSWORD=xxx  # For admin panel authentication
```

**Configuration:**
- `vercel.json` - Build memory limit (4GB)
- `next.config.ts` - TypeScript/ESLint bypass, webpack config

### 7.2 GitHub Actions
**Workflow:** `.github/workflows/crawler.yml`
**Schedule:** Every 30 minutes (`*/30 * * * *`)
**Timeout:** 25 minutes (buffer before 30-min limit)

**Environment:**
- Ubuntu latest
- Node.js 18
- Chrome stable (for Puppeteer)

**Required Secrets:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GOOGLE_API_KEY`
- `NEWSAPI_API_KEY`

### 7.3 Firebase Configuration
**Collections:**
```
crawled_articles/          # Crawled news (max 100 per source)
crawler_runs/              # Run history
crawler_metadata/status    # Health status doc
incidents/                 # News-based map incidents (max 10)
field_incidents/           # PDF field report incidents (max 50)
pdf_uploads/               # PDF upload tracking
cache/daily-summary       # AI summary cache
dashboard_cache/current_data  # Dashboard cache
```

**Indexes Required:**
- `crawled_articles`: `isActive` (asc) + `crawledAt` (desc)
- `incidents`: `addedAt` (desc)
- `field_incidents`: `status` (asc) + `reportedAt` (desc)
- `field_incidents`: `needsReview` (asc) + `status` (asc) + `reportedAt` (desc)
- `pdf_uploads`: `uploadedAt` (desc)

---

## 8. Critical Files Reference

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript config |
| `next.config.ts` | Next.js config, webpack customization |
| `vercel.json` | Vercel build settings |
| `tailwind.config.ts` | Tailwind CSS setup |

### Core Application
| File | Type | Purpose |
|------|------|---------|
| `src/app/page.tsx` | Client | Main dashboard UI |
| `src/app/layout.tsx` | Both | Root layout |
| `src/app/actions.ts` | Server | Server actions |
| `src/lib/firebase-admin.ts` | Server | Firebase initialization |
| `src/lib/types.ts` | Both | Shared types |

### Services
| File | Type | Purpose |
|------|------|---------|
| `src/services/firebase-news-service.ts` | Server | Read Firebase data |
| `src/services/incident-service.ts` | Server | News-based incidents |
| `src/services/field-incidents-service.ts` | Server | PDF field report incidents |
| `src/services/pdf-uploads-service.ts` | Server | PDF upload tracking |
| `src/services/dashboard-cache-service.ts` | Server | Dashboard caching |
| `src/services/optimized-crawler-service.ts` | Server | Crawler base class |

### AI Flows
| File | Purpose |
|------|---------|
| `src/ai/genkit.ts` | Genkit initialization |
| `src/ai/flows/categorize-news-articles-flow.ts` | News categorization |
| `src/ai/flows/extract-incidents-from-news-flow.ts` | News incident extraction |
| `src/ai/flows/extract-incidents-from-pdf-flow.ts` | PDF incident extraction |
| `src/ai/flows/summarize-incident-data.ts` | Summary generation |

### Automation
| File | Purpose |
|------|---------|
| `.github/workflows/crawler.yml` | GitHub Actions workflow |
| `scripts/github-actions-crawler.ts` | Crawler execution script |

---

## 9. Safety Guidelines

### 🚨 CRITICAL: Things NOT to Break

#### 1. Server Action Directive
**NEVER remove** `'use server'` from:
- `src/app/actions.ts`
- Any file in `src/services/`
- Any file in `src/ai/flows/`

**Why:** These run on server-side only and access secrets

#### 2. Client Component Directive
**ALWAYS keep** `'use client'` on:
- `src/app/page.tsx`
- `src/components/dashboard/*` (most of them)

**Why:** These use hooks like `useState`, `useEffect`

#### 3. Environment Variables
**NEVER commit or expose:**
```bash
GOOGLE_API_KEY
NEWSAPI_API_KEY
FIREBASE_PRIVATE_KEY
ADMIN_PASSWORD
```

**Check:** `.env.local` is in `.gitignore`

#### 4. Firebase Indexes
**If adding queries with multiple fields:**
1. Test locally
2. Firebase will show index creation link
3. Create the index before deploying

#### 5. Caching Logic
**Be careful with TTL values in:**
- `dashboard-cache-service.ts` (15 min)
- `actions.ts` summary cache (30 min)

**Why:** Too short = API quota issues, Too long = stale data

#### 6. AI Prompt Modifications
**When changing prompts in `src/ai/flows/`:**
- Test with multiple article types
- Verify output schema matches
- Check token usage (cost implications)

#### 7. Incident Limit
**Current max:** 10 incidents (hardcoded in `incident-service.ts`)
**Why:** Performance on map, Firestore costs

#### 8. GitHub Actions Timeout
**Current:** 25 minutes (buffer before 30-min limit)
**Why:** Prevent workflow termination mid-crawl

---

## 10. Common Development Tasks

### Add a New News Source
1. Add config to `src/config/news-sites.ts`
2. Optionally create specialized crawler in `src/services/`
3. Test with `npm run test:crawlers`
4. Deploy (auto-runs in GitHub Actions)

### Add New AI Feature
1. Create flow in `src/ai/flows/new-flow.ts`
2. Define input/output schemas with Zod
3. Create prompt with `ai.definePrompt()`
4. Export function for use in `actions.ts`
5. Test with `npm run genkit:dev`

### Add New Dashboard Component
1. Create component in `src/components/dashboard/`
2. Use `'use client'` if it needs hooks
3. Import into `src/app/page.tsx`
4. Add to grid layout

### Modify Caching Strategy
1. Update TTL in `dashboard-cache-service.ts`
2. Update logic in `actions.ts` → `getCachedDashboardDataFast()`
3. Test cache hit/miss scenarios

### Debug GitHub Actions Crawler
1. Check workflow logs in GitHub Actions tab
2. Look for Puppeteer errors (timeouts, selectors)
3. Test locally: `npm run crawl:github-actions`
4. Review Firestore data in Firebase Console

---

## 11. Testing

### Run Tests
```bash
# Test all crawlers
npm run test:crawlers

# Test UN OCHA crawler
npm run test:un-ocha

# Analyze site structure
npm run analyze:sites

# Manual crawler trigger (uses GitHub script locally)
npm run crawl:github-actions
```

### Local Development
```bash
# Start Next.js dev server
npm run dev

# Start Genkit dev UI (for AI flow testing)
npm run genkit:dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 12. Known Issues & Limitations

### Crawler Sites
✅ **Working:**
- BBC Africa
- Al Jazeera Africa
- ReliefWeb API
- IFRC API

⚠️ **Limited:**
- Ethiopian News Agency (mostly Facebook links)

❌ **Blocked:**
- Addis Standard (Cloudflare protection)
- Reuters Africa (timeout issues)
- UN OCHA (no article links detected)

### Rate Limits
- **Gemini API:** Check quota in Google Cloud Console
- **NewsAPI:** 100 requests/day on free tier
- **Firebase:** Firestore read/write quotas

### Performance
- Initial load: 2-5 seconds (with cache)
- Fresh data load: 15-30 seconds (with AI processing)
- GitHub Actions crawler: 10-20 minutes per run

---

## 13. Future Enhancements (From ENHANCEMENT_PLAN.md)

### Planned Features
1. **Archived News Page** - Historical article browsing
2. **Enhanced Crawler Health** - Email/Slack alerts
3. **Localization** - Amharic translation
4. **Mobile Optimization** - Responsive improvements
5. **User Personalization** - Bookmarking, favorites

### Technical Debt
1. Improve error handling in crawlers
2. Add comprehensive test suite
3. Implement retry mechanisms
4. Rate limiting for crawlers
5. Better TypeScript strict mode compliance

---

## 14. Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                     # Start production server

# Testing
npm run test:crawlers         # Test crawler suite
npm run typecheck            # TypeScript validation

# AI Development
npm run genkit:dev           # Genkit dev UI
npm run genkit:watch         # Auto-reload Genkit

# Utilities
npm run cleanup:duplicates   # Remove duplicate articles
npm run analyze:sites        # Analyze site structure
```

---

## 15. Contact & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Genkit: https://firebase.google.com/docs/genkit
- Firebase: https://firebase.google.com/docs

### Project Files
- Enhancement Plan: `ENHANCEMENT_PLAN.md`
- Crawler Checklist: `CRAWLER_PROJECT_CHECKLIST.md`
- Safe Changes: `SAFE_CHANGE_CHECKLIST.md`

---

**End of Overview - You are now ready to work on this codebase safely!** 🚀