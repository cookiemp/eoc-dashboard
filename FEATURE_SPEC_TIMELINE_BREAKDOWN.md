# Feature Spec: Timeline Filter + Field Incidents Breakdown

**Created:** October 21, 2025  
**Updated:** October 21, 2025  
**Status:** Specification Phase - Ready for Implementation  
**Priority:** High Value Features

---

## Overview

Two **independent** features for different dashboards:
1. **Timeline Filter** (Main Dashboard) - Filter map by date range
2. **Field Incidents Breakdown** (Admin Dashboard) - Detailed drill-down with export

**Key Decision:** Features work independently - no cross-dashboard interaction

---

## Feature 1: Timeline Filter (Map)

### User Story
"As a dashboard user, I want to filter incidents by date range so I can analyze historical patterns and trends."

### Location
**Main Dashboard (Public)** - `/` route

### Current State
- Map shows all active incidents (no time filtering)
- No way to view historical data
- No indication of when incidents occurred
- Dashboard has: Map + News Feed + AI Summary (NO cards)

### Proposed Solution

#### UI Components

**Date Range Picker** (above the map)
```
┌─────────────────────────────────────────────────────┐
│  📅 Show incidents from:                            │
│  ┌──────────────┐  to  ┌──────────────┐           │
│  │ Oct 1, 2025  │  →   │ Oct 21, 2025 │  [Apply]  │
│  └──────────────┘      └──────────────┘           │
│                                                     │
│  Quick filters: [Last 7 days] [Last 30 days]      │
│                 [This Month] [All Time]            │
└─────────────────────────────────────────────────────┘
```

**Quick Filter Buttons:**
- **Last 7 days** - Most recent incidents
- **Last 30 days** - Monthly view
- **This Month** - Current month (auto-updates)
- **All Time** - No filter (show everything)

#### Default Behavior
- **Default view:** Last 30 days
- **Auto-update:** "This Month" and "Last 7/30 days" update automatically
- **Visual indicator:** Badge showing "Showing 45 incidents from Oct 1 - Oct 21"

#### Technical Implementation

**Data Structure:**
```typescript
interface DateFilter {
  startDate: Date;
  endDate: Date;
  preset?: 'last7' | 'last30' | 'thisMonth' | 'allTime';
}
```

**Filtering Logic:**
```typescript
// Filter incidents by date range
const filteredIncidents = allIncidents.filter(incident => {
  const incidentDate = new Date(incident.reportedAt);
  return incidentDate >= startDate && incidentDate <= endDate;
});
```

**Data Source:**
- Field incidents: `reportedAt` field (ISO string)
- News incidents: `publishedAt` or `createdAt` field

#### Edge Cases
- Empty results: Show "No incidents found in this date range"
- Future dates: Disable selection of future dates
- Invalid range: Start date must be before end date
- Performance: If >1000 incidents, consider pagination

---

## Feature 2: Field Incidents Breakdown

### User Story
"As an admin, I want to see a detailed breakdown of field incidents by location so I can understand incident distribution and patterns."

### Location
**Admin Dashboard** - `/admin` route

### Current State
- "Total Field Incidents" card shows only a number (e.g., "45")
- Card is on admin dashboard (NOT on main dashboard)
- No way to see breakdown by location, category, or severity
- No drill-down capability
- No export functionality

### Proposed Solution

#### UI Flow

**Step 1: Click the Card**
```
┌─────────────────────────────┐
│ Total Field Incidents       │
│                             │
│         45                  │  ← Click here
│                             │
│ [View Breakdown →]          │
└─────────────────────────────┘
```

**Step 2: Modal Opens**
```
┌──────────────────────────────────────────────────────────────┐
│  Field Incidents Breakdown                          [✕ Close] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  📅 Date Range: [Oct 1, 2025] to [Oct 21, 2025]  [Apply]     │
│  Quick: [Last 7 days] [Last 30 days] [This Month] [All Time] │
│                                                                │
│  Tabs: [📍 By Location] [📊 By Category] [⚠️ By Severity]    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ By Location (45 total incidents)                       │  │
│  │                                                         │  │
│  │ ▼ Addis Ababa (15 incidents)                          │  │
│  │   ├─ Bole: 8 incidents                                │  │
│  │   ├─ Kirkos: 5 incidents                              │  │
│  │   └─ Yeka: 2 incidents                                │  │
│  │                                                         │  │
│  │ ▼ Oromia (12 incidents)                               │  │
│  │   ├─ Adama: 7 incidents                               │  │
│  │   └─ Jimma: 5 incidents                               │  │
│  │                                                         │  │
│  │ ▼ Amhara (18 incidents)                               │  │
│  │   ├─ Bahir Dar: 10 incidents                          │  │
│  │   └─ Gondar: 8 incidents                              │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  [📥 Export as CSV] [📄 Export as PDF]                       │
└──────────────────────────────────────────────────────────────┘
```

