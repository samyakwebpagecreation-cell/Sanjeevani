import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  PhoneCall, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Car, 
  Compass, 
  ExternalLink,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import { EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';

interface EmergencyRouteMapProps {
  facility: EmergencyFacility;
  route: RouteComputationResult;
  compact?: boolean;
}

export const EmergencyRouteMap: React.FC<EmergencyRouteMapProps> = ({
  facility,
  route,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'steps'>('map');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const directNavUrl = route.navigationUrl || 
    `https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}&travelmode=driving&dir_action=navigate`;

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    // Destroy existing instance if any
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: !compact,
        attributionControl: false
      }).setView([route.origin.lat, route.origin.lng], 13);

      leafletMapRef.current = map;

      // Add clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom User Location Pin
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #2A7B62; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #2A7B62; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Custom Hospital Pin
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 10px; background: #D93A3A; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(217,58,58,0.4); border: 2px solid white;">
            ✚
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      // Add markers
      const userMarker = L.marker([route.origin.lat, route.origin.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Live Location</b>');

      const hospitalMarker = L.marker([route.destination.lat, route.destination.lng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b>${facility.name}</b><br/>${facility.address}<br/><b>${route.durationText}</b>`);

      // Add route polyline
      const latlngs: [number, number][] = [
        [route.origin.lat, route.origin.lng],
        [route.destination.lat, route.destination.lng]
      ];

      const polyline = L.polyline(latlngs, {
        color: '#2A7B62',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(map);

      // Fit bounds with padding and realistic urban maxZoom
      const group = L.featureGroup([userMarker, hospitalMarker, polyline]);
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 15 });

      // Invalidate size after small timeout to ensure proper rendering inside modals/drawers
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      setTimeout(() => {
        map.invalidateSize();
      }, 400);

    } catch (err) {
      console.warn('Leaflet map initialization warning:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [activeTab, route, facility, compact]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-surface border border-primary/20 shadow-xl overflow-hidden transition-all text-ink">
      
      {/* Top Route Header & Traffic Status */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">
                Live Driving Route
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                route.trafficCondition === 'Moderate' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                ● {route.trafficCondition} Traffic
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-ink">
              <span>{route.durationText}</span>
              <span>•</span>
              <span className="text-primary">{route.distanceText}</span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-base rounded-xl border border-border text-xs font-bold">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'map' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'steps' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Steps
          </button>
        </div>
      </div>

      {/* Main Area: Leaflet Map or Steps */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {activeTab === 'map' ? (
          <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-base h-48 sm:h-60">
            {/* Interactive Leaflet Map Container */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-full z-0" 
              style={{ minHeight: compact ? '190px' : '230px' }} 
            />

            {/* Quick Floating Pill on Map */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-surface/92 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/80 shadow-md text-[11px] z-[400]">
              <span className="font-bold text-ink truncate max-w-[180px] sm:max-w-[240px]">
                {facility.name}
              </span>
              <span className="font-extrabold text-primary shrink-0">
                {route.durationText} ({route.distanceText})
              </span>
            </div>
          </div>
        ) : (
          /* Turn-by-Turn Steps */
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center space-x-1 pb-1 border-b border-border">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>Turn-by-Turn Navigation Steps</span>
            </div>

            {route.steps.map((step, idx) => (
              <div 
                key={idx}
                className="flex items-start space-x-3 p-2.5 rounded-xl bg-base border border-border text-xs"
              >
                <div className="h-6 w-6 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="font-semibold text-ink leading-snug">{step.instruction}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-ink-muted font-medium">
                    <span>{step.distance}</span>
                    <span>•</span>
                    <span>{step.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Facility Details Card */}
        <div className="p-3 rounded-2xl bg-base border border-border space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {facility.category}
              </span>
              {facility.hasAntiVenom && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/25 text-ink">
                  ASV Available
                </span>
              )}
            </div>
            {facility.isOpen24Hours && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Open 24/7</span>
              </span>
            )}
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-ink pt-0.5">
            {facility.name}
          </h4>
          <p className="text-[11px] text-ink-muted line-clamp-1">
            {facility.address}
          </p>
        </div>

        {/* Direct Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <a
            href={directNavUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-dark btn-press flex items-center justify-center space-x-2 text-center"
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span>Open Google Maps GPS Navigation</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <div className="flex items-center space-x-2">
            {facility.phoneNumber && (
              <a
                href={`tel:${facility.phoneNumber}`}
                className="flex-1 py-3 px-3 rounded-xl bg-surface border border-border text-ink font-bold text-xs hover:bg-base btn-press flex items-center justify-center space-x-1.5 text-center shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5 text-alert" />
                <span>Call Desk</span>
              </a>
            )}

            <a
              href="tel:112"
              className="py-3 px-3.5 rounded-xl bg-alert/15 border border-alert/30 text-alert font-bold text-xs hover:bg-alert/25 btn-press flex items-center justify-center space-x-1 shadow-2xs"
            >
              <span>112</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};
