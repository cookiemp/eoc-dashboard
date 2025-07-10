'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import type { Incident } from '@/lib/types';

const MapWithNoSSR = dynamic(() => import('@/components/dashboard/map-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
});

interface IncidentMapProps {
  incidents: Incident[];
}

const IncidentMap = ({ incidents }: IncidentMapProps) => {
  // The click handler and dialog state are no longer needed.
  // The map wrapper will now handle displaying details on hover.

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Interactive Incident Map
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <MapWithNoSSR incidents={incidents} />
        </CardContent>
      </Card>
    </>
  );
};

export default IncidentMap;
