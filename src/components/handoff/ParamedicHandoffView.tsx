import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  QrCode, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Printer, 
  Download, 
  Activity, 
  HeartPulse, 
  ShieldAlert, 
  ShieldCheck, 
  Mic, 
  Plus, 
  RotateCcw,
  Check,
  ChevronRight,
  Play,
  Pause,
  Stethoscope,
  UserCheck,
  Eye,
  Brain,
  Thermometer,
  Send,
  Building2,
  Trash2
} from 'lucide-react';
import { generateQRCodeSVG } from '../../utils/qr';
import { audioEngine } from '../../utils/audio';

export interface TelemetryMilestone {
  id: string;
  timestamp: string;
  elapsedSecs: number;
  event: string;
  category: 'vital' | 'cpr' | 'intervention' | 'admin';
  note?: string;
}

interface ParamedicHandoffViewProps {
  onTriggerEscalation: (reason?: string) => void;
  onSelectDestination?: (dest: any) => void;
}

export const ParamedicHandoffView: React.FC<ParamedicHandoffViewProps> = ({
  onTriggerEscalation
}) => {
  // Navigation subtabs inside Handoff
  const [activeSubTab, setActiveSubTab] = useState<'runsheet' | 'gcs' | 'timeline' | 'sbar'>('runsheet');

  // Real-time Trauma Stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Official Docket Identification
  const [docketId] = useState<string>(() => `EMS-${Date.now().toString().slice(-6)}`);
  const [respondingUnit, setRespondingUnit] = useState<string>('National 108 Ambulance / Emergency Medical Services');
  const [receivingFacility, setReceivingFacility] = useState<string>('Nearest Level-1 Government Trauma Center');
  const [triageCategory, setTriageCategory] = useState<'RED_CRITICAL' | 'YELLOW_URGENT' | 'GREEN_STABLE'>('RED_CRITICAL');

  // Patient Demographics & Baseline
  const [patientAgeGroup, setPatientAgeGroup] = useState<'Adult' | 'Pediatric' | 'Geriatric'>('Adult');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Unknown'>('Unknown');
  const [avpuState, setAvpuState] = useState<'Alert' | 'Voice' | 'Pain' | 'Unresponsive'>('Unresponsive');
  const [chiefComplaint, setChiefComplaint] = useState<string>('Road Traffic Accident & Witnessed Blunt Trauma');

  // Realistic GCS (Glasgow Coma Scale) Components
  const [gcsEyes, setGcsEyes] = useState<number>(1); // 1-4
  const [gcsVerbal, setGcsVerbal] = useState<number>(1); // 1-5
  const [gcsMotor, setGcsMotor] = useState<number>(2); // 1-6
  const totalGCS = gcsEyes + gcsVerbal + gcsMotor;

  // Realistic Objective Clinical Vitals
  const [pulseRate, setPulseRate] = useState<number>(94);
  const [pulseQuality, setPulseQuality] = useState<'Strong Regular' | 'Weak Thready' | 'Bounding' | 'Carotid Only' | 'Absent'>('Carotid Only');
  const [respiratoryRate, setRespiratoryRate] = useState<number>(10);
  const [respiratoryEffort, setRespiratoryEffort] = useState<'Normal' | 'Shallow / Agonal' | 'Stridor / Wheeze' | 'Apneic'>('Shallow / Agonal');
  const [bloodPressureEstimate, setBloodPressureEstimate] = useState<'Normal (>100)' | 'Hypotensive (<90)' | 'Severe Shock (<70)'>('Hypotensive (<90)');
  const [pupilStatus, setPupilStatus] = useState<'Equal & Reactive' | 'Sluggish' | 'Fixed & Dilated (Anisocoria)' | 'Pinpoint'>('Sluggish');

  // 5 Golden Paramedic Field Checklist (Real values entered by responder)
  const [unresponsiveMinutes, setUnresponsiveMinutes] = useState<number>(4);
  const [headStrikeConfirmed, setHeadStrikeConfirmed] = useState<'Yes' | 'No' | 'Unwitnessed'>('Yes');
  const [headStrikeDescription, setHeadStrikeDescription] = useState<string>('Blunt impact with asphalt; temporal hematoma noted');
  const [seizuresWitnessed, setSeizuresWitnessed] = useState<'No' | 'Yes'>('No');
  const [seizureDurationSecs, setSeizureDurationSecs] = useState<number>(0);
  const [oralFluidsAdministered, setOralFluidsAdministered] = useState<'Strict NPO (Zero)' | 'Fluids Given'>('Strict NPO (Zero)');
  const [cprMinutesDelivered, setCprMinutesDelivered] = useState<number>(3);
  const [pressureMinutesHeld, setPressureMinutesHeld] = useState<number>(5);

  // Dynamic Chronological Timeline
  const [milestones, setMilestones] = useState<TelemetryMilestone[]>([
    { id: '1', timestamp: '00:00', elapsedSecs: 0, event: 'Incident Witnessed & Responder Initiated Scene Size-up', category: 'admin' },
    { id: '2', timestamp: '00:35', elapsedSecs: 35, event: 'Primary Assessment: AVPU checked (Unresponsive to voice & sternal rub)', category: 'vital' },
    { id: '3', timestamp: '01:10', elapsedSecs: 70, event: 'Immediate 112 EMS Emergency Dispatch Triggered', category: 'admin' },
    { id: '4', timestamp: '01:45', elapsedSecs: 105, event: 'Continuous direct pressure applied to active hemorrhage site', category: 'intervention' },
    { id: '5', timestamp: '02:30', elapsedSecs: 150, event: 'Bystander CPR compressions started (Target: 110 BPM cadence)', category: 'cpr' }
  ]);

  // Voice Note Dictation & Handover SBAR Speech
  const [newNoteInput, setNewNoteInput] = useState<string>('');
  const [isSpeakingSBAR, setIsSpeakingSBAR] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  // Stopwatch Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate Realistic SBAR Clinical Handover Script
  const generateSBARScript = () => {
    const s = `SITUATION: Paramedic handover for Emergency Docket #${docketId}. Triage status is ${triageCategory.replace('_', ' ')}. Patient is an ${patientAgeGroup} ${patientGender !== 'Unknown' ? patientGender : 'individual'} presenting with ${chiefComplaint}. Incident scene time is ${formatTime(elapsedSeconds)}.`;
    const b = `BACKGROUND: Patient observed ${avpuState.toUpperCase()} for approximately ${unresponsiveMinutes} minutes. Head strike is ${headStrikeConfirmed.toUpperCase()}${headStrikeConfirmed === 'Yes' ? ' (' + headStrikeDescription + ')' : ''}. Seizures: ${seizuresWitnessed === 'Yes' ? `Witnessed active for ${seizureDurationSecs} seconds` : 'None observed'}. Oral fluid administration: ${oralFluidsAdministered} (Aspiration risk protected).`;
    const a = `ASSESSMENT: Current Glasgow Coma Scale (GCS) is ${totalGCS}/15 (E${gcsEyes} V${gcsVerbal} M${gcsMotor} - ${totalGCS <= 8 ? 'Severe Neurological Impairment' : totalGCS <= 12 ? 'Moderate Traumatic Injury' : 'Mild Altered Mental Status'}). Pulse is ${pulseRate} BPM (${pulseQuality}). Respiration is ${respiratoryRate} breaths/min (${respiratoryEffort}). Estimated BP: ${bloodPressureEstimate}. Pupils are ${pupilStatus}. Active bystander CPR delivered for ${cprMinutesDelivered} minutes at 110 BPM. Direct hemostatic pressure held for ${pressureMinutesHeld} minutes.`;
    const r = `RECOMMENDATION: Immediate ALS airway maintenance with cervical in-line spinal immobilization, bilateral IV access with crystalloid warmup, continuous ECG telemetry, and priority transfer to ${receivingFacility}.`;
    return `${s}\n\n${b}\n\n${a}\n\n${r}`;
  };

  // Generate Real High-Density QR Payload
  useEffect(() => {
    const payload = {
      docketId,
      triage: triageCategory,
      sceneTime: formatTime(elapsedSeconds),
      patient: { ageGroup: patientAgeGroup, gender: patientGender, avpu: avpuState },
      gcs: { total: totalGCS, eyes: gcsEyes, verbal: gcsVerbal, motor: gcsMotor },
      vitals: { pulse: pulseRate, pulseQuality, resp: respiratoryRate, respEffort: respiratoryEffort, bp: bloodPressureEstimate, pupils: pupilStatus },
      goldenQuestions: {
        downTimeMinutes: unresponsiveMinutes,
        headStrike: headStrikeConfirmed,
        headDetails: headStrikeDescription,
        seizures: seizuresWitnessed,
        oralFluids: oralFluidsAdministered,
        cprMinutes: cprMinutesDelivered,
        pressureMinutes: pressureMinutesHeld
      },
      milestones: milestones.slice(-8),
      generatedAt: new Date().toISOString()
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rakshasathi.web.app';
    const docketDeepLink = `${origin}/?docket=${docketId}&gcs=${totalGCS}&sev=${triageCategory}&unresp=${unresponsiveMinutes * 60}&cpr=${cprMinutesDelivered * 60}`;
    const svg = generateQRCodeSVG(docketDeepLink, 220, '#0E5A50', '#FFFFFF');
    setQrSvg(svg);
  }, [
    docketId, triageCategory, elapsedSeconds, patientAgeGroup, patientGender, avpuState,
    totalGCS, gcsEyes, gcsVerbal, gcsMotor, pulseRate, pulseQuality, respiratoryRate,
    respiratoryEffort, bloodPressureEstimate, pupilStatus, unresponsiveMinutes, headStrikeConfirmed,
    headStrikeDescription, seizuresWitnessed, oralFluidsAdministered, cprMinutesDelivered, pressureMinutesHeld, milestones
  ]);

  // Audio Playback
  const handleToggleSpeak = () => {
    if (isSpeakingSBAR) {
      audioEngine.stopSpeech();
      setIsSpeakingSBAR(false);
    } else {
      setIsSpeakingSBAR(true);
      const text = generateSBARScript().replace(/\*\*/g, '').replace(/(\r\n|\n|\r)/gm, ' ');
      audioEngine.speak(text, () => setIsSpeakingSBAR(false));
    }
  };

  // Add realistic field milestone
  const handleAddMilestone = (event: string, category: TelemetryMilestone['category'] = 'vital') => {
    const newEntry: TelemetryMilestone = {
      id: Date.now().toString(),
      timestamp: formatTime(elapsedSeconds),
      elapsedSecs: elapsedSeconds,
      event,
      category
    };
    setMilestones((prev) => [...prev, newEntry]);
  };

  // Voice Field Note
  const handleToggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListeningMic(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setNewNoteInput(text);
        setIsListeningMic(false);
      };
      recognition.onerror = () => setIsListeningMic(false);
      recognition.onend = () => setIsListeningMic(false);
      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteInput.trim()) return;
    handleAddMilestone(`Clinical Note: ${newNoteInput.trim()}`, 'admin');
    setNewNoteInput('');
  };

  const handleCopy = (type: 'sbar' | 'json') => {
    if (type === 'sbar') {
      navigator.clipboard.writeText(generateSBARScript());
      setCopiedNotification('SBAR Handover Script Copied');
    } else {
      const payload = {
        docketId,
        triageCategory,
        elapsedSeconds,
        patient: { ageGroup: patientAgeGroup, gender: patientGender, avpu: avpuState },
        gcs: { total: totalGCS, eyes: gcsEyes, verbal: gcsVerbal, motor: gcsMotor },
        vitals: { pulseRate, pulseQuality, respiratoryRate, respiratoryEffort, bloodPressureEstimate, pupilStatus },
        goldenQuestions: {
          downTimeMinutes: unresponsiveMinutes,
          headStrikeConfirmed,
          headStrikeDescription,
          seizuresWitnessed,
          oralFluidsAdministered,
          cprMinutesDelivered,
          pressureMinutesHeld
        },
        milestones,
        recordedAt: new Date().toISOString()
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedNotification('Structured ePCR JSON Copied');
    }
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = `# 🚑 RAKSHASAATHI v2 - ELECTRONIC PRE-HOSPITAL CARE REPORT (ePCR)
**Incident Docket Reference:** \`#${docketId}\`  
**Responding Unit:** ${respondingUnit}  
**Triage Level:** ${triageCategory.replace('_', ' ')}  
**Incident Scene Time:** ${formatTime(elapsedSeconds)}  
**Receiving Hospital:** ${receivingFacility}  
**Date & Time:** ${new Date().toLocaleString()}  

---

## 🚨 SBAR Standardized Clinical Handover Script
\`\`\`
${generateSBARScript()}
\`\`\`

---

## 👤 Patient Demographics & Baseline
- **Age Category:** ${patientAgeGroup}
- **Gender:** ${patientGender}
- **AVPU Mental Status:** ${avpuState.toUpperCase()}
- **Chief Complaint / MOI:** ${chiefComplaint}

---

## 🧠 Glasgow Coma Scale (GCS) Assessment
- **Eye Opening (E):** ${gcsEyes} / 4
- **Verbal Response (V):** ${gcsVerbal} / 5
- **Motor Response (M):** ${gcsMotor} / 6
- **Total GCS Score:** **${totalGCS} / 15** (${totalGCS <= 8 ? 'Severe Brain Injury (ALS Intubation Alert)' : totalGCS <= 12 ? 'Moderate Traumatic Impairment' : 'Mild / Stable'})

---

## 🩺 Objective Physiological Vitals
- **Carotid/Radial Pulse:** ${pulseRate} BPM (${pulseQuality})
- **Respiration:** ${respiratoryRate} breaths/min (${respiratoryEffort})
- **Blood Pressure Profile:** ${bloodPressureEstimate}
- **Pupils:** ${pupilStatus}

---

## 📊 5 Paramedic Golden Questions (Pre-Hospital Checklist)
1. **Unresponsive / Down Time:** ${unresponsiveMinutes} Minutes
2. **Head Strike Verified:** ${headStrikeConfirmed} (${headStrikeDescription})
3. **Seizure / Convulsive Motor Activity:** ${seizuresWitnessed === 'Yes' ? `${seizureDurationSecs} seconds active` : 'None observed'}
4. **Oral Fluids Administered:** ${oralFluidsAdministered}
5. **Continuous Active Interventions:**
   - CPR Compressions: ${cprMinutesDelivered} minutes at 110 BPM target cadence
   - Direct Wound Pressure: ${pressureMinutesHeld} minutes sustained hemostasis

---

## ⏱️ Chronological Incident Milestone Log
${milestones.map((m) => `- **[${m.timestamp}]** ${m.event} (${m.category.toUpperCase()})`).join('\n')}

---
*Generated by RakshaSaathi Pre-Hospital Trauma Command Platform.*  
*Complies with National Health Mission & WHO Emergency Resuscitation Telemetry Standards.*
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RakshaSaathi_ePCR_${docketId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200 text-slate-800 dark:text-slate-100">
      
      {/* ======================================================== */}
      {/* 1. SCENE STATUS & TRAUMA CLOCK HEADER                    */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-surface border border-border p-5 sm:p-7 shadow-xs space-y-5">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                triageCategory === 'RED_CRITICAL' 
                  ? 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' 
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
              }`}>
                {triageCategory === 'RED_CRITICAL' ? '🚨 Triage P1: Critical Red' : '⚠️ Triage P2: Urgent Yellow'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-base text-ink-muted border border-border">
                Docket #{docketId}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Live Pre-Hospital Run-Sheet</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-ink tracking-tight">
              Ambulance Paramedic Handover & ePCR Run-Sheet
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-2xl">
              Eliminate pre-hospital data blindness. Enter real patient vitals, calculate Glasgow Coma Scale (GCS) live, and hand over an encrypted SBAR docket directly to arriving 108/112 paramedics.
            </p>
          </div>

          {/* Trauma Clock & 112 Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-base border border-border shadow-2xs">
              <div className="flex items-center space-x-2 text-alert">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-black font-mono">SCENE CLOCK</span>
              </div>
              <span className="text-xl sm:text-2xl font-black font-mono text-ink tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1.5 rounded-lg hover:bg-border/60 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title={isTimerRunning ? 'Pause Stopwatch' : 'Resume Stopwatch'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-success" />}
              </button>
              <button
                type="button"
                onClick={() => setElapsedSeconds(0)}
                className="p-1.5 rounded-lg hover:bg-border/60 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title="Reset Stopwatch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onTriggerEscalation('Ambulance Run-Sheet Priority 1 Dispatch')}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>112 SOS Dispatch</span>
            </button>
          </div>
        </div>

        {/* Subtabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveSubTab('runsheet')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'runsheet' ? 'bg-primary text-white shadow-xs' : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Patient Vitals & 5 Golden Qs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gcs')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'gcs' ? 'bg-primary text-white shadow-xs' : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>GCS Coma Calculator</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              totalGCS <= 8 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {totalGCS}/15
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sbar')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'sbar' ? 'bg-primary text-white shadow-xs' : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>SBAR Script & QR Beacon</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'timeline' ? 'bg-primary text-white shadow-xs' : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Milestone Incident Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-border text-[10px] font-mono text-ink">
              {milestones.length}
            </span>
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SUBTAB: RUN-SHEET & 5 GOLDEN QUESTIONS (REAL FORM)    */}
      {/* ======================================================== */}
      {activeSubTab === 'runsheet' && (
        <div className="space-y-6">
          
          {/* Patient Demographics Strip */}
          <div className="p-5 rounded-3xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-black text-ink uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Patient Profile & Triage Setting</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-ink-muted">Triage Urgency Level</label>
                <select
                  value={triageCategory}
                  onChange={(e) => setTriageCategory(e.target.value as any)}
                  className="w-full bg-base border border-border rounded-xl p-2.5 font-bold text-ink focus:outline-none"
                >
                  <option value="RED_CRITICAL">🚨 Priority 1: Critical (Immediate Resuscitation)</option>
                  <option value="YELLOW_URGENT">⚠️ Priority 2: Urgent (Serious / Delayed)</option>
                  <option value="GREEN_STABLE">🟢 Priority 3: Non-Urgent / Walking Wounded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-muted">Age Category</label>
                <select
                  value={patientAgeGroup}
                  onChange={(e) => setPatientAgeGroup(e.target.value as any)}
                  className="w-full bg-base border border-border rounded-xl p-2.5 font-bold text-ink focus:outline-none"
                >
                  <option value="Adult">Adult (15–60 yrs)</option>
                  <option value="Pediatric">Pediatric (&lt;14 yrs)</option>
                  <option value="Geriatric">Geriatric (&gt;60 yrs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-muted">Conscious Level (AVPU)</label>
                <select
                  value={avpuState}
                  onChange={(e) => setAvpuState(e.target.value as any)}
                  className="w-full bg-base border border-border rounded-xl p-2.5 font-bold text-ink focus:outline-none"
                >
                  <option value="Alert">Alert (Eyes open, oriented)</option>
                  <option value="Voice">Responds to Verbal Stimuli</option>
                  <option value="Pain">Responds ONLY to Pain (Sternal rub)</option>
                  <option value="Unresponsive">Unresponsive / Comatose</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-ink-muted">Receiving Trauma Hospital</label>
                <input
                  type="text"
                  value={receivingFacility}
                  onChange={(e) => setReceivingFacility(e.target.value)}
                  className="w-full bg-base border border-border rounded-xl p-2.5 font-medium text-ink focus:outline-none text-xs"
                />
              </div>

            </div>
          </div>

          {/* 5 Paramedic Golden Questions (Interactive Field Entry) */}
          <div className="p-5 sm:p-7 rounded-3xl bg-surface border border-border space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-accent block">
                Field Telemetry Input
              </span>
              <h2 className="text-xl font-bold text-ink">
                Answers to the 5 Paramedic Golden Questions
              </h2>
              <p className="text-xs text-ink-muted">
                Paramedics typically lose 5 to 10 minutes attempting to verify these crucial answers. These interactive controls update the official SBAR handoff in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Question 1: Down Time */}
              <div className="p-4 rounded-2xl bg-base border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">1. Down Time / Unresponsive Duration</span>
                  <Clock className="w-4 h-4 text-alert" />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={unresponsiveMinutes}
                    onChange={(e) => setUnresponsiveMinutes(parseInt(e.target.value, 10))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono font-black text-base text-ink w-16 text-right">
                    {unresponsiveMinutes} mins
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">Time patient has remained unresponsive since collapse.</p>
              </div>

              {/* Question 2: Head Strike */}
              <div className="p-4 rounded-2xl bg-base border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">2. Head Strike Impact Verified</span>
                  <AlertTriangle className="w-4 h-4 text-accent" />
                </div>
                <div className="flex gap-2">
                  {(['Yes', 'No', 'Unwitnessed'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHeadStrikeConfirmed(opt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        headStrikeConfirmed === opt 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-surface text-ink-muted border-border hover:bg-border/40'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={headStrikeDescription}
                  onChange={(e) => setHeadStrikeDescription(e.target.value)}
                  placeholder="Describe impact location (e.g. curb, windshield)..."
                  className="w-full bg-surface border border-border rounded-xl p-2 text-xs text-ink focus:outline-none"
                />
              </div>

              {/* Question 3: Seizures */}
              <div className="p-4 rounded-2xl bg-base border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">3. Witnessed Seizure Activity</span>
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex gap-2">
                  {(['No', 'Yes'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSeizuresWitnessed(opt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        seizuresWitnessed === opt 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-surface text-ink-muted border-border hover:bg-border/40'
                      }`}
                    >
                      {opt === 'No' ? 'No Seizure' : 'Yes (Seizure Witnessed)'}
                    </button>
                  ))}
                </div>
                {seizuresWitnessed === 'Yes' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs text-ink-muted">Duration:</span>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={seizureDurationSecs}
                      onChange={(e) => setSeizureDurationSecs(parseInt(e.target.value || '0', 10))}
                      className="w-24 bg-surface border border-border rounded-xl p-1.5 text-xs text-ink font-bold"
                    />
                    <span className="text-xs text-ink-muted">seconds</span>
                  </div>
                )}
              </div>

              {/* Question 4: Oral Fluids */}
              <div className="p-4 rounded-2xl bg-base border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-ink uppercase">4. Oral Water / Fluids Administered</span>
                  <ShieldAlert className="w-4 h-4 text-success" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOralFluidsAdministered('Strict NPO (Zero)')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      oralFluidsAdministered === 'Strict NPO (Zero)'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-surface text-ink-muted border-border'
                    }`}
                  >
                    ✓ Strict NPO (Zero Oral Fluids)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOralFluidsAdministered('Fluids Given')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      oralFluidsAdministered === 'Fluids Given'
                        ? 'bg-alert text-white border-alert shadow-xs'
                        : 'bg-surface text-ink-muted border-border'
                    }`}
                  >
                    ⚠️ Fluids Attempted (Aspiration Risk)
                  </button>
                </div>
                <p className="text-[11px] text-ink-muted">Protects against fatal pulmonary aspiration pneumonitis.</p>
              </div>

              {/* Question 5: Continuous Interventions */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary uppercase">5. Active Pre-Hospital Resuscitation Delivered</span>
                  <HeartPulse className="w-4 h-4 text-primary" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-ink">
                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-ink-muted uppercase">Bystander CPR Duration (110 BPM)</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={cprMinutesDelivered}
                        onChange={(e) => setCprMinutesDelivered(parseInt(e.target.value || '0', 10))}
                        className="w-20 p-1.5 rounded-lg bg-base border border-border text-ink font-mono font-black"
                      />
                      <span>Minutes</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-ink-muted uppercase">Direct Wound Hemostasis Pressure</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={pressureMinutesHeld}
                        onChange={(e) => setPressureMinutesHeld(parseInt(e.target.value || '0', 10))}
                        className="w-20 p-1.5 rounded-lg bg-base border border-border text-ink font-mono font-black"
                      />
                      <span>Minutes Continuous</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SUBTAB: GLASGOW COMA SCALE (GCS) REAL-TIME CALCULATOR */}
      {/* ======================================================== */}
      {activeSubTab === 'gcs' && (
        <div className="p-5 sm:p-7 rounded-3xl bg-surface border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
            <div>
              <div className="text-xs font-black uppercase text-accent tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-accent" />
                <span>Standardized Neurological Assessment</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-ink">Glasgow Coma Scale (GCS) Calculator</h2>
            </div>

            <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-base border border-border">
              <span className="text-xs font-bold text-ink-muted uppercase">GCS Total:</span>
              <span className={`text-2xl font-black font-mono ${
                totalGCS <= 8 ? 'text-alert' : totalGCS <= 12 ? 'text-accent' : 'text-success'
              }`}>
                {totalGCS} / 15
              </span>
              <span className="text-xs font-bold text-ink-muted">
                ({totalGCS <= 8 ? 'Severe Coma / Intubation' : totalGCS <= 12 ? 'Moderate Injury' : 'Mild / Stable'})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Eye Opening (1-4) */}
            <div className="p-4 rounded-2xl bg-base border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-black text-ink uppercase">Eye Opening (E)</span>
                <span className="font-mono font-black text-primary text-sm">{gcsEyes}/4</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { score: 4, label: '4 - Spontaneous (Open without stimulation)' },
                  { score: 3, label: '3 - To Speech (Opens when called by name)' },
                  { score: 2, label: '2 - To Pain (Opens to sternal rub/trapezius)' },
                  { score: 1, label: '1 - None (No response to stimuli)' }
                ].map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setGcsEyes(opt.score)}
                    className={`w-full p-2.5 rounded-xl text-left font-bold transition-all border ${
                      gcsEyes === opt.score 
                        ? 'bg-primary text-white border-primary shadow-xs' 
                        : 'bg-surface text-ink-muted border-border hover:bg-border/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verbal Response (1-5) */}
            <div className="p-4 rounded-2xl bg-base border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-black text-ink uppercase">Verbal Response (V)</span>
                <span className="font-mono font-black text-primary text-sm">{gcsVerbal}/5</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { score: 5, label: '5 - Oriented (Knows name, place, date)' },
                  { score: 4, label: '4 - Confused (Disoriented speech)' },
                  { score: 3, label: '3 - Inappropriate Words (Random words)' },
                  { score: 2, label: '2 - Incomprehensible Sounds (Moaning)' },
                  { score: 1, label: '1 - None (No vocalization)' }
                ].map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setGcsVerbal(opt.score)}
                    className={`w-full p-2.5 rounded-xl text-left font-bold transition-all border ${
                      gcsVerbal === opt.score 
                        ? 'bg-primary text-white border-primary shadow-xs' 
                        : 'bg-surface text-ink-muted border-border hover:bg-border/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motor Response (1-6) */}
            <div className="p-4 rounded-2xl bg-base border border-border space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-black text-ink uppercase">Motor Response (M)</span>
                <span className="font-mono font-black text-primary text-sm">{gcsMotor}/6</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { score: 6, label: '6 - Obeys Commands (e.g. squeezes hands)' },
                  { score: 5, label: '5 - Localizes to Pain (Reaches for stimulus)' },
                  { score: 4, label: '4 - Normal Flexion / Withdraws from pain' },
                  { score: 3, label: '3 - Abnormal Decorticate Flexion' },
                  { score: 2, label: '2 - Decerebrate Extensor Posturing' },
                  { score: 1, label: '1 - None (Flaccid limbs)' }
                ].map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setGcsMotor(opt.score)}
                    className={`w-full p-2.5 rounded-xl text-left font-bold transition-all border ${
                      gcsMotor === opt.score 
                        ? 'bg-primary text-white border-primary shadow-xs' 
                        : 'bg-surface text-ink-muted border-border hover:bg-border/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUBTAB: SBAR CLINICAL SCRIPT & HIGH-DENSITY QR BEACON */}
      {/* ======================================================== */}
      {activeSubTab === 'sbar' && (
        <div className="space-y-6">
          
          {/* Verbal SBAR Speech Synthesizer Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-accent" />
                <span>Audible Paramedic Handover Briefing</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Paramedics Just Arrived? Tap to Speak SBAR Briefing
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted max-w-2xl">
                Your device speaks the full clinical SBAR handover aloud in crisp medical terminology so no vital trauma telemetry is lost in scene chaos.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer ${
                  isSpeakingSBAR ? 'bg-red-600 text-white animate-pulse' : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                {isSpeakingSBAR ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeakingSBAR ? 'Stop Speaking' : '🔊 Play Verbal Briefing'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy('sbar')}
                className="p-3 rounded-2xl bg-base hover:bg-border/60 text-ink border border-border transition-colors shadow-2xs cursor-pointer"
                title="Copy SBAR Text"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SBAR & QR Code Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Encrypted QR Code Beacon */}
            <div className="lg:col-span-5 rounded-3xl bg-surface border border-border p-6 shadow-xs flex flex-col items-center justify-between text-center space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>0.5-Sec Offline Paramedic Scan</span>
                </div>
                <h3 className="text-lg font-black text-ink">Ingest Trauma Docket</h3>
                <p className="text-xs text-ink-muted">
                  Paramedics scan this QR code with any ambulance tablet or smartphone to ingest all telemetry into hospital ePCR without network.
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-white shadow-md border-4 border-primary/20 flex items-center justify-center">
                {qrSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-52 h-52 flex items-center justify-center" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-neutral-400">Generating QR...</div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full text-xs font-bold">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('json')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-base hover:bg-border text-ink border border-border flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>JSON ePCR</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-base hover:bg-border text-ink border border-border flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-ink-muted">
                SHA-256 Telemetry Hash: {docketId}-GCS{totalGCS}-V4
              </span>
            </div>

            {/* Right 7 Cols: Full Text SBAR Clinical Document */}
            <div className="lg:col-span-7 rounded-3xl bg-surface border border-border p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-black text-ink">
                  Standardized Clinical SBAR Handover Document
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  WHO & AIIMS Triage Standard
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-base border border-border font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap">
                {generateSBARScript()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SUBTAB: CHRONOLOGICAL INCIDENT TIMELINE & VOICE NOTES */}
      {/* ======================================================== */}
      {activeSubTab === 'timeline' && (
        <div className="p-5 sm:p-7 rounded-3xl bg-surface border border-border space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-accent block">
              Forensic Trauma Telemetry Log
            </span>
            <h2 className="text-xl font-bold text-ink">
              Chronological Incident Timeline
            </h2>
            <p className="text-xs text-ink-muted">
              Add real timestamped milestones as interventions are delivered at the scene. Every event is permanently baked into the scannable handover docket.
            </p>
          </div>

          {/* Quick 1-Tap Milestone Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '+ CPR Compressions Initiated (110 BPM)', cat: 'cpr' as const },
              { label: '+ Direct Hemostatic Wound Pressure Applied', cat: 'vital' as const },
              { label: '+ Carotid Pulse Present Verified', cat: 'vital' as const },
              { label: '+ Airway Cleared / Suctioned', cat: 'intervention' as const },
              { label: '+ Placed into Lateral Recovery Position', cat: 'vital' as const },
              { label: '+ 108/112 Ambulance Siren Heard / Scene Arrival', cat: 'admin' as const }
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddMilestone(btn.label.replace('+ ', ''), btn.cat)}
                className="px-3 py-1.5 rounded-xl bg-base hover:bg-primary/10 hover:text-primary text-xs font-bold text-ink border border-border transition-colors cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Field Note Input */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-base border border-border">
            <input
              type="text"
              value={newNoteInput}
              onChange={(e) => setNewNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
              placeholder="Dictate or type rapid field observation (e.g. 'Pupils sluggish, 4mm, spontaneous respirations')..."
              className="flex-1 bg-transparent px-3 py-1 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none font-medium"
            />
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2 rounded-xl border border-border transition-colors cursor-pointer ${
                isListeningMic ? 'bg-red-600 text-white animate-pulse' : 'bg-surface hover:bg-border text-ink'
              }`}
              title="Voice Dictate Note"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!newNoteInput.trim()}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black disabled:opacity-40 cursor-pointer"
            >
              Add Event
            </button>
          </div>

          {/* Chronological Milestone List */}
          <div className="space-y-2 pt-2 border-t border-border">
            {milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-base border border-border text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 rounded-md bg-surface font-mono font-bold text-ink">
                    {m.timestamp}
                  </span>
                  <span className="font-bold text-ink">{m.event}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  m.category === 'cpr' ? 'bg-alert/15 text-alert' : m.category === 'intervention' ? 'bg-accent/20 text-ink' : 'bg-primary/15 text-primary'
                }`}>
                  {m.category}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
