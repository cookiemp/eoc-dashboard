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

const createIncidentIcon = (color: string) => {
  return L.divIcon({
    html: `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="${color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-map-pin"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" fill="${color}" />
      </svg>
    `,
    className: 'leaflet-marker-icon', // Use a class to remove default styling
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const MapWrapper = ({ incidents }: MapWrapperProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
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
        
        const icon = createIncidentIcon(incident.color);
        
        L.marker(position, { icon }).addTo(map).bindTooltip(incident.title);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [incidents]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapWrapper;
