'use client';

import { useEffect, useRef } from 'react';
import type { Incident } from '@/lib/types';
import L from 'leaflet';

interface MapWrapperProps {
  incidents: Incident[];
  onMarkerClick: (incident: Incident) => void;
}

const createIncidentIcon = (color: string) => {
  const iconHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: iconHtml,
    className: 'leaflet-marker-icon', // This class is important to remove default Leaflet styles
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
  });
};

const MapWrapper = ({ incidents, onMarkerClick }: MapWrapperProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Effect for initializing and cleaning up the map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const center: [number, number] = [9.145, 40.4897]; // Centered on Ethiopia
      
      const map = L.map(mapContainerRef.current).setView(center, 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    }

    // Cleanup function to run when the component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for updating markers when incidents change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    incidents.forEach((incident: Incident) => {
      // Simple conversion from percentage to lat/lng for Ethiopia
      // This is a rough approximation and may need refinement
      const lat = parseFloat(incident.top) / 100 * (15 - 3) + 3; // Approx lat range for Ethiopia
      const lng = parseFloat(incident.left) / 100 * (48 - 33) + 33; // Approx lng range
      const position: [number, number] = [lat, lng];
        
      const icon = createIncidentIcon(incident.color);
        
      const marker = L.marker(position, { icon })
        .addTo(map)
        .bindTooltip(incident.title)
        .on('click', (e) => {
            // This is the critical fix. Remove focus from the marker's element.
            if (e.originalEvent.currentTarget) {
              (e.originalEvent.currentTarget as HTMLElement).blur();
            }
            onMarkerClick(incident)
        });
      
      markersRef.current.push(marker);
    });
  }, [incidents, onMarkerClick]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapWrapper;