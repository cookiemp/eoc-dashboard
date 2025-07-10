'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import type { IncidentWithId } from '@/services/incident-service';
import IncidentDossierDialog from './incident-dossier-dialog';

const MapWithNoSSR = dynamic(() => import('@/components/dashboard/map-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
});

interface IncidentMapProps {
  incidents: IncidentWithId[];
}

const IncidentMap = ({ incidents }: IncidentMapProps) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithId | null>(null);

  const handleMarkerClick = useCallback((incident: IncidentWithId) => {
    setSelectedIncident(incident);
  }, []);

  const handleDialogClose = useCallback(() => {
    setSelectedIncident(null);
  }, []);

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
          <MapWithNoSSR 
            incidents={incidents} 
            onMarkerClick={handleMarkerClick}
          />
        </CardContent>
      </Card>
      {selectedIncident && (
        <IncidentDossierDialog
          incident={selectedIncident}
          open={!!selectedIncident}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
};

export default IncidentMap;
