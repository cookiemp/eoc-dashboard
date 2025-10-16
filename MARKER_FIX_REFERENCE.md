# Quick Fix: Make Field Report Markers More Distinct

**File:** `src/components/dashboard/map-wrapper.tsx`
**Function:** `createIncidentIcon` (around line 40-70)

## Current Implementation

The code is already set up to handle field reports differently, but the visual difference might not be obvious.

## Quick Fix Options (Choose One)

### Option 1: Diamond Shape (Recommended - Most Visible)
```typescript
function createIncidentIcon(color: string, isFieldReport: boolean = false) {
  if (isFieldReport) {
    // Diamond shape for field reports
    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: ${color};
          border: 3px solid #000;
          transform: rotate(45deg);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  
  // Existing circle for news incidents
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: ${color};
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
```

### Option 2: "FR" Badge Label
```typescript
function createIncidentIcon(color: string, isFieldReport: boolean = false) {
  const badge = isFieldReport 
    ? `<span style="
        position: absolute;
        top: -6px;
        right: -6px;
        background: #FF6B35;
        color: white;
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: bold;
        border: 1px solid #000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      ">FR</span>`
    : '';

  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="position: relative;">
        <div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
        ${badge}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
```

### Option 3: Different Color Scheme
```typescript
function createIncidentIcon(color: string, isFieldReport: boolean = false) {
  // Override color for field reports
  if (isFieldReport) {
    color = '#FF6B35'; // Bright orange instead of severity colors
  }
  
  const borderColor = isFieldReport ? '#004E89' : '#fff'; // Dark blue vs white
  const borderWidth = isFieldReport ? '3px' : '2px'; // Thicker border
  
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: ${color};
        border: ${borderWidth} solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
```

## Testing After Fix

1. Save the file
2. Refresh the browser (dev server will auto-reload)
3. Go to http://localhost:3000/admin/pending
4. Approve a field incident
5. Go to http://localhost:3000/
6. Look at the map - field report markers should now be visually distinct

## Recommended: Option 1 (Diamond Shape)

**Why:** Most visually distinct at a glance, universal symbol difference (shape vs circle)

**To implement:**
1. Open `src/components/dashboard/map-wrapper.tsx`
2. Find the `createIncidentIcon` function
3. Replace with Option 1 code above
4. Save and test

---

**Note:** The logic to detect field reports (`sourceType === 'field_report'`) is already in place, so only the visual styling needs adjustment.