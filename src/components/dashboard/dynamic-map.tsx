'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { incidents } from '@/lib/mock-data';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

const createCustomIcon = (color: string) => {
  const markerHtml = `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; top: 0; left: 0; width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
      <div style="position: relative; display: block; width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 0 0 2px rgba(0,0,0,0.1);"></div>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'leaflet-marker-icon', // Use a custom class to avoid default styles
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};


const DynamicMap = () => {
    const center: LatLngExpression = [9.145, 40.4897]; // Centered on Ethiopia

    const incidentPositions: { id: number; position: LatLngExpression; title: string; color: string }[] = incidents.map(inc => {
        const top = parseFloat(inc.top.replace('%', ''));
        const left = parseFloat(inc.left.replace('%', ''));
        
        // Approximate conversion from % position on a map of Ethiopia to lat/lon
        // This is a rough estimation and may need refinement for accuracy
        const lat = 14.8 - (top / 100) * (14.8 - 3.3); // Ethiopia lat range approx 3.3 to 14.8
        const lon = 33 + (left / 100) * (48 - 33); // Ethiopia lon range approx 33 to 48

        return {
            id: inc.id,
            position: [lat, lon],
            title: inc.title,
            color: inc.color.replace('bg-', '').replace('-500', '') // convert tailwind color to hex/color name
        }
    });

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidentPositions.map((incident) => (
        <Marker 
          key={incident.id} 
          position={incident.position} 
          icon={createCustomIcon(incident.color)}
        >
          <Popup>
            <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" />{incident.title}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DynamicMap;
