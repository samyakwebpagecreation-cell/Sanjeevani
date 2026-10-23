import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Check, 
  X, 
  Crosshair, 
  Building2, 
  Navigation, 
  RefreshCw,
  Home,
  Layers,
  ShieldCheck,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import { 
  MAJOR_CITIES, 
  getUserLocationInfo, 
  setUserPreciseLocation, 
  clearManualLocation, 
  UserLocationInfo 
} from '../../services/placesRoutesService';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChanged: (info: UserLocationInfo) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onLocationChanged
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'address' | 'cities'>('map');
  const [currentInfo, setCurrentInfo] = useState<UserLocationInfo | null>(null);

  // Precision Coordinates State
  const [selectedLat, setSelectedLat] = useState<number>(26.8467);
  const [selectedLng, setSelectedLng] = useState<number>(80.9462);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLockingGPS, setIsLockingGPS] = useState<boolean>(false);

  // Specific House & Building Fields
  const [houseNumber, setHouseNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Lucknow');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [postalCode, setPostalCode] = useState('226001');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Load initial location
  useEffect(() => {
    if (!isOpen) return;

    getUserLocationInfo().then((info) => {
      setCurrentInfo(info);
      setSelectedLat(info.lat);
      setSelectedLng(info.lng);
      setCity(info.city || 'Lucknow');
      setStateName(info.state || 'Uttar Pradesh');
      if (info.houseNumber) setHouseNumber(info.houseNumber);
      if (info.buildingName) setBuildingName(info.buildingName);
      if (info.street) setStreet(info.street);
      if (info.landmark) setLandmark(info.landmark);
      if (info.locality) setLocality(info.locality);
      if (info.postalCode) setPostalCode(info.postalCode);
      if (info.accuracyMeters) setGpsAccuracy(info.accuracyMeters);
    });
  }, [isOpen]);

  // Reverse Geocoding when coordinates update
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        
        if (addr.house_number && !houseNumber) setHouseNumber(addr.house_number);
        if (addr.road) setStreet(addr.road);
        if (addr.suburb || addr.neighbourhood || addr.residential) {
          setLocality(addr.suburb || addr.neighbourhood || addr.residential || '');
        }
        if (addr.city || addr.town || addr.village) {
          setCity(addr.city || addr.town || addr.village || 'Lucknow');
        }
        if (addr.state) setStateName(addr.state);
        if (addr.postcode) setPostalCode(addr.postcode);
      }
    } catch {
      // ignore
    }
  };

  // Initialize and maintain the interactive Leaflet Map
  useEffect(() => {
    if (!isOpen || activeTab !== 'map' || !mapContainerRef.current) return;

    // Remove previous map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([selectedLat, selectedLng], 16);

      mapInstanceRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom Precise Draggable Pin
      const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="position: relative; width: 34px; height: 42px; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: #D93A3A; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(217,58,58,0.5);">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: white;"></div>
            </div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #D93A3A; opacity: 0.4; margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 40]
      });

      const marker = L.marker([selectedLat, selectedLng], {
        icon: pinIcon,
        draggable: true,
        autoPan: true
      }).addTo(map);

      markerInstanceRef.current = marker;

      marker.bindPopup('<b>Exact Emergency Doorstep</b><br/>Drag or tap anywhere to reposition').openPopup();

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setSelectedLat(pos.lat);
        setSelectedLng(pos.lng);
        setGpsAccuracy(null);
        reverseGeocode(pos.lat, pos.lng);
      });

      // Map click event to instantly teleport marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setSelectedLat(e.latlng.lat);
        setSelectedLng(e.latlng.lng);
        setGpsAccuracy(null);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 400);

    } catch (err) {
      console.warn('Leaflet initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // High Accuracy Hardware GPS Lock
  const handleLockHardwareGPS = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLockingGPS(true);
    setStatusMessage('Acquiring high-precision hardware GPS lock...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 5);

        setSelectedLat(lat);
        setSelectedLng(lng);
        setGpsAccuracy(accuracy);
        setIsLockingGPS(false);
        setStatusMessage(`GPS Locked! Accuracy: ±${accuracy} meters.`);

        if (markerInstanceRef.current && mapInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 17);
        }

        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLockingGPS(false);
        setStatusMessage(`GPS lock timeout (${err.message}). Defaulted to fine-tuned map pin.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Address Search via Nominatim
  const handleSearchAddress = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=6`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(
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
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: { name: string; lat: number; lng: number }) => {
    setSelectedLat(item.lat);
    setSelectedLng(item.lng);
    setSearchResults([]);
    setSearchQuery('');

    if (markerInstanceRef.current && mapInstanceRef.current) {
      markerInstanceRef.current.setLatLng([item.lat, item.lng]);
      mapInstanceRef.current.setView([item.lat, item.lng], 17);
    }

    reverseGeocode(item.lat, item.lng);
    setStatusMessage(`Located: ${item.name.split(',')[0]}`);
  };

  // 1-Tap City Hub Selection
  const handleSelectCityHub = (cityHub: { name: string; state: string; lat: number; lng: number }) => {
    setSelectedLat(cityHub.lat);
    setSelectedLng(cityHub.lng);
    setCity(cityHub.name);
    setStateName(cityHub.state);

    if (markerInstanceRef.current && mapInstanceRef.current) {
      markerInstanceRef.current.setLatLng([cityHub.lat, cityHub.lng]);
      mapInstanceRef.current.setView([cityHub.lat, cityHub.lng], 16);
    }

    reverseGeocode(cityHub.lat, cityHub.lng);
    setActiveTab('map');
  };

  // Save Final Medical Precision Location
  const handleConfirmLocation = () => {
    const combinedAddress = [
      houseNumber ? `House/Flat: ${houseNumber}` : '',
      buildingName,
      street,
      landmark ? `Near ${landmark}` : '',
      locality,
      city,
      postalCode ? `PIN: ${postalCode}` : '',
      stateName
    ].filter(Boolean).join(', ');

    const updated = setUserPreciseLocation({
      city,
      state: stateName,
      lat: selectedLat,
      lng: selectedLng,
      houseNumber,
      buildingName,
      street,
      landmark,
      locality,
      postalCode,
      formattedAddress: combinedAddress,
      accuracyMeters: gpsAccuracy || 5,
      source: 'pin'
    });

    onLocationChanged(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-7 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-alert/15 text-alert flex items-center justify-center font-bold">
              <Crosshair className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Medical-Grade Precision Location
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary">
                  Doorstep Precision
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Pin exact rooftop/gate coordinates and enter house numbers for ambulance dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-base"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-base rounded-2xl border border-border text-xs font-bold">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'map' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>1. Pinpoint on Map</span>
          </button>

          <button
            onClick={() => setActiveTab('address')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'address' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>2. House & Flat Details</span>
          </button>

          <button
            onClick={() => setActiveTab('cities')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'cities' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. Emergency Hubs</span>
          </button>
        </div>

        {/* Status / Alert Bar */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-xs font-semibold text-ink flex items-center space-x-2 animate-in fade-in">
            <Compass className="w-4 h-4 text-primary shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: PINPOINT ON MAP */}
        {/* ======================================================== */}
        {activeTab === 'map' && (
          <div className="space-y-3 animate-in fade-in">
            {/* Quick Search & GPS Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                  placeholder="Search colony, street, or building (e.g. Hazratganj, Indiranagar)..."
                  style={{ color: 'var(--app-ink)' }}
                  className="w-full pl-9 pr-20 py-2 rounded-xl bg-base border border-border text-xs text-ink text-[#12211D] dark:text-white placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleSearchAddress()}
                  disabled={isSearching}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-white font-bold text-[11px]"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              <button
                onClick={handleLockHardwareGPS}
                disabled={isLockingGPS}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold text-xs hover:bg-primary/20 btn-press flex items-center justify-center space-x-1.5 shrink-0 shadow-2xs"
              >
                {isLockingGPS ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                <span>Lock Device GPS</span>
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="space-y-1 p-2 rounded-xl bg-base border border-border max-h-36 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-2 rounded-lg hover:bg-surface text-xs font-semibold text-ink flex items-center justify-between"
                  >
                    <span className="truncate max-w-[480px]">{item.name}</span>
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Interactive Leaflet Map Container */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-base h-64 sm:h-72">
              <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '250px' }} />

              {/* Floating Coordinate Pill */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:right-auto bg-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border shadow-md text-[11px] z-[400] flex items-center justify-between sm:justify-start space-x-2">
                <span className="font-extrabold text-primary">
                  📍 {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
                </span>
                {gpsAccuracy && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    ±{gpsAccuracy}m lock
                  </span>
                )}
              </div>

              {/* Instruction banner */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-ink/80 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-medium text-center z-[400]">
                👉 Drag the red pin or tap directly on your rooftop / building entrance for absolute precision.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SPECIFIC HOUSE & FLAT DETAILS */}
        {/* ======================================================== */}
        {activeTab === 'address' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-3 rounded-xl bg-base border border-border text-xs text-ink-muted">
              Specify your exact doorway, apartment floor, and landmark so paramedics and first responders don't lose precious minutes searching when they arrive.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">
                  House / Flat / Door / Unit No. *
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. Flat 402, Tower B or House 12/B"
                  className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">
                  Building / Apartment / Society Name
                </label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. Eldeco Greens, Shalimar Heights"
                  className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">
                  Street / Road / Lane
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Prag Narain Road, MG Marg"
                  className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">
                  Prominent Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near St. Francis College, Opp SBI"
                  className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">
                  Colony / Sector / Area *
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Hazratganj, Gomti Nagar"
                  className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink block mb-1">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lucknow"
                    className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 226001"
                    className="w-full px-3 py-2 rounded-xl bg-base border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 1-TAP MAJOR EMERGENCY HUBS */}
        {/* ======================================================== */}
        {activeTab === 'cities' && (
          <div className="space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Select Verified Emergency Capital Hub</span>
              </span>
              <span className="text-[10px] text-ink-muted">Pre-indexed Level-1 Trauma</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {MAJOR_CITIES.map((hub) => {
                const isSelected = city.toLowerCase().includes(hub.name.toLowerCase().split('-')[0]);
                return (
                  <button
                    key={hub.name}
                    onClick={() => handleSelectCityHub(hub)}
                    className={`p-2.5 rounded-2xl border text-left transition-all btn-press flex items-center justify-between ${
                      isSelected 
                        ? 'border-primary bg-primary/15 ring-2 ring-primary/40 shadow-xs' 
                        : 'border-border bg-base hover:border-primary/40 hover:bg-surface'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <h5 className="text-xs font-bold text-ink truncate">{hub.name}</h5>
                      <span className="text-[10px] text-ink-muted block truncate">{hub.state}</span>
                    </div>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MEDICAL DISPATCH BEACON PREVIEW */}
        {/* ======================================================== */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-base to-accent/10 border border-primary/25 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ambulance & Responder Emergency Dispatch Beacon</span>
            </span>
            <span className="text-[10px] font-mono text-ink-muted">
              {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
            </span>
          </div>

          <p className="text-xs font-bold text-ink line-clamp-2">
            {[houseNumber, buildingName, street, landmark ? `Near ${landmark}` : '', locality, city, postalCode].filter(Boolean).join(', ') || `${city}, ${stateName}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-border">
          <button
            onClick={() => {
              clearManualLocation();
              handleLockHardwareGPS();
            }}
            className="text-xs text-ink-muted hover:text-primary font-semibold flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Live Sensor</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-base border border-border text-xs font-bold text-ink hover:bg-surface btn-press"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmLocation}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-md shadow-primary/20 btn-press flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lock Exact Location & Dispatch Coordinates</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
