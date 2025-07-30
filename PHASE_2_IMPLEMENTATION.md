# Ethiopia EOC Dashboard - Phase 2 Implementation Plan

## Objective
Transition the dashboard from its current state into a dynamic, auto-refreshing operational tool. The primary goals are to implement live data fetching for all news feeds, set a standard 30-minute auto-refresh interval, and enable automatic UI updates without requiring page reloads.

## Current State
- **Deployment:** The application is successfully deployed on Vercel
- **Database:** Firebase Firestore is implemented for persisting incidents and AI-generated summaries
- **General News Feed:** This feed is **dynamic**, pulling from NewsAPI.org (BBC, Reuters, etc.). However, its caching is temporarily disabled for debugging
- **Humanitarian News Feed:** This feed is currently **static**. It uses a hardcoded list of curated, Ethiopia-specific articles as a temporary fix. It is **not** fetching live data
- **AI Summary:** The feature works but its cache is also temporarily disabled to ensure it processes the latest articles
- **Update Mechanism:** All data updates currently require a manual page reload

---

## 1. Implement Dynamic Humanitarian News Feed

### Goal
Replace the static, hardcoded humanitarian news with a live feed from reliable, multi-source APIs.

### File to Edit
`src/app/actions.ts`

### Function to Modify
`getHumanitarianNews()`

### Instructions
1. Remove the hardcoded `mockEthiopiaNews` array that is currently providing the static content
2. Implement `fetch` calls to at least two reliable humanitarian APIs using `Promise.allSettled` to ensure resilience (so that if one API fails, the others can still provide data)
   
   **Source 1: ReliefWeb API** - Use the following endpoint, which is strictly filtered to only include reports where the primary country is Ethiopia:
   ```
   https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&profile=list&preset=latest&limit=10&filter[field]=primary_country.iso3&filter[value]=eth
   ```
   
   **Source 2: IFRC GO API** - Continue to use the existing, functional API call for Ethiopia-specific appeals:
   ```
   https://go-api.ifrc.org/api/v2/appeal/?country__in=ET
   ```

3. Process the results from `Promise.allSettled`. For each successful API call, parse the response and transform the data into the standard `NewsArticle` type
4. Combine the articles from all successful calls into a single array
5. Deduplicate the combined list to prevent showing the same story from multiple sources. A simple title match is sufficient
6. If all API calls fail, return a user-friendly error message

---

## 2. Standardize Content Update Frequency

### Goal
Ensure all external data (both news feeds and AI summaries) is refreshed every 30 minutes.

### File to Edit
`src/app/actions.ts`

### Instructions
1. Locate all `fetch` calls within the `getHumanitarianNews` and `getGeneralNews` functions
2. Modify the options for each `fetch` call to use Vercel's standard revalidation mechanism. Change any existing `cache: 'no-store'` or other settings to:
   ```typescript
   next: { revalidate: 1800 } // 1800 seconds = 30 minutes
   ```
3. **Re-enable AI Summary Caching:** In the `getSummary` function, uncomment the caching logic that was previously disabled for debugging. The application should now check for a cached summary and only regenerate it if the cache is more than 30 minutes old or if the underlying articles have changed

---

## 3. Implement Auto-Refresh Functionality

### Goal
Make the dashboard UI update automatically with fresh data every 30 minutes without requiring a user to manually reload the page.

### File to Edit
`src/app/page.tsx`

### Instructions
1. In the `Home` component, find the `useEffect` hook that currently fetches data on component mount
2. Refactor the data-fetching logic currently inside that `useEffect` into a standalone asynchronous function, for example, `fetchAllData()`
3. Modify the `useEffect` hook to:
   - Call `fetchAllData()` immediately to perform the initial data load
   - Use `setInterval` to call `fetchAllData()` repeatedly every 30 minutes
   - Store the interval ID and use it in the cleanup function of the `useEffect` hook to clear the interval when the component unmounts, preventing memory leaks

### Example Structure
```typescript
useEffect(() => {
  const fetchAllData = async () => {
    // ... all the logic to call getHumanitarianNews, getGeneralNews, etc.
    // ... and to update the state with setHumanitarianNews, setGeneralNews, etc.
  };

  fetchAllData(); // Initial call

  const intervalId = setInterval(fetchAllData, 1800000); // 30 minutes in milliseconds

  return () => clearInterval(intervalId); // Cleanup
}, []);
```

---

## Technical Notes

### Environment Variables Required
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GOOGLE_API_KEY` (for Gemini AI)
- `NEWSAPI_API_KEY` (for general news from NewsAPI.org)

### Current API Endpoints
- **General News:** NewsAPI.org with sources: `bbc-news,reuters,associated-press,the-guardian-uk`
- **Humanitarian News:** Currently static, needs to be made dynamic
- **AI Processing:** Google Gemini via Genkit
- **Database:** Firebase Firestore

### Deployment
- Platform: Vercel
- Repository: GitHub (auto-deploy on push to main)
- Build Command: `npm run build`
- Function Timeout: Currently set to handle AI processing

---

This specification provides a clear path forward to complete the requested features for a fully operational emergency operations center dashboard.
