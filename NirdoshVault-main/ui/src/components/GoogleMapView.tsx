import { useEffect, useRef, useState } from 'react';
import { MapPin, Compass } from 'lucide-react';

interface Centre {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  lat: number;
  lng: number;
  phone?: string;
  timing?: string;
  distance?: string;
  mapsUrl: string;
}

interface GoogleMapViewProps {
  centres: Centre[];
  selectedCentreId?: string | null;
  onSelectCentre?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  activeCity?: string;
}

export default function GoogleMapView({
  centres,
  selectedCentreId,
  onSelectCentre,
  userLocation,
  activeCity,
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markersMap, setMarkersMap] = useState<Map<string, any>>(new Map());
  const [infoWindowInstance, setInfoWindowInstance] = useState<any>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setApiKeyMissing(true);
      return;
    }

    setApiKeyMissing(false);
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setApiKeyMissing(true);

    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps) return;

    if (!mapInstance) {
      const defaultCenter = userLocation || { lat: 18.5314, lng: 73.8446 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      const infoWindow = new window.google.maps.InfoWindow();

      map.addListener('click', (e: any) => {
        if (!e.latLng) return;
        window.open(`https://www.google.com/maps?q=${e.latLng.lat()},${e.latLng.lng()}`, '_blank', 'noopener,noreferrer');
      });

      setMapInstance(map);
      setInfoWindowInstance(infoWindow);
    }
  }, [mapLoaded, mapRef, userLocation]);

  useEffect(() => {
    if (!mapInstance || !window.google?.maps) return;

    markersMap.forEach(m => m.setMap(null));
    const newMarkers = new Map<string, any>();
    const bounds = new window.google.maps.LatLngBounds();

    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
      bounds.extend(userLocation);
    }

    centres.forEach(centre => {
      const pos = { lat: centre.lat, lng: centre.lng };
      bounds.extend(pos);

      let color = '#e4a142';
      if (centre.type === 'aadhaar_seva_kendra') color = '#3b82f6';
      if (centre.type === 'pan_centre') color = '#10b981';
      if (centre.type === 'sdm_office') color = '#a855f7';

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstance,
        title: centre.name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new window.google.maps.Point(12, 22),
        },
      });

      marker.addListener('click', () => {
        if (onSelectCentre) onSelectCentre(centre.id);
        openInfoWindow(centre, marker);
      });

      newMarkers.set(centre.id, marker);
    });

    setMarkersMap(newMarkers);

    if (centres.length > 0) {
      if (centres.length === 1) {
        mapInstance.setCenter({ lat: centres[0].lat, lng: centres[0].lng });
        mapInstance.setZoom(14);
      } else {
        mapInstance.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      }
    }
  }, [mapInstance, centres, userLocation]);

  const openInfoWindow = (centre: Centre, marker: any) => {
    if (!infoWindowInstance || !mapInstance) return;
    const content = `
      <div style="padding: 6px; max-width: 240px; font-family: system-ui, sans-serif;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${centre.name}</div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${centre.address}</div>
        <a href="${centre.mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #e4a142; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600;">
          Directions in Google Maps ↗
        </a>
      </div>
    `;
    infoWindowInstance.setContent(content);
    infoWindowInstance.open(mapInstance, marker);
  };

  const getEmbedUrl = () => {
    if (selectedCentreId) {
      const selected = centres.find(c => c.id === selectedCentreId);
      if (selected) return `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&hl=en&z=15&output=embed`;
    }
    if (userLocation) return `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&hl=en&z=13&output=embed`;
    return `https://maps.google.com/maps?q=Pune,India&hl=en&z=13&output=embed`;
  };

  return (
    <div className="card overflow-hidden border border-slate-200 dark:border-white/10 mb-8">
      <div className="px-5 py-3 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          <MapPin size={14} className="text-saffron-500" />
          Interactive Assistance Map
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
          <Compass size={12} /> Live Active View
        </span>
      </div>

      <div className="relative w-full h-[360px] bg-slate-100 dark:bg-navy-950">
        {!apiKeyMissing ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <iframe
            title="Google Maps Location View"
            src={getEmbedUrl()}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}