'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';

const IncidentMap = () => {
  const DynamicMap = dynamic(
    () => import('@/components/dashboard/dynamic-map'),
    {
      loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
      ssr: false,
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Interactive Incident Map
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <DynamicMap />
      </CardContent>
    </Card>
  );
};

export default IncidentMap;
