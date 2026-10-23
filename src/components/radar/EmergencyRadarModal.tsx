import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  ExternalLink, 
  ShieldAlert, 
  HeartPulse, 
  Activity, 
  Clock, 
  X, 
  Search, 
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  Car,
  Crosshair,
  Flame,
  Droplet,
  Compass
} from 'lucide-react';
import { 
  fetchNearbyEmergencyFacilities, 
  EmergencyFacility, 
  getCurrentUserLocation,
  computeEmergencyRoute,
  RouteComputationResult,
  getUserLocationInfo,
  setUserPreciseLocation,
  UserLocationInfo
} from '../../services/placesRoutesService';
import { EmergencyRouteMap } from '../common/EmergencyRouteMap';
import { LocationPickerModal } from '../common/LocationPickerModal';

interface EmergencyRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const EmergencyRadarModal: React.FC<EmergencyRadarModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'All'
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>(initialCategory);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [facilitySearch, setFacilitySearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationInfo, setUserLocationInfo] = useState<UserLocationInfo | null>(null);
  const [selectedFacilityRoute, setSelectedFacilityRoute] = useState<{ facility: EmergencyFacility; route: RouteComputationResult } | null>(null);
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState<boolean>(false);

  // Integrated Address Search State
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    loadFacilities();

    const handleLocUpdate = () => {
      loadFacilities();
    };

    window.addEventListener('sanjeevani_location_updated', handleLocUpdate);
    window.addEventListener('sanjeevani_location_cleared', handleLocUpdate);

    return () => {
      window.removeEventListener('sanjeevani_location_updated', handleLocUpdate);
      window.removeEventListener('sanjeevani_location_cleared', handleLocUpdate);
    };
  }, [isOpen]);

  const loadFacilities = async () => {
    setIsLoading(true);
    setSelectedFacilityRoute(null);
    try {
      const info = await getUserLocationInfo();
      setUserLocationInfo(info);
      setUserLocation({ lat: info.lat, lng: info.lng });
      const list = await fetchNearbyEmergencyFacilities(info.lat, info.lng);
      setFacilities(list);
    } catch (err) {
      console.warn('Failed to load emergency facilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search Address via Nominatim to immediately reposition radar center
  const handleAddressSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = addressSearchQuery.trim();
    if (!query) return;

    setIsSearchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=5`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const data = await res.json();
        setAddressSuggestions(
          data.map((item: any) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Select Address Suggestion -> Recenter Pin and recalculate all radar ranges
  const handleSelectAddressSuggestion = (suggestion: { name: string; lat: number; lng: number }) => {
    const parts = suggestion.name.split(',').map((p) => p.trim());
    const locality = parts[0] || 'Selected Area';
    const city = parts[1] || userLocationInfo?.city || 'Selected City';
    const state = parts.slice(-3, -1).join(', ') || userLocationInfo?.state || 'India';

    const updated = setUserPreciseLocation({
      city,
      state,
      lat: suggestion.lat,
      lng: suggestion.lng,
      locality,
      formattedAddress: suggestion.name,
      accuracyMeters: 5,
      source: 'pin'
    });

    setUserLocationInfo(updated);
    setUserLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setAddressSuggestions([]);
    setAddressSearchQuery('');
    setStatusNotification(`Radar recentered to ${locality}. Live distance recalculated!`);
    setTimeout(() => setStatusNotification(null), 4000);
    loadFacilities();
  };

  const filteredFacilities = facilities.filter(fac => {
    if (facilitySearch.trim()) {
      const q = facilitySearch.toLowerCase().trim();
      const match = 
        fac.name.toLowerCase().includes(q) || 
        fac.address.toLowerCase().includes(q) || 
        fac.category.toLowerCase().includes(q) ||
        (fac.stockDetails && fac.stockDetails.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'AED' && fac.hasAED) return true;
    if (selectedFilter === 'Anti-Venom' && (fac.hasAntiVenom || fac.hasRabiesVaccine)) return true;
    if (selectedFilter === 'Pharmacy' && (fac.category === '24/7 Pharmacy' || fac.hasBurnCare)) return true;
    if (selectedFilter === 'Trauma' && (fac.category === 'Trauma Center' || fac.category === 'Hospital')) return true;
    return true;
  });

  const handleViewRoute = async (fac: EmergencyFacility) => {
    if (selectedFacilityRoute?.facility.id === fac.id) {
      setSelectedFacilityRoute(null);
      return;
    }
    setLoadingRouteId(fac.id);
    try {
      const loc = userLocation || await getCurrentUserLocation();
      const route = await computeEmergencyRoute(loc, fac.coordinates, fac.name);
      setSelectedFacilityRoute({ facility: fac, route });
    } catch (err) {
      console.warn('Failed to compute route:', err);
    } finally {
      setLoadingRouteId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-accent to-[#E08A35] text-ink flex items-center justify-center font-bold shadow-md shrink-0">
              <Radar className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-ink">
                  Hyper-Local "Antidote & AED Radar"
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span>India Life Infrastructure</span>
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Locate Defibrillators in Metros, Cold-Chain ASV/ARV in Civil Hospitals, and 24/7 Burn Pharmacies within minutes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-base btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Search & Pinpoint Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-base to-accent/10 border border-primary/20 space-y-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="font-bold text-ink truncate">
                Radar Center: <span className="text-primary font-extrabold">{userLocationInfo?.houseNumber ? `${userLocationInfo.houseNumber}, ${userLocationInfo.locality || userLocationInfo.city}` : userLocationInfo?.locality ? `${userLocationInfo.locality}, ${userLocationInfo.city}` : userLocationInfo?.city || 'Detecting Area...'}, {userLocationInfo?.state || 'India'}</span>
              </span>
            </div>

            <button
              onClick={() => setIsLocationPickerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-primary hover:bg-primary/10 btn-press shadow-2xs shrink-0 flex items-center space-x-1.5"
              title="Open Draggable Leaflet Pin Map for rooftop fine-tuning"
            >
              <Crosshair className="w-3.5 h-3.5 text-alert" />
              <span>Fine-Tune Pin on Map</span>
            </button>
          </div>

          {/* Quick Address Search Bar */}
          <form onSubmit={handleAddressSearch} className="relative w-full">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={addressSearchQuery}
                onChange={(e) => setAddressSearchQuery(e.target.value)}
                placeholder="Search any colony, street, or address in India to move radar center (e.g. Hazratganj, Connaught Place)..."
                style={{ color: 'var(--app-ink)' }}
                className="w-full pl-9 pr-20 py-2 rounded-xl bg-surface border border-border text-xs text-ink text-[#12211D] dark:text-white placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs font-medium"
              />
              <button
                type="submit"
                disabled={isSearchingAddress}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark btn-press"
              >
                {isSearchingAddress ? '...' : 'Recenter'}
              </button>
            </div>

            {/* Address Suggestions Dropdown */}
            {addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl bg-surface border border-border shadow-xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                {addressSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAddressSuggestion(item)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-ink hover:bg-base rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Status notification */}
          {statusNotification && (
            <div className="p-2 rounded-lg bg-accent/20 border border-accent/40 text-[11px] font-bold text-ink flex items-center space-x-1.5 animate-in fade-in">
              <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{statusNotification}</span>
            </div>
          )}
        </div>

        {/* Facility Keyword Search & Count */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={facilitySearch}
              onChange={(e) => setFacilitySearch(e.target.value)}
              placeholder="Filter by name, facility or medication (e.g. Metro AED, Civil Hospital, Anti-Venom, KGMU)..."
              style={{ color: 'var(--app-ink)' }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-base border border-border text-xs text-ink text-[#12211D] dark:text-white placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl shrink-0">
            {filteredFacilities.length} Emergency Facilities in Range
          </span>
        </div>

        {/* India-Centric Life Infrastructure Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'All', label: 'All Emergency Assets' },
            { id: 'AED', label: '⚡ Metro & Transit AEDs' },
            { id: 'Anti-Venom', label: '🐍 Anti-Venom & Rabies (ASV / ARV)' },
            { id: 'Pharmacy', label: '💊 24/7 Pharmacies & Burn Supplies' },
            { id: 'Trauma', label: '🏥 Trauma Centers & ICUs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap font-bold border transition-all ${
                selectedFilter === tab.id
                  ? 'bg-ink text-surface border-ink shadow-xs'
                  : 'bg-base border-border text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Facility Route Preview (If User Clicked "View Live Route") */}
        {selectedFacilityRoute && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-3xl border-2 border-primary/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-primary flex items-center space-x-1.5">
                <Car className="w-4 h-4" />
                <span>Selected Destination Route: {selectedFacilityRoute.facility.name}</span>
              </span>
              <button
                onClick={() => setSelectedFacilityRoute(null)}
                className="text-xs text-ink-muted hover:text-alert font-bold"
              >
                ✕ Close Preview
              </button>
            </div>
            <EmergencyRouteMap
              facility={selectedFacilityRoute.facility}
              route={selectedFacilityRoute.route}
            />
          </div>
        )}

        {/* Facilities List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center space-y-2 bg-base rounded-2xl border border-border">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto" />
              <p className="text-xs text-ink-muted font-medium">
                Fetching nearest trauma centers & calculating live traffic routes...
              </p>
            </div>
          ) : filteredFacilities.length > 0 ? (
            filteredFacilities.map((fac) => (
              <div 
                key={fac.id}
                className={`p-4 sm:p-5 rounded-2xl bg-base border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedFacilityRoute?.facility.id === fac.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="space-y-2 max-w-lg">
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {fac.category}
                    </span>

                    {/* AED Location Type Badge */}
                    {fac.hasAED && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-alert/15 text-alert flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-alert" />
                        <span>{fac.aedLocationType ? `${fac.aedLocationType} AED` : 'Public AED'}</span>
                      </span>
                    )}

                    {/* Anti-Snake Venom Badge */}
                    {fac.hasAntiVenom && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/25 text-ink">
                        🐍 Cold-Chain ASV
                      </span>
                    )}

                    {/* Anti-Rabies Vaccine Badge */}
                    {fac.hasRabiesVaccine && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300">
                        💉 Anti-Rabies (ARV)
                      </span>
                    )}

                    {/* Sterile Burn Dressings Badge */}
                    {fac.hasBurnCare && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-300 flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>Burn Care & ORS</span>
                      </span>
                    )}

                    {/* 24/7 Hours */}
                    {fac.isOpen24Hours && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-success/15 text-success">
                        Open 24/7
                      </span>
                    )}
                  </div>

                  {/* Title & Address */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-ink">
                      {fac.name}
                    </h4>
                    <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                      {fac.address}
                    </p>
                  </div>

                  {/* Stock Availability Info Snippet */}
                  {fac.stockDetails && (
                    <div className="p-2 rounded-xl bg-surface border border-border/80 text-[11px] text-ink font-medium leading-tight">
                      <span className="font-bold text-primary">Asset Info: </span>
                      {fac.stockDetails}
                    </div>
                  )}

                  {/* Live Distance and Drive ETA */}
                  <div className="flex items-center space-x-3 text-xs font-bold text-primary pt-0.5">
                    <span>{fac.distanceKm} km from doorstep</span>
                    <span>•</span>
                    <span className="text-accent">{fac.etaMinutes} mins drive (Live Traffic)</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewRoute(fac)}
                    disabled={loadingRouteId === fac.id}
                    className="w-full py-2 px-3.5 rounded-xl bg-surface border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 btn-press flex items-center justify-center space-x-1.5 text-center shadow-2xs"
                  >
                    {loadingRouteId === fac.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Car className="w-3.5 h-3.5" />
                    )}
                    <span>{selectedFacilityRoute?.facility.id === fac.id ? 'Hide Route' : 'View Route & Map'}</span>
                  </button>

                  <a
                    href={fac.navUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3.5 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark btn-press flex items-center justify-center space-x-1.5 text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Live GPS Drive</span>
                  </a>

                  <a
                    href={`tel:${fac.phoneNumber}`}
                    className="w-full py-2 px-3.5 rounded-xl bg-surface border border-border text-ink font-bold text-xs hover:bg-base flex items-center justify-center space-x-1.5 text-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-alert" />
                    <span>Call Desk ({fac.phoneNumber})</span>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-base rounded-2xl border border-dashed border-border text-xs text-ink-muted">
              No matching emergency facilities found for this filter.
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-ink-muted">
          <span>Powered by Google Places API & Routes API</span>
          <button
            onClick={loadFacilities}
            className="font-bold text-primary hover:underline flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Coordinates</span>
          </button>
        </div>

      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationChanged={(fresh) => {
          setUserLocationInfo(fresh);
          setUserLocation({ lat: fresh.lat, lng: fresh.lng });
          loadFacilities();
        }}
      />
    </div>
  );
};
