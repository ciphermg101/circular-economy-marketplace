import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationMapProps {
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  onLocationSelect,
  initialLocation = { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
  height = '400px',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [initialLocation.lng, initialLocation.lat],
      zoom: 12,
    });

    marker.current = new mapboxgl.Marker({
      draggable: true,
    })
      .setLngLat([initialLocation.lng, initialLocation.lat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        onLocationSelect({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    map.current.on('click', (e) => {
      marker.current?.setLngLat(e.lngLat);
      onLocationSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default LocationMap; 