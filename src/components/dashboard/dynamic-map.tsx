'use client';

import type { Incident } from '@/lib/types';
import MapWrapper from './map-wrapper';

interface DynamicMapProps {
  incidents: Incident[];
  onMarkerClick: (incident: Incident) => void;
}

const DynamicMap = ({ incidents, onMarkerClick }: DynamicMapProps) => {
  return <MapWrapper incidents={incidents} onMarkerClick={onMarkerClick} />;
};

export default DynamicMap;
