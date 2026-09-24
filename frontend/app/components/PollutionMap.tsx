'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Reading {
  location: string;
  pm25: number;
  source: string;
  timestamp: number;
}

const CITY_COORDS: Record<string, [number, number]> = {
  accra: [5.56936, -0.21404],
  kumasi: [6.69474, -1.62112],
  takoradi: [4.89993, -1.76291],
  tamale: [9.40345, -0.84119],
};

function getLatestByCity(readings: Reading[]) {
  const latest: Record<string, Reading> = {};
  for (const r of readings) {
    const key = r.location.toLowerCase();
    if (!latest[key] || r.timestamp > latest[key].timestamp) {
      latest[key] = r;
    }
  }
  return latest;
}

function pm25Color(pm25: number) {
  if (pm25 > 150) return '#dc2626';
  if (pm25 > 55) return '#d97706';
  if (pm25 > 25) return '#ca8a04';
  return '#16a34a';
}

export default function PollutionMap({ readings }: { readings: Reading[] }) {
  const latestByCity = getLatestByCity(readings);
  const cities = Object.keys(CITY_COORDS).filter((c) => latestByCity[c]);

  if (cities.length === 0) {
    return null;
  }

  return (
    <MapContainer
      center={[7.5, -1.0]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: '320px', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cities.map((city) => {
        const reading = latestByCity[city];
        const coords = CITY_COORDS[city];
        return (
          <CircleMarker
            key={city}
            center={coords}
            radius={14}
            pathOptions={{
              color: pm25Color(reading.pm25),
              fillColor: pm25Color(reading.pm25),
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <strong>{reading.location}</strong>
              <br />
              PM2.5: {reading.pm25}
              <br />
              Source: {reading.source}
              <br />
              {new Date(reading.timestamp * 1000).toLocaleString()}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
