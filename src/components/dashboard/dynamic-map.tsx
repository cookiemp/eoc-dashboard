
import type { Incident } from '@/lib/types';

// This file is no longer used and can be deleted.
// The logic has been moved to incident-map.tsx for stability.

const DynamicMap = ({ incidents, onMarkerClick }: { incidents: Incident[], onMarkerClick: (incident: Incident) => void}) => {
  return null;
};

export default DynamicMap;
