'use client';

import { useEffect, useRef } from 'react';
import type { IncidentWithId } from '@/services/incident-service';
import L from 'leaflet';

interface MapWrapperProps {
  incidents: IncidentWithId[];
  onMarkerClick: (incident: IncidentWithId, map: L.Map) => void;
}

const createIncidentIcon = (color: string) => {
  const iconHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg cursor-pointer">
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
    incidents.forEach((incident: IncidentWithId) => {
      const position: [number, number] = [incident.latitude, incident.longitude];
        
      const icon = createIncidentIcon(incident.color);
      
      const tooltipContent = `
        <div class="font-sans max-w-xs whitespace-normal">
          <strong class="text-base">${incident.title}</strong>
          <br>
          <p class="text-sm mt-1">Click for details</p>
        </div>
      `;
        
      const marker = L.marker(position, { icon }).addTo(map);

      // Bind tooltip for hover effect, but don't make it sticky on click
      marker.bindTooltip(tooltipContent, { sticky: false });

      // Handle click event separately to call our custom handler
      marker.on('click', () => {
        // Close any open tooltips before calling the handler to avoid overlap
        marker.closeTooltip();
        onMarkerClick(incident, map);
      });
      
      markersRef.current.push(marker);
    });
  }, [incidents, onMarkerClick]);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapWrapper;