**Note:** No "View on Map" buttons - admin dashboard is independent from main dashboard

#### Tabs Breakdown

**Tab 1: By Location** (Primary)
- Hierarchical tree view
- Grouped by region → city/zone → woreda/kebele
- Shows count per location
- Expandable/collapsible sections

**Tab 2: By Category**
```
Health: 12 incidents
Food Security: 8 incidents
Displacement: 7 incidents
WASH: 10 incidents
Security: 5 incidents
Other: 3 incidents
```

**Tab 3: By Severity**
```
Critical: 3 incidents
High: 8 incidents
Medium: 25 incidents
Low: 9 incidents
```

#### Location Hierarchy Logic

**Data Structure:**
```typescript
interface LocationBreakdown {
  region: string;
  count: number;
  subLocations: {
    name: string; // zone, woreda, or kebele
    count: number;
    incidents: FieldIncident[];
  }[];
}
```

**Parsing Logic:**
```typescript
// Parse locationName field to extract hierarchy
// Examples:
// "Addis Ababa, Bole" → Region: Addis Ababa, Sub: Bole
// "Oromia, Adama, Woreda 5" → Region: Oromia, Sub: Adama
// "Amhara, Bahir Dar" → Region: Amhara, Sub: Bahir Dar

function parseLocation(locationName: string): { region: string; subLocation?: string } {
  const parts = locationName.split(',').map(p => p.trim());
  return {
    region: parts[0],
    subLocation: parts[1] || undefined
  };
}
```

#### Date Filtering in Modal

**Independent Date Filter:**
- Modal has its own date range picker
- Does NOT sync with main dashboard
- Defaults to "All Time" when opened
- Quick filters: Last 7/30 days, This Month, All Time
- Updates breakdown tables when changed

#### Export Functionality

**CSV Export:**
```csv
Region,Sub-Location,Category,Severity,Title,Reported By,Date,Affected People
Addis Ababa,Bole,Health,High,Cholera Outbreak,John Doe,2025-10-15,150
Oromia,Adama,Food Security,Medium,Drought Impact,Jane Smith,2025-10-12,500
...
```

**PDF Export:**
- Professional report format
- Logo + header
- Summary statistics
- Breakdown tables
- Generated using a PDF library (e.g., jsPDF or react-pdf)

---

## Independent Feature Flows

### Flow 1: Main Dashboard (Public Users)

1. **User opens main dashboard** (`/`)
   - Map shows last 30 days of incidents (default)
   - Timeline filter visible above map

2. **User changes date range**
   - Selects Oct 1 - Oct 21
   - Clicks "Apply"
   - Map updates to show only incidents in that range
   - Badge shows: "Showing 45 incidents from Oct 1 - Oct 21"

3. **User uses quick filters**
   - Clicks "Last 7 days"
   - Map instantly updates
   - No page reload

### Flow 2: Admin Dashboard (Admins Only)

1. **Admin opens admin dashboard** (`/admin`)
   - Sees "Total Field Incidents: 45" card
   - Card shows total count (all time, no filter)

2. **Admin clicks card**
   - Modal opens with breakdown
   - Defaults to "All Time" view
   - Shows all 45 incidents grouped by location

3. **Admin filters by date in modal**
   - Changes to "Last 30 days"
   - Breakdown updates to show only recent incidents
   - Does NOT affect main dashboard

4. **Admin exports data**
   - Clicks "Export as CSV"
   - Downloads CSV with current date filter applied
   - Modal stays open

---

## Data Structure Analysis

### Field Incident Structure
```typescript
{
  id: string;                    // Firestore doc ID
  title: string;                 // "Cholera Outbreak - Addis Ababa, Bole"
  description: string;           // Full details
  latitude: number;              // 9.0320
  longitude: number;             // 38.7469
  color: string;                 // "#e74c3c" (category-based)
  
  // Field-specific fields
  sourceType: 'field_report';
  reportedBy: string;            // "John Doe" or "KoBo System"
  reportedAt: string;            // "2025-10-21T10:30:00Z" (ISO)
  category: 'health' | 'food_security' | 'displacement' | 'wash' | 'security' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPeople?: number;       // Optional: number of people affected
  locationName: string;          // "Addis Ababa, Bole" (hierarchical)
  status: 'active' | 'resolved' | 'archived';
  needsReview: boolean;          // Pending approval
  confidence: number;            // 0.0 - 1.0 (geocoding confidence)
  koboSubmissionId?: number;     // Optional: for duplicate detection
}
```

