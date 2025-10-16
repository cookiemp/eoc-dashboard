'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { IncidentWithId } from '@/services/incident-service';
import L from 'leaflet';

interface MapWrapperProps {
  incidents: IncidentWithId[];
  onMarkerClick: (incident: IncidentWithId, map: L.Map) => void;
}

const createIncidentIcon = (color: string, isFieldReport: boolean = false) => {
  const iconHtml = isFieldReport 
    ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg cursor-pointer">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
        <path d="M12 13 L10 10 L12 7 L14 10 Z" fill="white" stroke="white" stroke-width="1"/>
      </svg>
    `
    : `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg cursor-pointer">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    `;
  return L.divIcon({
    html: iconHtml,
    className: 'leaflet-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MapWrapper = forwardRef<{ focusIncident: (incidentId: string) => void }, MapWrapperProps>(
  ({ incidents, onMarkerClick }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());

    useImperativeHandle(ref, () => ({
      focusIncident: (incidentId: string) => {
        const marker = markersRef.current.get(incidentId);
        const incident = incidents.find(inc => inc.id === incidentId);
        if (marker && incident && mapInstanceRef.current) {
          const map = mapInstanceRef.current;
          // Zoom and pan to the marker
          map.setView(marker.getLatLng(), 10, { animate: true });
          // Open tooltip
          marker.openTooltip();
          // Trigger click after a brief delay
          setTimeout(() => {
            onMarkerClick(incident, map);
          }, 500);
        }
      }
    }));

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
    markersRef.current.clear();

    // Add new markers
    let invalidMarkers = 0;
    
    // Track markers by location to offset overlapping ones
    const locationCounts = new Map<string, number>();
    
    incidents.forEach((incident: IncidentWithId) => {
      // Validate coordinates
      if (!incident.latitude || !incident.longitude || 
          isNaN(incident.latitude) || isNaN(incident.longitude) ||
          incident.latitude === 0 && incident.longitude === 0) {
        console.error(`  ❌ INVALID COORDS: ${incident.title} - Lat: ${incident.latitude}, Lng: ${incident.longitude}`);
        invalidMarkers++;
        return; // Skip this marker
      }
      
      // Create a location key for tracking overlaps
      const locationKey = `${incident.latitude.toFixed(4)},${incident.longitude.toFixed(4)}`;
      const countAtLocation = locationCounts.get(locationKey) || 0;
      locationCounts.set(locationKey, countAtLocation + 1);
      
      // Offset overlapping markers in a circle pattern
      // Larger offset for better visibility at default zoom level
      const offsetDistance = 0.15; // ~15-17km offset - visible without zooming
      const angle = (countAtLocation * 60) * (Math.PI / 180); // 60 degrees apart
      const latOffset = offsetDistance * Math.cos(angle);
      const lngOffset = offsetDistance * Math.sin(angle);
      
      const position: [number, number] = [
        incident.latitude + latOffset,
        incident.longitude + lngOffset
      ];
      
      // Check if this is a field report incident
      const isFieldReport = 'sourceType' in incident && incident.sourceType === 'field_report';
        
      const icon = createIncidentIcon(incident.color, isFieldReport);
      
      const sourceLabel = isFieldReport ? '📋 Field Report' : '📰 News';
      
      const tooltipContent = `
        <div class="font-sans max-w-xs whitespace-normal">
          <strong class="text-base">${incident.title}</strong>
          <br>
          <span class="text-xs text-gray-600">${sourceLabel}</span>
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
      
      markersRef.current.set(incident.id, marker);
    });
    
    // Log if any markers were skipped due to invalid coordinates
    if (invalidMarkers > 0) {
      console.warn(`⚠️ ${invalidMarkers} incident(s) skipped due to invalid coordinates`);
    }
    }, [incidents, onMarkerClick]);

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />;
  }
);

MapWrapper.displayName = 'MapWrapper';

export default MapWrapper;
