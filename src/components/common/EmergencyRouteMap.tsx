import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  PhoneCall,
  MapPin,
  ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import { EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';

interface EmergencyRouteMapProps {
  facility: EmergencyFacility;
  route: RouteComputationResult;
  compact?: boolean;
}

/**
 * Reserved height skeleton for the Hospital / Route Card (D.3: CLS < 0.05)
 */
export const EmergencyRouteCardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-label="Finding nearest emergency hospital"
    className="w-full max-w-[68ch] min-h-[156px] rounded-2xl bg-base/60 border border-border p-4 flex flex-col justify-between space-y-3"
  >
    <div className="space-y-2">
      <div className="h-5 w-3/4 rounded bg-border/70" />
      <div className="h-4 w-1/3 rounded bg-border/60" />
    </div>
    <div className="flex items-center gap-2">
      <div className="h-6 w-20 rounded-md bg-border/60" />
      <div className="h-6 w-28 rounded-md bg-border/60" />
      <div className="h-6 w-20 rounded-md bg-border/60" />
    </div>
    <div className="flex items-center gap-2 pt-1">
      <div className="h-11 w-32 rounded-xl bg-border/70" />
      <div className="h-11 w-28 rounded-xl bg-border/60" />
      <div className="h-11 w-16 rounded-xl bg-border/60" />
    </div>
  </div>
);

/**
 * Compact Hospital / Route Card (Section D):
 * - Name wraps to 2 lines (no single-line ellipsis)
 * - Then ETA / distance
 * - Then 14px chips (Hospital, ASV Available, Open 24/7)
 * - Then one row of buttons: primary "Navigate" (icon, same Google Maps handler, whitespace-nowrap),
 *   "Call desk" (outline), and small red "112". Stacks as full-width 48px buttons on narrow widths.
 * - Map thumbnail is max 140px tall and hidden behind a "Show map" toggle by default (lazy-rendered when opened).
 */
export const EmergencyRouteMap: React.FC<EmergencyRouteMapProps> = ({
  facility,
  route
}) => {
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const directNavUrl =
    route.navigationUrl ||
    `https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}&travelmode=driving&dir_action=navigate`;

  // Lazy-initialize Leaflet map ONLY when "Show map" is opened
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([route.origin.lat, route.origin.lng], 13);

      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#0D6E6E;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `<div style="width:22px;height:22px;border-radius:6px;background:#DC2626;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;">✚</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const userMarker = L.marker([route.origin.lat, route.origin.lng], {
        icon: userIcon
      }).addTo(map);

      const hospitalMarker = L.marker(
        [route.destination.lat, route.destination.lng],
        { icon: hospitalIcon }
      ).addTo(map);

      const polyline = L.polyline(
        [
          [route.origin.lat, route.origin.lng],
          [route.destination.lat, route.destination.lng]
        ],
        {
          color: '#0D6E6E',
          weight: 3,
          dashArray: '6, 6',
          opacity: 0.85
        }
      ).addTo(map);

      const group = L.featureGroup([userMarker, hospitalMarker, polyline]);
      map.fitBounds(group.getBounds(), { padding: [24, 24], maxZoom: 15 });

      setTimeout(() => {
        map.invalidateSize();
      }, 80);
    } catch (err) {
      console.warn('Leaflet map init warning:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [showMap, route, facility]);

  return (
    <div className="w-full max-w-[68ch] min-h-[156px] rounded-2xl bg-base/70 border border-border p-4 text-ink space-y-2.5">
      {/* 1. Hospital Name (wraps up to 2 lines, no single-line ellipsis) + Show Map Toggle */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[18px] font-semibold text-ink leading-snug line-clamp-2">
          {facility.name}
        </h4>

        <button
          type="button"
          onClick={() => setShowMap((prev) => !prev)}
          aria-expanded={showMap}
          className="inline-flex min-h-[36px] items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-primary-soft border border-border text-[14px] font-medium text-ink-muted hover:text-ink whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>{showMap ? 'Hide map' : 'Show map'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              showMap ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 2. ETA / Distance */}
      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-800 tabular-nums">
        <span className="text-primary">{route.durationText}</span>
        <span aria-hidden="true" className="text-ink-muted">
          ·
        </span>
        <span>{route.distanceText}</span>
        {facility.address && (
          <>
            <span aria-hidden="true" className="text-ink-muted">
              ·
            </span>
            <span className="text-[14px] font-normal text-ink-muted truncate">
              {facility.address}
            </span>
          </>
        )}
      </div>

      {/* 3. 14px Chips (Hospital, ASV Available, Open 24/7) */}
      <div className="flex items-center flex-wrap gap-1.5 text-[14px]">
        <span className="px-2.5 py-0.5 rounded-md bg-surface border border-border font-medium text-slate-800">
          {facility.category === 'Trauma Center' ? 'Hospital' : facility.category}
        </span>
        {facility.hasAntiVenom && (
          <span className="px-2.5 py-0.5 rounded-md bg-surface border border-border font-medium text-slate-800">
            ASV Available
          </span>
        )}
        {facility.isOpen24Hours && (
          <span className="px-2.5 py-0.5 rounded-md bg-surface border border-border font-medium text-emerald-800">
            Open 24/7
          </span>
        )}
      </div>

      {/* Lazy-Rendered Map Thumbnail (Max 140px tall, hidden by default) */}
      {showMap && (
        <div className="w-full h-[140px] max-h-[140px] rounded-xl overflow-hidden border border-border bg-surface">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>
      )}

      {/* 4. Single Row of Action Buttons (Stacks as full-width 48px buttons on narrow widths) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
        <a
          href={directNavUrl}
          target="_blank"
          rel="noreferrer"
          className="min-h-[48px] sm:min-h-[42px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Navigate</span>
        </a>

        {facility.phoneNumber && (
          <a
            href={`tel:${facility.phoneNumber}`}
            className="min-h-[48px] sm:min-h-[42px] px-3.5 py-2 rounded-xl bg-surface hover:bg-base border border-border text-ink font-semibold text-[15px] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PhoneCall className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Call desk</span>
          </a>
        )}

        <a
          href="tel:112"
          className="min-h-[48px] sm:min-h-[42px] px-3.5 py-2 rounded-xl bg-alert hover:bg-alert-dark text-white font-semibold text-[15px] inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert"
          aria-label="Call 112 Emergency"
        >
          <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>112</span>
        </a>
      </div>
    </div>
  );
};
