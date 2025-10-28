'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const SEVERITY_ITEMS = [
  { level: 'Critical', color: '#DC2626', description: 'Immediate action required' },
  { level: 'High', color: '#EA580C', description: 'Urgent attention needed' },
  { level: 'Medium', color: '#F59E0B', description: 'Moderate concern' },
  { level: 'Low', color: '#3B82F6', description: 'Monitoring required' },
] as const;

const MARKER_TYPES = [
  { 
    label: 'Field Report', 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#F59E0B" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
        <path d="M12 13 L10 10 L12 7 L14 10 Z" fill="white" stroke="white" strokeWidth="1"/>
      </svg>
    ),
    description: 'Direct field observations from KoBo reports'
  },
];

export default function MapLegend() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="h-4 w-4" />
          Map Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Severity Levels */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Severity Levels</h4>
          <div className="space-y-2">
            {SEVERITY_ITEMS.map(({ level, color, description }) => (
              <div key={level} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm" 
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{level}</span>
                    <span className="text-xs text-gray-500 truncate">{description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marker Types */}
        <div className="pt-3 border-t">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Source Types</h4>
          <div className="space-y-2">
            {MARKER_TYPES.map(({ label, icon, description }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-gray-500 truncate">{description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-600">
            <strong>Tip:</strong> Hover over markers for quick info, click for full details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
