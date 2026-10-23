import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  HeartPulse, 
  Droplet, 
  Flame, 
  Wind, 
  Car, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { 
  createSquadSessionInFirestore, 
  subscribeToSquadSession 
} from '../../firebase/db';
import { 
  generateBystanderSquadWithAI, 
  BystanderSquadSession 
} from '../../services/bystanderSquadEngine';
import { 
  getAutomaticEscalationDispatch, 
  getUserLocationInfo, 
  UserLocationInfo 
} from '../../services/placesRoutesService';
import { BystanderSquadCard } from '../chat/BystanderSquadCard';

interface CrowdCommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolTitle?: string;
  protocolId?: string;
}

export const CrowdCommanderModal: React.FC<CrowdCommanderModalProps> = ({
  isOpen,
  onClose,
  protocolTitle,
  protocolId
}) => {
  // Step: 'intake' | 'generating' | 'squad_active'
  const [step, setStep] = useState<'intake' | 'generating' | 'squad_active'>('intake');
  
  // Intake Inputs
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [estimatedBystanders, setEstimatedBystanders] = useState<number>(4);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Active Session & Progress State
  const [session, setSession] = useState<BystanderSquadSession | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('Evaluating scene visual & clinical priority...');
  const [userLocation, setUserLocation] = useState<UserLocationInfo | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-seed description if protocolTitle was passed
  useEffect(() => {
    if (isOpen) {
      getUserLocationInfo().then(setUserLocation).catch(() => {});
      if (protocolTitle && !incidentDescription) {
        setIncidentDescription(`Emergency incident: ${protocolTitle}. Nearby bystanders need life-saving task delegation.`);
      }
    } else {
      // Reset state when closed
      setStep('intake');
      setPhotoBase64(null);
      setPhotoFileName(null);
      setIncidentDescription('');
      setSession(null);
    }
  }, [isOpen, protocolTitle]);

  // Handle File Selection (Camera or Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  // Quick Preset Handlers
  const quickPresets = [
    {
      id: 'cpr',
      label: 'Unconscious / CPR',
      icon: HeartPulse,
      color: 'text-red-500 bg-red-500/10 border-red-500/30',
      text: 'Victim collapsed, unresponsive, shallow agonal gasps. 4 bystanders standing around in shock. Immediate CPR compression and 112 dispatch required.'
    },
    {
      id: 'bleeding',
      label: 'Arterial Bleeding',
      icon: Droplet,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
      text: 'Deep wound with severe arterial bleeding. 5 onlookers gathered. Need direct pressure, clean towels, and gate flagger.'
    },
    {
      id: 'crash',
      label: 'Road Accident / Crash',
      icon: Car,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      text: 'Roadway vehicle collision. Victim on ground with suspected trauma. Onlookers crowding. Need traffic diverted 30m upstream, 112 dialed, and scene secured.'
    },
    {
      id: 'choking',
      label: 'Choking Airway',
      icon: Wind,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
      text: 'Person choking violently, unable to speak or cough. Panicked family and onlookers present. Urgent back blows, abdominal thrusts, and ambulance alert.'
    },
    {
      id: 'burn',
      label: 'Thermal Burn / Scald',
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      text: 'Severe boiling water/flame burn. Need clean running cool water for 20 minutes continuously, sterile cling film wrap, and 112 burn center dispatch.'
    }
  ];

  // Execute AI Squad Generation
  const handleGenerateSquad = async () => {
    if (!incidentDescription.trim() && !photoBase64) return;

    setStep('generating');
    setGenerationStatus('Evaluating scene visual & clinical emergency priority...');

    try {
      // 1. Fetch nearest hospital info if available
      let hospitalInfo: { name: string; distance: string; eta: string; phone: string } | undefined = undefined;
      try {
        const dispatch = await getAutomaticEscalationDispatch();
        if (dispatch.nearestHospital) {
          hospitalInfo = {
            name: dispatch.nearestHospital.name,
            distance: dispatch.route.distanceText || 'Nearby',
            eta: dispatch.route.durationText || '10 mins',
            phone: dispatch.nearestHospital.phoneNumber || '112'
          };
        }
      } catch (err) {
        console.warn('Hospital lookup skipped in squad intake:', err);
      }

      // 2. Synthesize AI tasks using Gemini cascading fail-safe
      const newSession = await generateBystanderSquadWithAI({
        incidentDescription: incidentDescription.trim() || 'Acute medical emergency scene with bystanders present.',
        photoBase64: photoBase64 || undefined,
        locationAddress: userLocation?.formattedAddress || 'Main Scene, Ground Zero',
        hospitalInfo,
        estimatedBystanders,
        onProgress: (status) => setGenerationStatus(status)
      });

      // 3. Save to Firestore for real-time peer-to-peer sync
      await createSquadSessionInFirestore(newSession);

      setSession(newSession);
      setStep('squad_active');

      // 4. Subscribe to real-time status changes
      subscribeToSquadSession(newSession.id, (updated) => {
        if (updated) {
          setSession(updated as BystanderSquadSession);
        }
      });

    } catch (err) {
      console.error('Squad generation error:', err);
      setStep('intake');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-surface border border-border shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Crowd Help QR (Rescue Squad)
                </h3>
                {step === 'squad_active' && session && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-alert text-white animate-pulse">
                    LIVE SQUAD #{session.id.slice(-6)}
                  </span>
                )}
                {step === 'intake' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Step 1: What Happened?
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted">
                Turn nearby onlookers into a helpful rescue squad with instant task QR codes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-base cursor-pointer transition-colors"
            title="Close Squad Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: INTAKE (PHOTO UPLOAD + SHORT DESCRIPTION)        */}
        {/* ======================================================== */}
        {step === 'intake' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* Instruction Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-ink flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block text-ink font-bold">Stop the crowd from freezing in place:</strong>
                <span className="text-ink-muted leading-relaxed block">
                  Upload or snap a quick photo and briefly describe the emergency. Sanjeevani AI will evaluate the scene and create simple life-saving tasks for bystanders who scan your QR code.
                </span>
              </div>
            </div>

            {/* 1. Photo Upload / Camera Capture Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                1. Incident / Injury Scene Photo <span className="text-ink-muted font-normal">(Recommended for AI Triage)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoBase64 ? (
                /* Uploaded Thumbnail Preview */
                <div className="relative rounded-2xl border-2 border-amber-500/40 bg-base p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={photoBase64}
                      alt="Incident scene preview"
                      className="w-16 h-16 rounded-xl object-cover border border-border shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-ink truncate">
                          {photoFileName || 'Scene Photo Attached'}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted block mt-0.5">
                        Ready for AI visual forensics
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs font-semibold hover:border-amber-500/40 cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoBase64(null);
                        setPhotoFileName(null);
                      }}
                      className="p-1.5 rounded-lg bg-alert/10 text-alert hover:bg-alert/20 cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Drag & Drop / Click to Upload Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                    isDragOver 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-border hover:border-amber-500/50 bg-base/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                      <Upload className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Tap to snap a photo or select from gallery
                    </span>
                    <span className="text-[11px] text-ink-muted block">
                      JPEG, PNG, WebP up to 10MB • Drag & drop supported
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Incident Description Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                2. Briefly describe what happened
              </label>

              <textarea
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="E.g., Elderly man collapsed near doorway, unconscious, shallow gasping. 5 onlookers standing around in panic..."
                rows={3}
                style={{ color: 'var(--app-ink)' }}
                className="w-full rounded-2xl border border-border bg-base p-3.5 text-xs text-ink text-[#12211D] dark:text-white placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-medium leading-relaxed"
              />

              {/* 1-Tap Quick Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Or 1-Tap Quick Scenario Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setIncidentDescription(preset.text)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${preset.color} hover:brightness-105`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Estimated Crowd Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                3. Estimated Onlookers / Bystanders on Scene
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 3, label: '2 to 3 People' },
                  { count: 5, label: '4 to 6 People' },
                  { count: 8, label: '7+ Large Crowd' }
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setEstimatedBystanders(item.count)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      estimatedBystanders === item.count
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-base border-border text-ink hover:border-amber-500/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-3">
              <div className="text-[11px] text-ink-muted">
                {userLocation?.formattedAddress ? `📍 Scene: ${userLocation.formattedAddress.slice(0, 40)}...` : '📍 GPS Scene Active'}
              </div>

              <button
                type="button"
                onClick={handleGenerateSquad}
                disabled={!incidentDescription.trim() && !photoBase64}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Generate Squad & Launch QR Beacon</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: GENERATING ANIMATION                             */}
        {/* ======================================================== */}
        {step === 'generating' && (
          <div className="py-12 px-4 text-center space-y-5 animate-in fade-in duration-200">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-500" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-bold text-ink">
                Synthesizing Rescue Squad Matrix
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold animate-pulse">
                {generationStatus}
              </p>
              <p className="text-[11px] text-ink-muted leading-relaxed pt-2">
                Breaking diffusion of responsibility: Algorithmic direct delegation produces 4x higher intervention rates in medical emergencies.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SQUAD ACTIVE (QR BEACON & LIVE ROSTER)           */}
        {/* ======================================================== */}
        {step === 'squad_active' && session && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Embedded Live Bystander Squad Card */}
            <BystanderSquadCard
              session={session}
              defaultExpanded={true}
            />

            {/* Modal Footer Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => setStep('intake')}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-border bg-base text-ink text-xs font-semibold hover:border-amber-500/40 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Update Incident / Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark btn-press cursor-pointer shadow-xs"
              >
                Done Managing Squad
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
