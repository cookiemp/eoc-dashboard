'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';
import type { Incident } from '@/lib/types';
import { incidents } from '@/lib/mock-data';

// This is a workaround for a known issue with Leaflet and Webpack.
// It ensures the marker icons are displayed correctly.
const ICON = icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/marker-shadow.png',
  shadowSize: [41, 41],
});

// Another workaround for a common issue in React's strict mode with Leaflet.
const MapPlaceholder = () => {
  return (
    <p>
      <noscript>You need to enable JavaScript to see this map.</noscript>
    </p>
  );
};

const DynamicMap = () => {
  const center: [number, number] = [9.145, 40.4897]; // Centered on Ethiopia

  // This effect sets the placeholder class for the map container.
  // This is a workaround for a common Leaflet issue in React Strict Mode.
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer && !mapContainer.classList.contains('leaflet-container-rendered')) {
      mapContainer.classList.add('leaflet-container-rendered');
    }
  }, []);

  return (
    <MapContainer 
      center={center} 
      zoom={6} 
      scrollWheelZoom={true} 
      placeholder={<MapPlaceholder />}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident: Incident) => (
        <Marker
          key={incident.id}
          position={[
            parseFloat(incident.top.replace('%', '')) * (14.5 - 5.5) / 100 + 5.5, // Rough conversion of % to lat
            parseFloat(incident.left.replace('%', '')) * (48 - 33) / 100 + 33  // Rough conversion of % to lon
          ]}
          icon={ICON}
        >
          <Popup>{incident.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DynamicMap;
