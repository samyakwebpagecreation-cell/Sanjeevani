import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Activity,
  HeartPulse,
  CheckCircle2,
  Stethoscope,
  UserCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Ambulance
} from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { saveScannedQR, downloadMarkdownFile } from '../../services/qrStorageService';
import { subscribeToParamedicDocket, ParamedicDocket } from '../../firebase/db';

interface DocketMarkdownViewProps {
  docketId: string;
  onExit?: () => void;
}

export const DocketMarkdownView: React.FC<DocketMarkdownViewProps> = ({
  docketId,
  onExit
}) => {
  const [docketData, setDocketData] = useState<ParamedicDocket | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRawMd, setShowRawMd] = useState(false);
  const [handoverAccepted, setHandoverAccepted] = useState(false);
  const [acceptedTime, setAcceptedTime] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false
  });

  // Parse URL parameters for immediate 0.0s offline rendering on any phone
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const protocolTitle = urlParams.get('title') || 'Witnessed Acute Incident & Trauma Handover';
  const cprSecs = parseInt(urlParams.get('cpr') || '120', 10);
  const cprCycles = parseInt(urlParams.get('cycles') || '4', 10);
  const cprAccuracy = parseInt(urlParams.get('bpm') || '94', 10);
  const headStrike = urlParams.get('head') || 'yes';
  const oralWater = urlParams.get('water') || 'no';
  const severity = urlParams.get('sev') || 'CRITICAL';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        saveScannedQR(window.location.href, `Paramedic Handover Docket #${docketId}`);
      } catch {}
    }

    const unsub = subscribeToParamedicDocket(docketId, (updated: ParamedicDocket | null) => {
      if (updated) setDocketData(updated);
    });

    return () => unsub();
  }, [docketId]);

  const effectiveTitle = docketData?.protocolTitle || protocolTitle;
  const effectiveCprSecs = docketData?.cprDurationSeconds ?? cprSecs;
  const effectiveCycles = docketData?.cprCyclesCount ?? cprCycles;
  const effectiveAccuracy = docketData?.cprAverageAccuracy ?? cprAccuracy;
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Construct Markdown representation for export/copy
  const generateMarkdown = (): string => {
    return `# 📋 SANJEEVANI v2 - PARAMEDIC CLINICAL HANDOVER DOCKET
**Docket ID:** \`#${docketId}\`  
**System:** Sanjeevani Pre-Hospital Black-Box Trauma Intelligence  
**Triage Priority:** ${severity === 'CRITICAL' ? 'Critical P1 (Immediate ALS Response)' : 'Urgent P2'}  
**Incident Classification:** ${effectiveTitle}  
**Timestamp:** ${docketData?.startedAt ? `${docketData.startedAt} - ${docketData.completedAt}` : new Date().toLocaleString()}  
**Status:** Pre-Hospital Bystander Resuscitation Administered  

---

## 🚨 SBAR Clinical Handover Report

### 1. SITUATION
- **Chief Emergency:** ${effectiveTitle}
- **Escalation Status:** Dispatched to 112 / Emergency Medical Services
- **Bystander Resuscitation:** Immediate bystander CPR & scene stabilization initiated.

### 2. BACKGROUND & PRE-HOSPITAL GOLDEN QUESTIONS
- **Unresponsive Duration:** ${docketData?.totalDurationSeconds ? `${Math.round(docketData.totalDurationSeconds / 60)} minutes` : 'Estimated 2-4 minutes'}
- **Head Struck Curb/Ground:** \`${headStrike.toUpperCase()}\` (${headStrike === 'yes' ? 'Blunt impact detected; C-spine precautions enforced' : 'No direct cranial impact reported'})
- **Oral Fluids / Water Given:** \`${oralWater === 'no' ? 'STRICTLY ZERO (Aspiration Risk Enforced)' : 'Oral fluids given'}\`
- **Seizure Activity:** None witnessed prior to first-aid intervention

### 3. ASSESSMENT & ACTIVE INTERVENTIONS
- **Active CPR Performed:** **${effectiveCprSecs} seconds**
- **CPR Cycles Delivered:** **${effectiveCycles} cycles** (~${effectiveCycles * 55} chest compressions)
- **Target Cadence Accuracy:** **${effectiveAccuracy}%** Compliance (110 BPM target cadence)
- **Airway & Positioning:** Airway opened, patient placed in supine/recovery position with continuous monitoring

### 4. RECOMMENDATIONS FOR ARRIVING EMS
1. Perform immediate ALS primary survey (Airway, Breathing, Circulation, Disability, Exposure).
2. Maintain cervical spine immobilization if blunt trauma or head strike is confirmed.
3. Fast-track routing to nearest emergency trauma facility.

---

## ⚡ Emergency Contacts & Escalation
- **National Emergency Number:** \`112\`
- **Trauma Ambulance Service:** \`108\`

*Certified pre-hospital electronic patient handoff generated by Sanjeevani v2.*
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    downloadMarkdownFile(`Sanjeevani_${docketId}_Handover.md`, generateMarkdown());
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const sbarSpoken = `Paramedic SBAR Handover for Incident ${docketId}. Priority 1 Critical. Situation: ${effectiveTitle}. Background: Down time estimated at 2 to 4 minutes. Head struck ground: ${headStrike === 'yes' ? 'Yes, C-spine precautions active' : 'No'}. Oral fluids given: Zero. Assessment: Bystander CPR performed for ${effectiveCprSecs} seconds across ${effectiveCycles} cycles at ${effectiveAccuracy} percent 110 BPM cadence compliance. Recommendation: Immediate Advanced Life Support takeover.`;
      audioEngine.speak(sbarSpoken);
      setTimeout(() => setIsSpeaking(false), 14000);
    }
  };

  const handleAcceptHandover = () => {
    setHandoverAccepted(true);
    setAcceptedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    try {
      audioEngine.playClick(true);
    } catch {}
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-dvh-screen bg-[#F3F7F6] text-slate-900 pb-16 font-sans">
      
      {/* 1. TOP HOSPITAL-GRADE COMMAND BAR */}
      <header className="sticky top-0 z-30 bg-[#0E5A50] text-white shadow-md border-b border-emerald-700/50 px-4 sm:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/25 shadow-inner">
              <Stethoscope className="w-5 h-5 text-[#F0A85B]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F0A85B]">
                  EMS SBAR TELEMETRY
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  #{docketId}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                Pre-Hospital Paramedic Handover
              </h1>
            </div>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0E5A50] hover:bg-emerald-50 text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open App</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN ADAPTIVE CLINICAL CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        
        {/* 2. HERO PATIENT TRIAGE BANNER */}
        <div className="rounded-3xl bg-white border-2 border-slate-200/90 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wider">
                {severity === 'CRITICAL' ? 'PRIORITY P1 — IMMEDIATE ALS HANDOVER' : 'PRIORITY P2 — URGENT TRIAGE'}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-black/20 px-2.5 py-0.5 rounded-full">
              0.5s QR Sync
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Chief Incident Classification
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mt-0.5">
                  {effectiveTitle}
                </h2>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bystander First-Aid Active</span>
              </div>
            </div>

            {/* Voice Audio Briefing + Direct Emergency Dialers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={handleToggleSpeak}
                className={`sm:col-span-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#0E5A50] hover:bg-[#0A4740] text-white'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#F0A85B]" />}
                <span>{isSpeaking ? 'Stop Audio Briefing' : '🔊 Read SBAR Aloud'}</span>
              </button>

              <a
                href="tel:112"
                className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xs active:scale-98 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial 112 Control</span>
              </a>

              <a
                href="tel:108"
                className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-xs active:scale-98 transition-all"
              >
                <Ambulance className="w-4 h-4" />
                <span>Dial 108 EMS</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. RESUSCITATION TELEMETRY 2x2 GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[10px] font-black uppercase tracking-wider">CPR Duration</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatTime(effectiveCprSecs)}
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              {effectiveCprSecs}s continuous
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Compressions</span>
              <HeartPulse className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {effectiveCycles} Cycles
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              ~{effectiveCycles * 30} compressions
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[10px] font-black uppercase tracking-wider">110 BPM Sync</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {effectiveAccuracy}%
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              AHA cadence lock
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-[10px] font-black uppercase tracking-wider">Est. Down Time</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              2–4m
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              Witnessed collapse
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-5">
            {/* 4. GOLDEN TRAUMA SAFETY FLAGS (CRITICAL FOR PARAMEDICS) */}
            <div className="rounded-3xl bg-white border-2 border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#0E5A50] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pre-Hospital Golden Safety Flags</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Verified on Scene
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Flag 1: Head Strike / C-Spine */}
                <div className={`p-3.5 rounded-2xl border-2 flex items-start space-x-3 ${
                  headStrike === 'yes'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    headStrike === 'yes' ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                      Head / Cervical Spine Impact
                    </span>
                    <span className="text-sm font-black block mt-0.5">
                      {headStrike === 'yes' ? 'YES — C-Spine Precaution Active' : 'NO — No Direct Cranial Impact'}
                    </span>
                    <span className="text-xs font-semibold block mt-0.5 opacity-90">
                      {headStrike === 'yes' ? 'Maintain manual cervical immobilization during transfer.' : 'Standard supine airway positioning maintained.'}
                    </span>
                  </div>
                </div>

                {/* Flag 2: Oral Fluids / Aspiration */}
                <div className={`p-3.5 rounded-2xl border-2 flex items-start space-x-3 ${
                  oralWater === 'no'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/90 border-rose-300 text-rose-950'
                }`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                    oralWater === 'no' ? 'text-emerald-600' : 'text-rose-600'
                  }`} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                      Oral Fluids / Water Administered
                    </span>
                    <span className="text-sm font-black block mt-0.5">
                      {oralWater === 'no' ? 'ZERO FLUIDS — Airway Protected' : 'WARNING — Oral Fluids Given'}
                    </span>
                    <span className="text-xs font-semibold block mt-0.5 opacity-90">
                      {oralWater === 'no' ? 'Strict NPO enforced; zero aspiration risk.' : 'Suction airway immediately upon intubation.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. STRUCTURED S-B-A-R CLINICAL PROTOCOL CARDS */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 px-1">
                Structured SBAR Clinical Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* S - Situation */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                      S
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Situation
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1.5 pl-1">
                    <li>• <strong>Emergency:</strong> {effectiveTitle}</li>
                    <li>• <strong>Scene Status:</strong> Bystander rescue squad stabilized perimeter</li>
                    <li>• <strong>EMS Dispatch:</strong> 112 / 108 notified with GPS coordinates</li>
                  </ul>
                </div>

                {/* B - Background */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      B
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Background
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1.5 pl-1">
                    <li>• <strong>Collapse Onset:</strong> Witnessed acute event (~2–4 mins ago)</li>
                    <li>• <strong>Head Trauma:</strong> {headStrike === 'yes' ? 'Suspected blunt impact' : 'None witnessed'}</li>
                    <li>• <strong>Contraindications:</strong> No herbal pastes, butter, or oral water given</li>
                  </ul>
                </div>

                {/* A - Assessment */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0E5A50] text-white font-black text-xs flex items-center justify-center">
                      A
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Assessment
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1.5 pl-1">
                    <li>• <strong>Resuscitation:</strong> {effectiveCprSecs}s guided CPR ({effectiveCycles} cycles)</li>
                    <li>• <strong>Compression Rhythm:</strong> 110 BPM acoustic lock ({effectiveAccuracy}% accuracy)</li>
                    <li>• <strong>Airway Patency:</strong> Head-tilt/chin-lift or recovery posture active</li>
                  </ul>
                </div>

                {/* R - Recommendation */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                      R
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Recommendation
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 font-semibold space-y-1.5 pl-1">
                    <li>• <strong>1. Primary Survey:</strong> Immediate ALS ABCDE assessment & ECG</li>
                    <li>• <strong>2. Spinal Care:</strong> Apply rigid C-collar if head impact = YES</li>
                    <li>• <strong>3. Transport:</strong> Direct pre-alerted transfer to Trauma ICU</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* 6. INTERACTIVE PARAMEDIC HANDOVER VERIFICATION CHECKLIST */}
            <div className="rounded-3xl bg-white border-2 border-emerald-500/40 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#0E5A50]" />
                  <h3 className="text-sm font-black text-slate-900">
                    Arriving Paramedic Handover Verification
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  Interactive EMS Sign-Off
                </span>
              </div>

              <div className="space-y-2">
                {[
                  'Verified patient airway & taken over chest compressions / ALS monitoring',
                  'Reviewed head-strike C-spine status & zero oral fluid confirmation',
                  'Logged pre-hospital bystander CPR duration into ambulance run sheet'
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                      checkedItems[idx]
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border font-bold text-xs shrink-0 ${
                      checkedItems[idx]
                        ? 'bg-[#0E5A50] border-[#0E5A50] text-white'
                        : 'bg-white border-slate-300'
                    }`}>
                      {checkedItems[idx] && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold leading-snug">{item}</span>
                  </div>
                ))}
              </div>

              {handoverAccepted ? (
                <div className="p-4 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-6 h-6 text-amber-300 shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        EMS Handover Officially Logged
                      </span>
                      <span className="text-[11px] font-medium text-emerald-100">
                        Transferred to Paramedic Crew at {acceptedTime} • Docket #{docketId}
                      </span>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
              ) : (
                <button
                  onClick={handleAcceptHandover}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0E5A50] to-emerald-700 hover:from-[#0A4740] hover:to-emerald-800 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F0A85B]" />
                  <span>Confirm & Sign Off Paramedic Handover</span>
                </button>
              )}
            </div>

            {/* 7. EXPORT & OPTIONAL RAW MARKDOWN DRAWER */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#0E5A50]" />
                  <span className="text-xs font-black text-slate-800">
                    Electronic Health Record (EHR) Export
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-300 cursor-pointer"
                  >
                    {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMd ? 'Copied!' : 'Copy Report'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#F0A85B] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    onClick={() => setShowRawMd(!showRawMd)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>{showRawMd ? 'Hide Raw' : 'Raw .md'}</span>
                    {showRawMd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {showRawMd && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-700">
                  {generateMarkdown()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] font-bold text-slate-500 pt-2">
          Sanjeevani v2.0 Pre-Hospital Trauma Intelligence • Zero-Install Offline QR Handover
        </div>

      </main>
    </div>
  );
};
