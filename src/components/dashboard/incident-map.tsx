'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Incident } from '@/lib/types';

const DynamicMap = dynamic(() => import('@/components/dashboard/dynamic-map'), {
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
  ssr: false,
});

interface IncidentMapProps {
  incidents: Incident[];
}

const IncidentMap = ({ incidents }: IncidentMapProps) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const handleMarkerClick = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
  }, []);

  const handleDialogClose = () => {
    setSelectedIncident(null);
  };

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
          <DynamicMap incidents={incidents} onMarkerClick={handleMarkerClick} />
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedIncident} onOpenChange={(open) => !open && handleDialogClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedIncident?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIncident?.description || "No further details available for this incident."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IncidentMap;