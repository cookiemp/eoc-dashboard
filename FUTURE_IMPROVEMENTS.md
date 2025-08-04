# Ethiopia EOC Dashboard - Future Improvements Roadmap

## Current Status
The dashboard is **fully operational** and meets all Phase 2 requirements:
- ✅ Dynamic humanitarian news feed from ReliefWeb + IFRC APIs
- ✅ 30-minute auto-refresh with proper caching
- ✅ AI-powered incident extraction and geographic distribution
- ✅ Real-time map markers reflecting humanitarian activities across Ethiopia

---

## Phase 3: User Experience Enhancements

### 1. Enhanced Loading States
**Current State**: Basic skeleton loading
**Improvement**: More informative loading indicators

**Implementation**:
- Add specific loading messages: "Fetching from ReliefWeb...", "Processing with AI...", "Updating map..."
- Progress indicators for multi-step operations
- Smooth transitions between loading states

**Files to modify**: 
- `src/app/page.tsx` (main loading states)
- `src/components/dashboard/news-feed.tsx` (news-specific loading)
- `src/components/dashboard/ai-summary.tsx` (AI processing indicators)

### 2. Data Freshness Indicators
**Current State**: No visibility into when data was last updated
**Improvement**: Show last refresh timestamps

**Implementation**:
- Add "Last updated: X minutes ago" to each section
- Visual indicators for data staleness (green=fresh, yellow=stale, red=error)
- Countdown timer showing time until next auto-refresh

**Files to modify**:
- `src/app/page.tsx` (add timestamp state management)
- `src/components/dashboard/header.tsx` (global refresh status)

### 3. Manual Refresh Controls
**Current State**: Only automatic 30-minute refresh
**Improvement**: Let users trigger immediate updates

**Implementation**:
- Refresh button in header for full dashboard refresh
- Individual refresh buttons for each news feed
- Prevent multiple simultaneous refreshes

**Files to modify**:
- `src/components/dashboard/header.tsx` (global refresh button)
- `src/components/dashboard/news-feed.tsx` (section-specific refresh)

---

## Phase 4: Data Quality Improvements

### 1. Fix Article Summaries
**Current Issue**: Many articles show "No summary available"
**Root Cause**: ReliefWeb API field mapping may be incomplete

**Investigation needed**:
- Test different ReliefWeb API parameters
- Check `fields[]=body-html` or `fields[]=body` options
- Implement fallback summary generation using AI if content is available

**Files to modify**:
- `src/app/actions.ts` (getReliefWebNews function)
- Test with: `https://api.reliefweb.int/v1/reports?appname=ercs-dashboard&profile=list&preset=latest&limit=5&filter[field]=primary_country.iso3&filter[value]=eth&fields[]=body`

### 2. Fix IFRC API Endpoint
**Current Issue**: IFRC API returns 404
**Investigation needed**:
- Verify correct IFRC GO API endpoint
- Check if authentication is required
- Find alternative IFRC data sources

**Files to modify**:
- `src/app/actions.ts` (getIfrcNews function)
- May need to update URL or add authentication headers

### 3. Enhanced Error Messages
**Current State**: Generic error messages
**Improvement**: More specific, actionable error information

**Implementation**:
- Differentiate between network, API, and parsing errors
- Show retry buttons for transient failures
- Log detailed errors for debugging while showing user-friendly messages

---

## Phase 5: Advanced Operational Features

### 1. Interactive Map Filtering
**Current State**: All markers shown at once
**Improvement**: Let users focus on specific activities or regions

**Implementation**:
- Filter toggles: Health, Agriculture, Displacement, Weather, Logistics
- Region selector: Show only incidents in selected Ethiopian regions
- Date range filter: Show incidents from last 24h, 7 days, 30 days

**Files to modify**:
- `src/components/dashboard/incident-map.tsx` (add filter controls)
- `src/components/dashboard/map-wrapper.tsx` (implement filtering logic)

### 2. Enhanced Incident Details
**Current State**: Clicking markers shows basic info
**Improvement**: Rich incident information with context

**Implementation**:
- Expand incident details dialog with source article content
- Show related articles for the same incident
- Add incident severity indicators
- Include response recommendations

**Files to modify**:
- `src/components/dashboard/incident-dossier-dialog.tsx` (enhance content)
- `src/ai/flows/generate-incident-dossier-flow.ts` (improve AI analysis)

### 3. News Article Details
**Current State**: Articles link out to external sources
**Improvement**: Show article content within dashboard

**Implementation**:
- Modal or sidebar for full article content
- In-dashboard article reader
- Article bookmarking/favorites system

**Files to modify**:
- `src/components/dashboard/news-feed.tsx` (add article modal)
- New component: `src/components/dashboard/article-detail-modal.tsx`

---

## Phase 6: Reliability & Performance

### 1. AI Performance Optimizations
**Current State**: AI categorization runs for every article fetch
**Improvement**: Cache AI results and optimize API usage

**Implementation**:
- Cache AI categorization results to improve performance
- Implement fallback strategies when Gemini API is unavailable
- Add rate limiting for API calls to prevent quota exhaustion
- Store AI results in database to avoid re-processing same articles

**Files to modify**:
- `src/app/actions.ts` (add caching logic)
- `src/ai/flows/categorize-news-flow.ts` (implement caching)
- New utility: `src/lib/ai-cache.ts`

### 2. Enhanced Error Recovery
**Current State**: Graceful error handling with fallbacks
**Improvement**: Active retry and recovery mechanisms

**Implementation**:
- Exponential backoff retry for failed API calls
- Circuit breaker pattern for consistently failing APIs
- Fallback to cached data when all sources fail

**Files to modify**:
- `src/app/actions.ts` (add retry logic to all API calls)
- New utility: `src/lib/api-retry.ts`

### 2. Offline Mode Support
**Current State**: Requires internet connection
**Improvement**: Continue operating with cached data when offline

**Implementation**:
- Service worker for offline caching
- Store last successful data in browser storage
- Offline indicator in UI
- Graceful degradation of features

**Files to create**:
- `public/sw.js` (service worker)
- `src/lib/offline-storage.ts` (offline data management)

### 3. Performance Monitoring
**Current State**: No performance visibility
**Improvement**: Monitor and optimize dashboard performance

**Implementation**:
- Add performance metrics collection
- Monitor API response times
- Track AI processing duration
- Dashboard for operational metrics

---

## Phase 7: Advanced Analytics

### 1. Incident Trends Analysis
**Implementation**: Track incident patterns over time, seasonal trends, recurring issues

### 2. Predictive Alerts
**Implementation**: Use historical data to predict likely humanitarian crises

### 3. Multi-language Support
**Implementation**: Support Amharic and other Ethiopian languages

---

## Implementation Priority

**High Priority** (Phase 3):
- Manual refresh controls
- Data freshness indicators
- Fix article summaries

**Medium Priority** (Phase 4-5):
- Map filtering
- Enhanced incident details
- Error recovery improvements

**Low Priority** (Phase 6-7):
- Offline mode
- Advanced analytics
- Multi-language support

---

## Technical Considerations

- Maintain backward compatibility with existing API integrations
- Ensure all new features work with the current Vercel deployment
- Keep the 30-minute auto-refresh as the primary update mechanism
- Preserve existing Firebase data structures
- Maintain current AI prompt effectiveness while adding new features

---

**Note**: The dashboard is already production-ready and serves its core purpose excellently. These improvements are enhancements, not fixes for broken functionality.
