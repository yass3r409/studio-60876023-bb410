'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox public token - You should get your own token from mapbox.com
// For demo, using a placeholder - replace with your actual token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibmF6cmFoLWFwcCIsImV4cCI6MTc1MDAwMDAwMCIsIm9yZ2FuaXphdGlvbiI6Im5henJhaCIsImRlZmF1bHRNYXAiOiJtYXAtc3R5bGVzL3N0cmVldHMtdjExIn0.placeholder';

// Saudi Arabia bounds
const SAUDI_BOUNDS = {
  north: 32.0,
  south: 16.0,
  west: 34.0,
  east: 55.0
};

// Default locations for quick access
export const SAUDI_LOCATIONS = {
  riyadh: { lat: 24.7136, lng: 46.6753, name: 'الرياض' },
  makkah: { lat: 21.3891, lng: 39.8579, name: 'مكة المكرمة' },
  madinah: { lat: 24.5247, lng: 39.5692, name: 'المدينة المنورة' },
  jeddah: { lat: 21.4858, lng: 39.1925, name: 'جدة' },
  dammam: { lat: 26.4207, lng: 50.0888, name: 'الدمام' },
};

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface MapboxMapHandle {
  getCenter: () => MapLocation | null;
  flyTo: (location: MapLocation) => void;
  addUserMarker: (location: MapLocation) => void;
}

interface MapboxMapProps {
  onLocationSelect?: (location: MapLocation) => void;
  initialLocation?: MapLocation;
  showUserLocation?: boolean;
  markers?: MapLocation[];
  className?: string;
}

const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(
  ({ onLocationSelect, initialLocation, showUserLocation = true, markers = [], className = '' }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    const selectedMarker = useRef<mapboxgl.Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<MapLocation | null>(null);

    // Initialize map
    useEffect(() => {
      if (map.current || !mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialLocation 
          ? [initialLocation.lng, initialLocation.lat]
          : [SAUDI_LOCATIONS.riyadh.lng, SAUDI_LOCATIONS.riyadh.lat],
        zoom: 12,
        maxBounds: [
          [SAUDI_BOUNDS.west, SAUDI_BOUNDS.south],
          [SAUDI_BOUNDS.east, SAUDI_BOUNDS.north]
        ],
        // Disable if no valid token
        accessToken: MAPBOX_TOKEN.includes('placeholder') ? '' : MAPBOX_TOKEN,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Add navigation controls
        map.current?.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
        
        // Add geolocate control if enabled
        if (showUserLocation) {
          const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          });
          map.current?.addControl(geolocate, 'bottom-left');
        }
      });

      map.current.on('error', () => {
        setError('تعذر تحميل الخريطة');
      });

      // Add click handler for location selection
      map.current.on('click', (e) => {
        const location: MapLocation = {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        };
        
        // Add or move marker
        if (selectedMarker.current) {
          selectedMarker.current.setLngLat([location.lng, location.lat]);
        } else {
          selectedMarker.current = new mapboxgl.Marker({ color: '#059669' })
            .setLngLat([location.lng, location.lat])
            .addTo(map.current!);
        }
        
        onLocationSelect?.(location);
      });

      return () => {
        map.current?.remove();
        map.current = null;
      };
    }, [initialLocation, showUserLocation, onLocationSelect]);

    // Get user's current location
    useEffect(() => {
      if (showUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: MapLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(location);
          },
          () => {
            // Silently handle geolocation error
          },
          { enableHighAccuracy: true }
        );
      }
    }, [showUserLocation]);

    // Add markers for video requests
    useEffect(() => {
      if (!map.current || !mapLoaded) return;

      markers.forEach((marker) => {
        new mapboxgl.Marker({ color: '#f59e0b' })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map.current!);
      });
    }, [markers, mapLoaded]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCenter: () => {
        if (!map.current) return null;
        const center = map.current.getCenter();
        return { lat: center.lat, lng: center.lng };
      },
      flyTo: (location: MapLocation) => {
        map.current?.flyTo({
          center: [location.lng, location.lat],
          zoom: 15,
          duration: 1500
        });
      },
      addUserMarker: (location: MapLocation) => {
        if (selectedMarker.current) {
          selectedMarker.current.setLngLat([location.lng, location.lat]);
        } else if (map.current) {
          selectedMarker.current = new mapboxgl.Marker({ color: '#059669' })
            .setLngLat([location.lng, location.lat])
            .addTo(map.current);
        }
      }
    }));

    // Fallback UI when map fails to load
    if (error) {
      return (
        <div className={`relative bg-gray-100 ${className}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <p className="text-gray-400 text-sm text-center">
              الخريطة تحتاج إلى مفتاح Mapbox صالح
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري تحميل الخريطة...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap;
