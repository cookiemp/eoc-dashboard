'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangeFilterCompact, type DateFilterPreset } from '@/components/dashboard/date-range-filter-compact';
import { Download } from 'lucide-react';
import type { FieldIncident } from '@/services/field-incidents-service';
import { format } from 'date-fns';

interface FieldIncidentsBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  incidents: FieldIncident[];
}

interface LocationBreakdown {
  region: string;
  count: number;
}

// Ethiopian regions (official administrative regions)
const ETHIOPIAN_REGIONS = [
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Central Ethiopia',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'Southwest Ethiopia',
  'Tigray',
  'Addis Ababa', // Capital city (also a region)
  'Dire Dawa', // Charter city (also a region)
];

// Normalize region name (remove "Region" suffix, trim, etc.)
function normalizeRegionName(regionName: string): string {
  return regionName
    .replace(/\s+region$/i, '') // Remove "Region" suffix
    .replace(/\s+state$/i, '')  // Remove "State" suffix
    .trim();
}

// Parse location string into region and sub-location
// Format can be: "City, Region" or "Region" or "City"
function parseLocation(locationName: string): { region: string; subLocation?: string } {
  const parts = locationName.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    // Single part - check if it's a known region
    const normalized = normalizeRegionName(parts[0]);
    const isRegion = ETHIOPIAN_REGIONS.some(r => 
      normalized.toLowerCase() === r.toLowerCase() ||
      normalized.toLowerCase().includes(r.toLowerCase()) || 
      r.toLowerCase().includes(normalized.toLowerCase())
    );
    
    return {
      region: isRegion ? normalized : 'Unknown Region',
      subLocation: isRegion ? undefined : parts[0], // If not a region, treat as sub-location
    };
  }
  
  // Multiple parts - check which one is the region
  const regionPart = parts.find(part => {
    const normalized = normalizeRegionName(part);
    return ETHIOPIAN_REGIONS.some(r => 
      normalized.toLowerCase() === r.toLowerCase() ||
      normalized.toLowerCase().includes(r.toLowerCase()) || 
      r.toLowerCase().includes(normalized.toLowerCase())
    );
  });
  
  if (regionPart) {
    // Found a region - other parts are sub-locations
    const normalizedRegion = normalizeRegionName(regionPart);
    const subLocationParts = parts.filter(p => p !== regionPart);
    return {
      region: normalizedRegion,
      subLocation: subLocationParts.length > 0 ? subLocationParts.join(', ') : undefined,
    };
  }
  
  // No known region found - use last part as region, rest as sub-location
  const lastPart = parts[parts.length - 1];
  return {
    region: normalizeRegionName(lastPart) || 'Unknown Region',
    subLocation: parts.length > 1 ? parts.slice(0, -1).join(', ') : undefined,
  };
}

// Group incidents by location (region only)
function groupByLocation(incidents: FieldIncident[]): LocationBreakdown[] {
  const locationMap = new Map<string, LocationBreakdown>();

  incidents.forEach(incident => {
    const { region } = parseLocation(incident.locationName);

    if (!locationMap.has(region)) {
      locationMap.set(region, {
        region,
        count: 0,
      });
    }

    const regionData = locationMap.get(region)!;
    regionData.count++;
  });

  return Array.from(locationMap.values()).sort((a, b) => b.count - a.count);
}

// Group incidents by category
function groupByCategory(incidents: FieldIncident[]) {
  const categoryMap = new Map<string, number>();
  incidents.forEach(incident => {
    categoryMap.set(incident.category, (categoryMap.get(incident.category) || 0) + 1);
  });
  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// Group incidents by severity
function groupBySeverity(incidents: FieldIncident[]) {
  const severityMap = new Map<string, number>();
  incidents.forEach(incident => {
    severityMap.set(incident.severity, (severityMap.get(incident.severity) || 0) + 1);
  });
  
  // Sort by severity order
  const order = ['critical', 'high', 'medium', 'low'];
  return order
    .map(severity => ({ severity, count: severityMap.get(severity) || 0 }))
    .filter(item => item.count > 0);
}

// Export to CSV
function exportToCSV(incidents: FieldIncident[]) {
  const headers = [
    'Region',
    'Sub-Location',
    'Category',
    'Severity',
    'Title',
    'Description',
    'Reported By',
    'Date',
    'Affected People',
    'Status',
  ];

  const rows = incidents.map(incident => {
    const { region, subLocation } = parseLocation(incident.locationName);
    return [
      region,
      subLocation || '',
      incident.category,
      incident.severity,
      incident.title,
      incident.description || '',
      incident.reportedBy,
      format(new Date(incident.reportedAt), 'yyyy-MM-dd'),
      incident.affectedPeople?.toString() || '',
      incident.status,
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `field-incidents-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FieldIncidentsBreakdownModal({
  open,
  onClose,
  incidents,
}: FieldIncidentsBreakdownModalProps) {
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);

  // Filter incidents by date range
  const filteredIncidents = useMemo(() => {
    if (!dateFilterStart || !dateFilterEnd) {
      return incidents;
    }

    return incidents.filter(incident => {
      const incidentDate = new Date(incident.reportedAt);
      return incidentDate >= dateFilterStart && incidentDate <= dateFilterEnd;
    });
  }, [incidents, dateFilterStart, dateFilterEnd]);

  const locationBreakdown = useMemo(() => groupByLocation(filteredIncidents), [filteredIncidents]);
  const categoryBreakdown = useMemo(() => groupByCategory(filteredIncidents), [filteredIncidents]);
  const severityBreakdown = useMemo(() => groupBySeverity(filteredIncidents), [filteredIncidents]);

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null, preset?: DateFilterPreset) => {
    setDateFilterStart(startDate);
    setDateFilterEnd(endDate);
  };

  const categoryLabels: Record<string, string> = {
    health: 'Health',
    food_security: 'Food Security',
    displacement: 'Displacement',
    wash: 'WASH',
    security: 'Security',
    other: 'Other',
  };

  const severityLabels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Field Incidents Breakdown</DialogTitle>
        </DialogHeader>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold">{filteredIncidents.length}</span> of{' '}
            <span className="font-semibold">{incidents.length}</span> incidents
          </div>
          <DateRangeFilterCompact onDateRangeChange={handleDateRangeChange} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="location">By Location</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
            <TabsTrigger value="severity">By Severity</TabsTrigger>
          </TabsList>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4 mt-4">
            <div className="space-y-2">
              {locationBreakdown.map(location => (
                <div
                  key={location.region}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{location.region}</span>
                  <Badge variant="secondary">{location.count} incidents</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Category Tab */}
          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="space-y-2">
              {categoryBreakdown.map(item => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{categoryLabels[item.category] || item.category}</span>
                  <Badge variant="secondary">{item.count} incidents</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Severity Tab */}
          <TabsContent value="severity" className="space-y-4 mt-4">
            <div className="space-y-2">
              {severityBreakdown.map(item => (
                <div
                  key={item.severity}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{severityLabels[item.severity] || item.severity}</span>
                  <Badge className={severityColors[item.severity]}>{item.count} incidents</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredIncidents)}
            disabled={filteredIncidents.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
