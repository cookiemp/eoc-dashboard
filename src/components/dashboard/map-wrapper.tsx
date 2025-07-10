'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Incident } from '@/lib/types';
import { icon } from 'leaflet';

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

interface MapWrapperProps {
  incidents: Incident[];
}

const MapWrapper = ({ incidents }: MapWrapperProps) => {
  const center: [number, number] = [9.145, 40.4897]; // Centered on Ethiopia

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident: Incident) => (
        <Marker
          key={incident.id}
          position={[
            // Rough conversion of % to lat/lon for Ethiopia's bounding box
            parseFloat(incident.top.replace('%', '')) * (14.5 - 5.5) / 100 + 5.5,
            parseFloat(incident.left.replace('%', '')) * (48 - 33) / 100 + 33
          ]}
          icon={ICON}
        >
          <Popup>{incident.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapWrapper;
