import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  FileText, 
  QrCode, 
  Radio, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Printer, 
  Share2, 
  Download, 
  Activity, 
  HeartPulse, 
  ShieldAlert, 
  ShieldCheck, 
  Mic, 
  Plus, 
  RotateCcw,
  Check,
  Tablet,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { VideoForensicAnalyzer } from '../video/VideoForensicAnalyzer';
import { VideoIncidentAnalysis } from '../../services/videoAnalysisService';
import { generateQRCodeSVG } from '../../utils/qr';
import { audioEngine } from '../../utils/audio';

export interface TelemetryTimelineItem {
  time: string;
  event: string;
  detail?: string;
  type?: 'cpr' | 'sensor' | 'gasp' | 'photo' | 'vital' | 'admin' | 'video';
}

interface ParamedicHandoffViewProps {
  onTriggerEscalation: (reason?: string) => void;
  onSelectDestination?: (dest: any) => void;
}

export const ParamedicHandoffView: React.FC<ParamedicHandoffViewProps> = ({
  onTriggerEscalation
}) => {
  // Navigation subtabs inside Handoff
  const [activeSubTab, setActiveSubTab] = useState<'docket' | 'video' | 'logger'>('docket');

  // Trauma Stopwatch (Incident Clock)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(145);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Docket Identification
  const [docketId] = useState<string>(() => `TRAUMA-${Math.floor(100000 + Math.random() * 900000)}`);
  const [incidentTitle, setIncidentTitle] = useState<string>('Acute Trauma & Witnessed Incident Handover');
  const [incidentSeverity, setIncidentSeverity] = useState<'P1_CRITICAL' | 'P2_URGENT'>('P1_CRITICAL');

  // Pre-Hospital Clinical Telemetry State
  const [unresponsiveSecs, setUnresponsiveSecs] = useState<number>(240);
  const [headStrike, setHeadStrike] = useState<'yes' | 'no' | 'unwitnessed'>('yes');
  const [headStrikeDetails, setHeadStrikeDetails] = useState<string>('Left temporal blunt impact against curb');
  const [seizureSecs, setSeizureSecs] = useState<number>(0);
  const [oralFluids, setOralFluids] = useState<'no' | 'yes'>('no');
  const [cprMinutes, setCprMinutes] = useState<number>(3);
  const [pressureMinutes, setPressureMinutes] = useState<number>(5);

  // Forensic Video Analysis Cache
  const [latestVideoAnalysis, setLatestVideoAnalysis] = useState<VideoIncidentAnalysis | null>(null);
  const [videoFramesCount, setVideoFramesCount] = useState<number>(0);

  // SBAR Script & Audio State
  const [isSpeakingSBAR, setIsSpeakingSBAR] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedJSON, setCopiedJSON] = useState<boolean>(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [tabletAccepted, setTabletAccepted] = useState<boolean>(false);

  // Chronological Timeline
  const [timeline, setTimeline] = useState<TelemetryTimelineItem[]>([
    { time: '00:00', event: 'Incident Occurred / First Responders Alerted', detail: 'Scene witnessed by bystander', type: 'admin' },
    { time: '00:45', event: 'Primary Assessment: Loss of consciousness', detail: 'Unresponsive to verbal and tactile stimuli', type: 'vital' },
    { time: '01:10', event: 'Direct wound pressure applied to left temporal laceration', detail: 'Clean dressing with sustained pressure', type: 'vital' },
    { time: '02:00', event: 'Bystander CPR initiated', detail: 'Cadence locked at 110 BPM target', type: 'cpr' }
  ]);

  // Voice Note State
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isListeningNote, setIsListeningNote] = useState<boolean>(false);

  // Stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Generate QR code SVG whenever telemetry changes
  useEffect(() => {
    const payload = {
      docketId,
      severity: incidentSeverity,
      elapsedTime: formatTime(elapsedSeconds),
      unresponsiveSeconds: unresponsiveSecs,
      headStrike,
      headStrikeDetails,
      seizureSeconds: seizureSecs,
      oralFluidsGiven: oralFluids,
      cprDurationMinutes: cprMinutes,
      directPressureMinutes: pressureMinutes,
      mechanismOfInjury: latestVideoAnalysis?.mechanismOfInjury || 'Deceleration fall / collision',
      videoEvents: latestVideoAnalysis?.chronology || [],
      timeline: timeline.slice(-6),
      generatedAt: new Date().toISOString()
    };

    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const origin = (typeof window !== 'undefined' && host !== 'localhost' && host !== '127.0.0.1')
      ? window.location.origin
      : 'https://sanjeevani-v2.web.app';
    const docketUrl = `${origin}/?docket=${docketId}&sev=${incidentSeverity}&cpr=${cprMinutes * 60}&head=${headStrike}&water=${oralFluids}&unresp=${unresponsiveSecs}`;
    const svg = generateQRCodeSVG(docketUrl, 240, '#0E5A50', '#FFFFFF');
    setQrSvg(svg);
  }, [docketId, incidentSeverity, elapsedSeconds, unresponsiveSecs, headStrike, seizureSecs, oralFluids, cprMinutes, pressureMinutes, latestVideoAnalysis, timeline]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate SBAR Clinical Script
  const generateSBARScript = () => {
    const s = `SITUATION: Paramedic Handover for Incident ${docketId}. Triage Priority is ${incidentSeverity === 'P1_CRITICAL' ? 'P1 Critical' : 'P2 Urgent'}. Trauma clock active for ${formatTime(elapsedSeconds)}.`;
    const b = `BACKGROUND: ${latestVideoAnalysis?.whatHappenedSummary || 'Patient witnessed in acute collapse with blunt head trauma'}. Down time / unresponsiveness estimated at ${Math.round(unresponsiveSecs / 60)} minutes. Head strike is ${headStrike === 'yes' ? 'CONFIRMED: ' + headStrikeDetails : 'not observed'}. Oral fluids: ${oralFluids === 'no' ? 'Strictly ZERO (aspiration risk avoided)' : 'Fluids attempted'}.`;
    const a = `ASSESSMENT: Bystander CPR administered for ${cprMinutes} minutes at 110 BPM. Direct hemostatic pressure held for ${pressureMinutes} minutes. ${latestVideoAnalysis ? 'Video chronology verified ' + latestVideoAnalysis.chronology.length + ' keyframe trauma events.' : ''}`;
    const r = `RECOMMENDATION: Immediate cervical spine immobilization, formal GCS score baseline, oxygenation support, and trauma CT scan transfer.`;
    return `${s}\n\n${b}\n\n${a}\n\n${r}`;
  };

  // Speak SBAR Briefing
  const handleToggleSpeakSBAR = () => {
    if (isSpeakingSBAR) {
      audioEngine.stopSpeech();
      setIsSpeakingSBAR(false);
    } else {
      setIsSpeakingSBAR(true);
      const textToSpeak = generateSBARScript().replace(/\*\*/g, '').replace(/(\r\n|\n|\r)/gm, ' ');
      audioEngine.speak(textToSpeak, () => {
        setIsSpeakingSBAR(false);
      });
    }
  };

  // Handle Video Analysis Ingestion into Docket
  const handleIngestVideoAnalysis = (analysis: VideoIncidentAnalysis, frames: string[]) => {
    setLatestVideoAnalysis(analysis);
    setVideoFramesCount(frames.length);

    // Apply pre-hospital answers from Gemini video understanding
    if (analysis.preHospitalAnswers) {
      if (analysis.preHospitalAnswers.unresponsiveObserved) {
        setUnresponsiveSecs(analysis.preHospitalAnswers.unresponsiveDurationSecs || 180);
      }
      setHeadStrike(analysis.preHospitalAnswers.headStrikeDetected || 'yes');
      if (analysis.preHospitalAnswers.headStrikeDetails) {
        setHeadStrikeDetails(analysis.preHospitalAnswers.headStrikeDetails);
      }
      if (analysis.preHospitalAnswers.seizuresObserved) {
        setSeizureSecs(analysis.preHospitalAnswers.seizureDurationSecs || 60);
      }
      setOralFluids(analysis.preHospitalAnswers.oralFluidsObserved || 'no');
    }

    if (analysis.urgencyLevel === 'CRITICAL_112') {
      setIncidentSeverity('P1_CRITICAL');
    }

    // Add video events to timeline
    const newItems: TelemetryTimelineItem[] = analysis.chronology.map((ev) => ({
      time: ev.timestamp,
      event: ev.event,
      detail: 'AI Keyframe Multimodal Verification',
      type: 'video'
    }));

    setTimeline((prev) => [...prev, ...newItems]);
    setActiveSubTab('docket'); // Switch user to the completed Docket view!
  };

  // Add quick milestone to timeline
  const handleAddMilestone = (event: string, type: TelemetryTimelineItem['type'] = 'vital') => {
    const nowTime = formatTime(elapsedSeconds);
    setTimeline((prev) => [
      ...prev,
      { time: nowTime, event, detail: 'Recorded on scene by responder', type }
    ]);
  };

  // Voice Note Dictation
  const handleStartVoiceNote = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListeningNote(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setNewNoteText((prev) => (prev ? `${prev} ${text}` : text));
        setIsListeningNote(false);
      };
      recognition.onerror = () => setIsListeningNote(false);
      recognition.onend = () => setIsListeningNote(false);
      recognition.start();
    } catch {
      setIsListeningNote(false);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim()) return;
    handleAddMilestone(`Field Observation: ${newNoteText.trim()}`, 'admin');
    setNewNoteText('');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateSBARScript());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyJSON = () => {
    const payload = {
      docketId,
      elapsedTime: formatTime(elapsedSeconds),
      unresponsiveSeconds: unresponsiveSecs,
      headStrike,
      headStrikeDetails,
      seizureSeconds: seizureSecs,
      oralFluidsGiven: oralFluids,
      cprDurationMinutes: cprMinutes,
      directPressureMinutes: pressureMinutes,
      mechanismOfInjury: latestVideoAnalysis?.mechanismOfInjury || 'Blunt deceleration trauma',
      videoEvents: latestVideoAnalysis?.chronology || [],
      timeline,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = `# 📋 SANJEEVANI v2 - PARAMEDIC TRAUMA HANDOVER DOCKET
**Docket ID:** \`#${docketId}\`  
**Triage Severity:** ${incidentSeverity}  
**Trauma Stopwatch Active:** ${formatTime(elapsedSeconds)}  
**Mechanism of Injury:** ${latestVideoAnalysis?.mechanismOfInjury || 'Acute trauma / witnessed collapse'}  
**Generated At:** ${new Date().toLocaleString()}  

---

## 🚨 SBAR Clinical Handover Script
\`\`\`
${generateSBARScript()}
\`\`\`

---

## 📊 5 Paramedic Golden Questions (Pre-Hospital Checklist)
1. **Unresponsive Duration:** ${Math.round(unresponsiveSecs / 60)} minutes (${unresponsiveSecs}s)
2. **Head Struck Ground/Curb:** ${headStrike.toUpperCase()} (${headStrikeDetails})
3. **Oral Water/Fluids Administered:** ${oralFluids.toUpperCase()} (${oralFluids === 'no' ? 'Strictly ZERO - Aspiration risk prevented' : 'Oral fluids attempted'})
4. **Witnessed Seizures:** ${seizureSecs > 0 ? `${seizureSecs} seconds active` : 'None observed'}
5. **Continuous Direct Pressure:** ${pressureMinutes} minutes held continuous

---

## 🩺 Active Interventions & Timeline
- **CPR Duration:** ${cprMinutes} minutes at 110 BPM target cadence
- **Direct Wound Pressure:** ${pressureMinutes} minutes
- **Chronological Milestones:**
${timeline.map(t => `  - [${t.time}] ${t.event} (${t.detail || ''})`).join('\n')}

---
*Sanjeevani v2 Pre-Hospital Black-Box Trauma Intelligence.*
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanjeevani_${docketId}_Docket.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* 1. SCENE STATUS & TRAUMA CLOCK HEADER                    */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-surface border border-border p-5 sm:p-7 shadow-xs space-y-5">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
          
          {/* Title & Docket Badge */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-alert/15 text-alert border border-alert/30">
                Black-Box Trauma Docket
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-base text-ink-muted border border-border">
                {docketId}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Encrypted Offline NFC / QR</span>
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink tracking-tight font-display-italic">
              Paramedic Handoff & Incident Forensics
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-2xl">
              Eliminate pre-hospital data blindness. AI captures incident video, tracks CPR and bleeding telemetry in real time, and synthesizes an encrypted SBAR handover for arriving paramedics.
            </p>
          </div>

          {/* Trauma Clock & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live Stopwatch Pill */}
            <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-base border border-border shadow-2xs">
              <div className="flex items-center space-x-2 text-alert">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold font-mono">TRAUMA CLOCK</span>
              </div>
              <span className="text-xl sm:text-2xl font-black font-mono text-ink tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1.5 rounded-lg hover:bg-border/60 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title={isTimerRunning ? 'Pause Stopwatch' : 'Resume Stopwatch'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-success" />}
              </button>
            </div>

            {/* 112 SOS Button */}
            <button
              onClick={() => onTriggerEscalation('Paramedic Handoff hard-stop trigger')}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl btn-tactile-danger text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>112 SOS</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          <button
            onClick={() => setActiveSubTab('docket')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all btn-press cursor-pointer ${
              activeSubTab === 'docket'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paramedic Docket & QR Beacon</span>
          </button>

          <button
            onClick={() => setActiveSubTab('video')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all btn-press cursor-pointer ${
              activeSubTab === 'video'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <Video className="w-4 h-4 text-accent" />
            <span>AI Video Incident Analysis</span>
            {latestVideoAnalysis && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('logger')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all btn-press cursor-pointer ${
              activeSubTab === 'logger'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-base text-ink-muted hover:text-ink hover:bg-border/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Live Scene Event Logger</span>
            <span className="px-1.5 py-0.2 rounded-full bg-border text-[10px] font-mono text-ink">
              {timeline.length}
            </span>
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUBTAB: AI VIDEO INCIDENT ANALYSIS                    */}
      {/* ======================================================== */}
      {activeSubTab === 'video' && (
        <div className="rounded-3xl bg-surface border border-border p-4 sm:p-7 shadow-xs space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI Video Scene Reconstruction</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              Accident & Injury Scene Video Reconstruction
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Upload CCTV, dashcam, or phone video clips of the accident. Clinical AI extracts sequential keyframes, identifies exact down-time, head-strikes, and motor convulsions, and syncs findings to the paramedic docket.
            </p>
          </div>

          <VideoForensicAnalyzer
            onInjectIntoDocket={handleIngestVideoAnalysis}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SUBTAB: BLACK-BOX DOCKET & QR BEACON (MAIN HANDOFF)   */}
      {/* ======================================================== */}
      {activeSubTab === 'docket' && (
        <div className="space-y-8">
          
          {/* Verbal SBAR Audio Handover Synthesizer Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary/15 via-accent/15 to-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-accent" />
                <span>Audible Paramedic Handover Briefing</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Paramedics Just Arrived? Tap to Speak SBAR Briefing
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted">
                Your phone will speak the full clinical SBAR handover in clear, professional medical terms so you don’t forget critical trauma details under stress.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={handleToggleSpeakSBAR}
                className={`flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all btn-press cursor-pointer ${
                  isSpeakingSBAR
                    ? 'bg-alert text-white animate-pulse'
                    : 'btn-tactile-primary text-white'
                }`}
              >
                {isSpeakingSBAR ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent" />}
                <span>{isSpeakingSBAR ? 'Stop Speaking' : '🔊 Play Verbal Briefing'}</span>
              </button>

              <button
                onClick={handleCopyScript}
                className="p-3 rounded-2xl bg-base hover:bg-border/60 text-ink border border-border transition-colors btn-press shadow-2xs cursor-pointer"
                title="Copy SBAR text to clipboard"
              >
                {copiedScript ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Core Handover Grid: QR Scanner on Left, Critical Vitals on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: High-Density Offline QR Beacon */}
            <div className="lg:col-span-5 rounded-3xl bg-surface border border-border p-6 shadow-xs flex flex-col items-center justify-between text-center space-y-6">
              
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>0.5-Sec Offline Paramedic Scan</span>
                </div>
                <h3 className="text-lg font-bold text-ink">
                  Scan to Ingest Trauma Docket
                </h3>
                <p className="text-xs text-ink-muted">
                  Paramedics scan this QR code with any tablet or phone to receive all incident telemetry without needing internet or login.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 rounded-3xl bg-white shadow-md border-4 border-primary/20 flex items-center justify-center">
                {qrSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="w-56 h-56 flex items-center justify-center"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-neutral-400">
                    Generating High-Density QR...
                  </div>
                )}
              </div>

              {/* Quick Actions under QR */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors btn-press shadow-2xs cursor-pointer"
                  title="Download Handover Docket formatted as Markdown (.md)"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Download .md</span>
                </button>

                <button
                  onClick={handleCopyJSON}
                  className="flex-1 min-w-[110px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-semibold border border-border transition-colors btn-press shadow-2xs cursor-pointer"
                >
                  {copiedJSON ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJSON ? 'Copied' : 'JSON'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex-1 min-w-[100px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-semibold border border-border transition-colors btn-press shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-ink-muted">
                SHA-256 Telemetry Hash: {docketId}-V3
              </div>
            </div>

            {/* Right Column: Pre-Hospital Vital Answers Grid (What Paramedics Need First) */}
            <div className="lg:col-span-7 rounded-3xl bg-surface border border-border p-6 shadow-xs space-y-6 flex flex-col justify-between">
              
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-accent block">
                  Vital Clinical Triage Q&A
                </span>
                <h3 className="text-xl font-bold text-ink">
                  Answers to the 5 Paramedic Golden Questions
                </h3>
                <p className="text-xs text-ink-muted">
                  Paramedics lose 5 to 10 minutes trying to verify these questions at the chaotic scene. Sanjeevani records them deterministically.
                </p>
              </div>

              {/* 5 Clinical Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Down Time */}
                <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-muted uppercase">1. Down Time / Unresponsive</span>
                    <Clock className="w-3.5 h-3.5 text-alert" />
                  </div>
                  <div className="text-lg font-black text-ink">
                    {Math.floor(unresponsiveSecs / 60)} min {unresponsiveSecs % 60} sec
                  </div>
                  <p className="text-[11px] text-ink-muted leading-tight">
                    Continuous lack of motor or eye response since collapse.
                  </p>
                </div>

                {/* 2. Head Strike */}
                <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-muted uppercase">2. Head Strike Impact</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="text-lg font-black text-ink capitalize">
                    {headStrike === 'yes' ? 'CONFIRMED STRIKE' : 'No Strike Noted'}
                  </div>
                  <p className="text-[11px] text-ink-muted leading-tight">
                    {headStrikeDetails}
                  </p>
                </div>

                {/* 3. Seizure Activity */}
                <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-muted uppercase">3. Seizure Duration</span>
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-lg font-black text-ink">
                    {seizureSecs > 0 ? `${Math.floor(seizureSecs / 60)}m ${seizureSecs % 60}s` : 'Zero Observed'}
                  </div>
                  <p className="text-[11px] text-ink-muted leading-tight">
                    {seizureSecs > 0 ? 'Tonic-clonic convulsion tracked' : 'No convulsive posturing recorded'}
                  </p>
                </div>

                {/* 4. Oral Fluids */}
                <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-muted uppercase">4. Oral Fluids Administered</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="text-lg font-black text-success capitalize">
                    {oralFluids === 'no' ? 'NO (Strict NPO Kept)' : 'Yes Given'}
                  </div>
                  <p className="text-[11px] text-ink-muted leading-tight">
                    Strict aspiration precaution observed by responders.
                  </p>
                </div>

                {/* 5. CPR & Hemostasis */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase">5. Active Interventions Delivered</span>
                    <HeartPulse className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-ink">
                    <span>🫀 CPR Duration: {cprMinutes} Minutes (110 BPM)</span>
                    <span>•</span>
                    <span>🩸 Wound Pressure: {pressureMinutes} Minutes</span>
                  </div>
                </div>

              </div>

              {/* Paramedic Tablet Preview Trigger */}
              <div className="pt-2 border-t border-border/80 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-ink-muted">
                  <Tablet className="w-4 h-4 text-primary" />
                  <span>Incoming Paramedic Tablet Preview:</span>
                </div>
                <button
                  onClick={() => setTabletAccepted(!tabletAccepted)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tabletAccepted
                      ? 'bg-success/20 text-success border border-success/40'
                      : 'bg-base hover:bg-border/60 text-ink border border-border'
                  }`}
                >
                  {tabletAccepted ? '✓ Handoff Accepted by EMS' : 'Simulate Paramedic Sync'}
                </button>
              </div>

            </div>
          </div>

          {/* SBAR Full Text View Card */}
          <div className="rounded-3xl bg-surface border border-border p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Standardized Clinical SBAR Handover Document
                </h3>
                <p className="text-xs text-ink-muted">
                  Conforms to WHO & AIIMS Department of Emergency Medicine Handover Guidelines
                </p>
              </div>
              <button
                onClick={handleCopyScript}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-base hover:bg-border/60 text-xs font-semibold text-ink border border-border transition-colors btn-press cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-base/60 border border-border/60 font-mono text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {generateSBARScript()}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUBTAB: LIVE SCENE EVENT LOGGER                       */}
      {/* ======================================================== */}
      {activeSubTab === 'logger' && (
        <div className="rounded-3xl bg-surface border border-border p-6 shadow-xs space-y-6">
          
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-accent block">
              Forensic Trauma Telemetry Log
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              Chronological Incident Timeline
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Tap any quick button to append instant timestamped milestones, or dictate rapid voice notes. All milestones are embedded in the paramedic QR code.
            </p>
          </div>

          {/* Quick 1-Tap Milestone Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleAddMilestone('High-efficiency chest compressions started (110 BPM)', 'cpr')}
              className="px-3.5 py-2 rounded-xl bg-base hover:bg-primary/15 hover:text-primary text-xs font-bold text-ink border border-border transition-colors btn-press cursor-pointer"
            >
              + CPR Started
            </button>
            <button
              onClick={() => handleAddMilestone('Direct hemostatic pressure applied to wound site', 'vital')}
              className="px-3.5 py-2 rounded-xl bg-base hover:bg-primary/15 hover:text-primary text-xs font-bold text-ink border border-border transition-colors btn-press cursor-pointer"
            >
              + Direct Pressure Applied
            </button>
            <button
              onClick={() => handleAddMilestone('Pulse verified present at carotid artery', 'vital')}
              className="px-3.5 py-2 rounded-xl bg-base hover:bg-primary/15 hover:text-primary text-xs font-bold text-ink border border-border transition-colors btn-press cursor-pointer"
            >
              + Carotid Pulse Present
            </button>
            <button
              onClick={() => handleAddMilestone('Patient placed into Recovery Position on left side', 'vital')}
              className="px-3.5 py-2 rounded-xl bg-base hover:bg-primary/15 hover:text-primary text-xs font-bold text-ink border border-border transition-colors btn-press cursor-pointer"
            >
              + Recovery Position
            </button>
            <button
              onClick={() => handleAddMilestone('Convulsive motor jerking ceased', 'vital')}
              className="px-3.5 py-2 rounded-xl bg-base hover:bg-primary/15 hover:text-primary text-xs font-bold text-ink border border-border transition-colors btn-press cursor-pointer"
            >
              + Seizure Stopped
            </button>
            <button
              onClick={() => handleAddMilestone('Ambulance siren heard / EMS arrived at scene', 'admin')}
              className="px-3.5 py-2 rounded-xl bg-alert/15 text-alert border border-alert/30 text-xs font-bold transition-colors btn-press cursor-pointer"
            >
              + EMS Arrived Scene
            </button>
          </div>

          {/* Voice Field Note Dictation Bar */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-base border border-border">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
              placeholder="Dictate or type rapid field note (e.g. 'Victim vomited clear fluid, airway cleared')..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
            
            <button
              onClick={handleStartVoiceNote}
              className={`p-2 rounded-xl border border-border transition-colors cursor-pointer ${
                isListeningNote
                  ? 'bg-alert text-white animate-pulse'
                  : 'bg-surface hover:bg-border/60 text-ink'
              }`}
              title="Voice dictate field note"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveNote}
              disabled={!newNoteText.trim()}
              className="px-4 py-2 rounded-xl btn-tactile-primary text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              Add Note
            </button>
          </div>

          {/* Timeline List */}
          <div className="space-y-3 pt-3 border-t border-border/80">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-3.5 rounded-2xl bg-base/60 border border-border/60 text-xs sm:text-sm"
              >
                <span className="px-2 py-1 rounded-md bg-surface border border-border font-mono font-bold text-ink text-xs shrink-0">
                  {item.time}
                </span>
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-ink">{item.event}</div>
                  {item.detail && <div className="text-xs text-ink-muted">{item.detail}</div>}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.type === 'cpr'
                    ? 'bg-alert/15 text-alert'
                    : item.type === 'video'
                    ? 'bg-accent/20 text-ink'
                    : 'bg-primary/15 text-primary'
                }`}>
                  {item.type || 'vital'}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
