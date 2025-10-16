'use client';

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import type { IncidentWithId } from '@/services/incident-service';
import IncidentDossierDialog from './incident-dossier-dialog';
import type L from 'leaflet';

const MapWithNoSSR = dynamic(() => import('@/components/dashboard/map-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
});

interface IncidentMapProps {
  incidents: IncidentWithId[];
}

export interface IncidentMapHandle {
  focusIncident: (incidentId: string) => void;
}

const IncidentMap = forwardRef<IncidentMapHandle, IncidentMapProps>(({ incidents }, ref) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithId | null>(null);
  const mapRef = useRef<{ focusIncident: (incidentId: string) => void } | null>(null);

  useImperativeHandle(ref, () => ({
    focusIncident: (incidentId: string) => {
      if (mapRef.current) {
        mapRef.current.focusIncident(incidentId);
      }
    }
  }));

  const handleMarkerClick = useCallback((incident: IncidentWithId, map: L.Map) => {
    setSelectedIncident(incident);
    // Pan the map to the marker's location
    map.panTo([incident.latitude, incident.longitude]);
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
        <CardContent className="h-[320px] sm:h-[360px] md:h-[400px]">
          <MapWithNoSSR 
            ref={mapRef}
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
});

IncidentMap.displayName = 'IncidentMap';

export default IncidentMap;
