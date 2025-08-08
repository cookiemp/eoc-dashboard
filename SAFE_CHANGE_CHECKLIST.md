# Safe Change & Deployment Checklist

This checklist is designed to help you make changes without breaking production for the ERCS Intel Dashboard.

Project paths:
- Repo root: eoc-dashboard
- App stack: Next.js 15 (app router) + TypeScript + Tailwind + shadcn/ui
- Services: Firebase Admin, AI via Genkit/Gemini, custom news crawlers

---

## 0) Pre-flight: Issue scope
- [ ] Define the change: feature/bug/ops
- [ ] Identify affected areas (UI, API routes, services, crawlers, AI flows, caching)
- [ ] Assess production risk and required fallbacks/rollbacks

## 1) Branching & Version Control
- [ ] Create a feature branch from main
  - Example: `git checkout -b feat/<short-topic>` or `fix/<short-topic>`
- [ ] Keep commits small; messages concise and to the point
- [ ] Rebase onto main before opening PR: `git fetch origin && git rebase origin/main`

## 2) Environment & Secrets
- [ ] Copy env: `.env.example` → `.env.local` (do not use prod secrets locally)
- [ ] Ensure required vars are set:
  - [ ] GOOGLE_API_KEY (Gemini)
  - [ ] NEWSAPI_API_KEY
  - [ ] Firebase Admin creds set via env or local emulator; avoid committing JSON key files
- [ ] Verify next.config.ts forwards only intended env to client
- [ ] Never print secrets (avoid echoing secret values)

## 3) Local Setup & Sanity Checks
- [ ] Install deps: `npm ci` (or `npm i`)
- [ ] Type check: `npm run typecheck`
- [ ] Lint (if enabled): `npm run lint`
- [ ] Dev server: `npm run dev` (verify pages load: `/`, `/archive`, `/debug-health`)

## 4) Tests & Validations
- Crawlers (run locally only):
  - [ ] BBC: `tsx src/scripts/test-bbc-crawler.ts`
  - [ ] Al Jazeera: `tsx src/scripts/test-aljazeera-crawler.ts`
  - [ ] Full suite: `npm run test:crawlers`
- AI flows (optional/local):
  - [ ] Genkit dev: `npm run genkit:dev` or `npm run genkit:watch`
- API routes:
  - [ ] `/api/crawler-health` returns expected shape and values
  - [ ] `/api/archived-news` returns expected data
  - [ ] Debug endpoints only used locally
- UI smoke:
  - [ ] Check loading states, error toasts, and map rendering
  - [ ] Verify “smart caching” shows instant reloads (no stale data)

## 5) Crawler Safety
- [ ] Do NOT run headless browser automation in Vercel serverless
- [ ] Use GitHub Actions or a dedicated worker for scheduled crawls
- [ ] Respect robots, add rate limits, timeouts, and retries
- [ ] Ensure deduplication is active before persisting
- [ ] Point Firebase writes to non-prod project during tests

## 6) Caching & Data Freshness
- [ ] Review src/services/dashboard-cache-service.ts usage
- [ ] If UI shows stale metrics, hard-refresh or invalidate caches
- [ ] Confirm summary-cache.json and incidents-cache.json behavior in local only
- [ ] Avoid committing transient cache files

## 7) API Contracts & Types
- [ ] Confirm types in src/lib/types.ts match API responses
- [ ] Validate frontend consumption (e.g., CrawlerHealth.tsx) aligns with API fields
- [ ] Add runtime guards/logging where mismatch is possible

## 8) Build & Preview
- [ ] Build locally: `npm run build`
- [ ] Open PR to trigger Vercel preview deployment
- [ ] Verify preview env vars configured on Vercel (no prod key leakage)
- [ ] Smoke test preview: pages, API routes, and basic flows

## 9) Pre-Deploy Checklist (to main)
- [ ] Rebase/merge main; resolve conflicts; run local build again
- [ ] Confirm vercel.json and next.config.ts are correct
- [ ] Ensure GitHub Actions crawlers won’t run with breaking changes (or pause if needed)
- [ ] Another person reviews PR (if available)

## 10) Deploy & Monitor
- [ ] Merge to main; wait for Vercel production deployment
- [ ] Post-deploy checks:
  - [ ] Homepage renders without errors
  - [ ] `/api/crawler-health` returns valid numbers
  - [ ] Map markers render and interactions work
  - [ ] News feed loads; links resolve
- [ ] Monitor logs and errors (Vercel, Firebase)

## 11) Rollback Plan
- [ ] Have a revert strategy ready: `git revert <sha>`; redeploy
- [ ] If crawler changes caused issues, disable schedules in CI and re-enable after fix
- [ ] Restore previous cache/data if new cache logic misbehaves

## 12) Post-Deploy Cleanups
- [ ] Remove any temporary debug logs/flags
- [ ] Update docs if API/UI changed (README, FUTURE_IMPROVEMENTS.md)
- [ ] Create follow-up tasks for deferred improvements

---

## Quick Commands (PowerShell-friendly)
- Install: `npm ci`
- Typecheck: `npm run typecheck`
- Dev: `npm run dev`
- Build: `npm run build`
- Run crawlers locally: `npm run test:crawlers`
- Individual scripts: `tsx .\src\scripts\test-bbc-crawler.ts`

---

## Notes Specific to This Repo
- next.config.ts exposes GOOGLE_API_KEY and NEWSAPI_API_KEY to the app; ensure Vercel envs are set correctly
- Crawler automation should run in GitHub Actions or a worker, not in Vercel runtime
- Firebase Admin should be configured via environment (avoid committing service account files)
- Keep commit messages concise
