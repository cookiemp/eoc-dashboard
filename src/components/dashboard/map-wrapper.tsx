'use client';

import { useEffect, useRef } from 'react';
import type { Incident } from '@/lib/types';
import L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface MapWrapperProps {
  incidents: Incident[];
}

const MapWrapper = ({ incidents }: MapWrapperProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Only initialize the map if the ref is available and a map instance doesn't already exist
    if (mapRef.current && !mapInstance.current) {
      const center: [number, number] = [9.145, 40.4897]; // Centered on Ethiopia
      
      const map = L.map(mapRef.current).setView(center, 6);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      incidents.forEach((incident: Incident) => {
        const position: [number, number] = [
            parseFloat(incident.top.replace('%', '')) * (14.5 - 5.5) / 100 + 5.5,
            parseFloat(incident.left.replace('%', '')) * (48 - 33) / 100 + 33
        ];
        L.marker(position).addTo(map).bindPopup(incident.title);
      });
    }

    // Cleanup function to run when the component unmounts
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [incidents]); // Rerun effect if incidents change

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapWrapper;
