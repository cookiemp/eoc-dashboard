'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

const DynamicMap = dynamic(
  () => import('@/components/dashboard/dynamic-map'),
  {
    loading: () => <Skeleton className="w-full aspect-[16/9] rounded-lg" />,
    ssr: false
  }
);

const IncidentMap = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Incident Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden">
          <DynamicMap />
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentMap;