### Location Parsing Examples
```
"Addis Ababa, Bole"              → Region: Addis Ababa, Sub: Bole
"Oromia, Adama, Woreda 5"        → Region: Oromia, Sub: Adama
"Amhara, Bahir Dar"              → Region: Amhara, Sub: Bahir Dar
"Tigray"                         → Region: Tigray, Sub: (none)
"Addis Ababa"                    → Region: Addis Ababa, Sub: (none)
```

---

## Technical Considerations

### Performance
- **Caching:** Cache breakdown calculations (15 min TTL)
- **Pagination:** If >100 incidents, paginate the breakdown
- **Lazy loading:** Load sub-locations on expand

### State Management
- **Main Dashboard:** Use React state for date filter (no global state needed)
- **Admin Modal:** Independent state, no sync with main dashboard
- **Optional:** Persist main dashboard filter in URL params for sharing

### Accessibility
- Keyboard navigation for date picker
- Screen reader support for breakdown tree
- ARIA labels for all interactive elements

### Mobile Responsiveness
- Date picker: Use native mobile date input
- Modal: Full-screen on mobile
- Breakdown: Collapsible accordion on mobile

---

## Implementation Phases

### Phase 1: Timeline Filter (3-4 hours)
1. Add date range picker component (use shadcn/ui date picker)
2. Add quick filter buttons
3. Implement filtering logic
4. Add visual indicator badge
5. Test with existing incidents

### Phase 2: Breakdown Modal (2-3 hours)
1. Create modal component
2. Implement location parsing logic
3. Build hierarchical tree view
4. Add tab navigation
5. Test with various location formats

### Phase 3: Polish Timeline Filter (1 hour)
1. Add loading states
2. Add "Clear Filter" button
3. Add visual indicator badge
4. Test with various date ranges

### Phase 4: Export Functionality (2-3 hours)
1. Implement CSV export
2. Implement PDF export (optional, can be Phase 5)
3. Add download buttons
4. Test export formats

### Phase 5: Polish & Testing (1-2 hours)
1. Add loading states
2. Error handling
3. Empty states
4. Mobile responsiveness
5. Accessibility audit

**Total Estimated Time:** 8-12 hours (simplified due to independent features)

---

## Open Questions

1. **Location hierarchy:** Do all incidents have consistent location format?
2. **Date range limits:** Should there be a max date range (e.g., 1 year)?
3. **Export limits:** Should exports be limited to X incidents?
4. **Real-time updates:** Should breakdown auto-refresh when new incidents arrive?
5. ✅ **Permissions:** Breakdown is admin-only (confirmed)
6. ✅ **Dashboard independence:** Features work independently (confirmed)

---

## Success Metrics

- Users can filter map by date range
- Users can drill down into location-specific incidents
- Export functionality works reliably
- Page load time remains <2 seconds
- Mobile experience is smooth

---

## Future Enhancements (Not in Scope)

- Timeline slider (video scrubber style)
- Heatmap view by location
- Trend charts (incidents over time)
- Comparison mode (compare two date ranges)
- Email reports (scheduled exports)

---

## Summary

### Feature 1: Timeline Filter (Main Dashboard)
- **Location:** Public dashboard (`/`)
- **Purpose:** Filter map by date range
- **Default:** Last 30 days
- **Components:** Date range picker + Quick filters
- **Estimate:** 3-4 hours

### Feature 2: Field Incidents Breakdown (Admin Dashboard)
- **Location:** Admin dashboard (`/admin`)
- **Purpose:** Detailed analysis and export
- **Trigger:** Click "Total Field Incidents" card
- **Components:** Modal with tabs + Date filter + Export
- **Estimate:** 4-6 hours

### Key Decisions
✅ Features are **independent** (no cross-dashboard sync)  
✅ Main dashboard: Timeline filter only (no cards)  
✅ Admin dashboard: Breakdown modal only (no map integration)  
✅ Both have their own date filters  
✅ Export functionality in admin modal only  

---

**Status:** ✅ Spec finalized and ready for implementation  
**Next Step:** Start with Phase 1 (Timeline Filter on main dashboard)  
**Total Effort:** 8-12 hours
