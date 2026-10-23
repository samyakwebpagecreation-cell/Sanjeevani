import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  PhoneCall, 
  ArrowLeft, 
  ShieldAlert, 
  X
} from 'lucide-react';
import { getAutomaticEscalationDispatch, EmergencyFacility, RouteComputationResult } from '../../services/placesRoutesService';
import { EmergencyRouteMap } from './EmergencyRouteMap';

interface EscalationModalProps {
  isOpen: boolean;
  reason?: string;
  onDismiss: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  reason,
  onDismiss
}) => {
  const [hospitalInfo, setHospitalInfo] = useState<{
    facility: EmergencyFacility;
    route: RouteComputationResult;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    getAutomaticEscalationDispatch()
      .then(({ nearestHospital, route }) => {
        setHospitalInfo({ facility: nearestHospital, route });
      })
      .catch((err) => console.warn('Escalation dispatch lookup error:', err));
  }, [isOpen]);

  // Allow closing with the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-surface border-2 border-alert shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Pinned Top Banner with Alert (#D93A3A) fill and Top-Right Cross/Exit Button */}
        <div className="relative shrink-0 bg-alert px-5 py-4 sm:px-6 sm:py-5 text-white text-center">
          {/* Prominent Top-Right Cross (X) & Exit Button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close 112 SOS Modal"
            title="Close / Exit 112 SOS"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 hover:bg-black/55 active:scale-95 text-white border border-white/35 text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.75]" />
            <span>Exit</span>
          </button>

          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/20 mb-2.5 animate-bounce">
            <AlertOctagon className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={2.5} />
          </div>
          
          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/25 text-white mb-1.5">
            SERIOUS EMERGENCY • DETERMINISTIC OVERRIDE
          </span>
          
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans uppercase">
            STOP. GET AN ADULT. CALL 112.
          </h2>

          {reason && (
            <div className="mt-2 px-3 py-1 rounded-lg bg-black/20 text-[11px] font-medium text-white/90 inline-block">
              Trigger: {reason}
            </div>
          )}
        </div>

        {/* Scrollable Content Body (Map + Safety Notice) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="rounded-2xl bg-base p-3.5 border border-border">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-alert shrink-0 mt-0.5" strokeWidth={2} />
              <div className="text-xs space-y-1 text-ink">
                <p className="font-semibold text-ink">
                  We paused first-aid guidance for patient safety.
                </p>
                <p className="text-ink-muted">
                  This injury requires immediate medical response. Stay calm, stay right beside the patient, and dispatch emergency services or follow the hospital route below.
                </p>
              </div>
            </div>
          </div>

          {/* Nearest Trauma Hospital Dispatch Card with Live Driving Route (Places & Routes API) */}
          {hospitalInfo && (
            <EmergencyRouteMap
              facility={hospitalInfo.facility}
              route={hospitalInfo.route}
              compact={true}
            />
          )}
        </div>

        {/* Pinned Bottom Action Bar: Call 112 + Clear Cancel/Exit Button */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-4 bg-surface border-t border-border space-y-2.5">
          <a
            href="tel:112"
            className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-6 rounded-xl bg-alert text-white font-bold text-sm sm:text-base shadow-lg shadow-alert/25 hover:bg-alert/90 btn-press text-center"
          >
            <PhoneCall className="h-5 w-5" strokeWidth={2.5} />
            <span>Call Emergency (112) Now</span>
          </a>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-bold btn-press transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-alert shrink-0" strokeWidth={2.5} />
            <span>Cancel & Exit 112 SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

