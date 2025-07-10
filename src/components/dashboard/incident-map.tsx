'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Incident } from '@/lib/types';

const MapWithNoSSR = dynamic(() => import('@/components/dashboard/map-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
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
          <MapWithNoSSR incidents={incidents} onMarkerClick={handleMarkerClick} />
        </CardContent>
      </Card>

      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIncident?.title}</DialogTitle>
            <DialogDescription>
              {selectedIncident?.description || "No further details available for this incident."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncidentMap;
