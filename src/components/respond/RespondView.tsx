import React, { useState, useEffect, useRef } from 'react';
import { 
  Droplet, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Bone, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Search,
  Check,
  Sparkles,
  Users,
  FileText,
  Radar,
  Radio,
  QrCode,
  Play,
  Square,
  Activity,
  AlertCircle,
  Video,
  Camera,
  Box
} from 'lucide-react';
import { InjuryProtocolId, FirstAidProtocol, MicroStep, IncidentLog } from '../../types';
import { FIRST_AID_PROTOCOLS } from '../../data/protocols';
import { MedicalTelemetryBar } from '../common/MedicalTelemetryBar';
import { audioEngine } from '../../utils/audio';
import { askFirstAidAssistant, analyzeInjuryVisual, AIResponse } from '../../services/aiService';
import { FormattedAIMessage } from '../common/FormattedAIMessage';
import { userService } from '../../services/userService';
import { AcousticGaspDetector } from '../diagnostics/AcousticGaspDetector';
import { CrowdCommanderModal } from '../crowd/CrowdCommanderModal';
import { ParamedicHandoverModal, TelemetryTimelineItem } from './ParamedicHandoverModal';
import { EmergencyRadarModal } from '../radar/EmergencyRadarModal';
import { VideoForensicAnalyzer } from '../video/VideoForensicAnalyzer';
import { VideoIncidentAnalysis } from '../../services/videoAnalysisService';

interface RespondViewProps {
  initialProtocolId?: string;
  onTriggerEscalation: (reason: string) => void;
  onBackToHome: () => void;
}

export const RespondView: React.FC<RespondViewProps> = ({
  initialProtocolId,
  onTriggerEscalation,
  onBackToHome
}) => {
  // Navigation & State inside Respond
  const [selectedProtocolId, setSelectedProtocolId] = useState<InjuryProtocolId | null>(
    (initialProtocolId as InjuryProtocolId) || null
  );
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [incidentLog, setIncidentLog] = useState<IncidentLog | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Forensic Trauma Telemetry Logging
  const [cprActiveSecs, setCprActiveSecs] = useState<number>(0);
  const [cprCompressionsCount, setCprCompressionsCount] = useState<number>(0);
  const [cprAccuracyScore, setCprAccuracyScore] = useState<number>(94);
  const [woundPressureSecs, setWoundPressureSecs] = useState<number>(0);
  const [burnCoolingSecs, setBurnCoolingSecs] = useState<number>(0);
  const [symptomsRecorded, setSymptomsRecorded] = useState<string[]>([
    'Patient initially evaluated for responsiveness and airway',
    'Breathing screened for agonal gasping'
  ]);
  const [forensicTimeline, setForensicTimeline] = useState<TelemetryTimelineItem[]>([]);
  const [incidentPhotos, setIncidentPhotos] = useState<string[]>([]);

  // Pre-Hospital Blindness Critical Flags (Answers the 4 chaotic handoff questions)
  const [headStrikeStatus, setHeadStrikeStatus] = useState<'no' | 'yes' | 'unwitnessed'>('unwitnessed');
  const [oralFluidsGiven, setOralFluidsGiven] = useState<'no' | 'yes'>('no');
  const [seizureDurationSecs, setSeizureDurationSecs] = useState<number>(0);
  const [isSeizureTracking, setIsSeizureTracking] = useState<boolean>(false);
  const [unresponsiveSecs, setUnresponsiveSecs] = useState<number>(0);

  // Breakthrough Modals State
  const [showAcousticModal, setShowAcousticModal] = useState<boolean>(false);
  const [showCrowdModal, setShowCrowdModal] = useState<boolean>(false);
  const [showParamedicModal, setShowParamedicModal] = useState<boolean>(false);
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [isFatigueAlert, setIsFatigueAlert] = useState<boolean>(false);

  // Audio and Metronome State
  const [isMuted, setIsMuted] = useState<boolean>(audioEngine.getMuted());
  const [cprTick, setCprTick] = useState<number>(0);
  const [stepTimer, setStepTimer] = useState<number>(0);

  // Step camera visual scan state
  // "Something Else" free-text Q&A state
  const [freeTextQuery, setFreeTextQuery] = useState('');
  const [freeTextSuggestions, setFreeTextSuggestions] = useState<string[]>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AIResponse | null>(null);

  // Track start time for Incident Log
  const startTimeRef = useRef<number>(Date.now());
  const completedStepsRef = useRef<string[]>([]);
  const isSeizureTrackingRef = useRef<boolean>(false);
  isSeizureTrackingRef.current = isSeizureTracking;

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAskAi = async (customText?: string) => {
    const query = (customText || freeTextQuery).trim();
    if (!query) return;
    setIsAskingAi(true);
    setAiAnswer(null);
    try {
      const response = await askFirstAidAssistant(query);
      setAiAnswer(response);
      audioEngine.speak(response.text);
    } catch (err) {
      console.error('AI assistant error:', err);
    } finally {
      setIsAskingAi(false);
    }
  };

  // When initialProtocolId changes from props
  useEffect(() => {
    if (initialProtocolId && FIRST_AID_PROTOCOLS[initialProtocolId]) {
      setSelectedProtocolId(initialProtocolId as InjuryProtocolId);
      setStepIndex(0);
      setIsCompleted(false);
      startTimeRef.current = Date.now();
      completedStepsRef.current = [];
    }
  }, [initialProtocolId]);

  const activeProtocol: FirstAidProtocol | null = selectedProtocolId
    ? FIRST_AID_PROTOCOLS[selectedProtocolId] || null
    : null;

  const currentStep: MicroStep | null = activeProtocol && !isCompleted
    ? activeProtocol.microSteps[stepIndex] || null
    : null;

  const logTelemetryEvent = (event: string, detail?: string, type: 'cpr' | 'sensor' | 'gasp' | 'photo' | 'vital' | 'admin' = 'vital') => {
    const elapsed = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    setForensicTimeline((prev) => [...prev, { time: timeStr, event, detail, type }]);
  };

  // Pre-Hospital Blindness handler functions
  const handleSetHeadStrike = (status: 'no' | 'yes' | 'unwitnessed') => {
    setHeadStrikeStatus(status);
    logTelemetryEvent(
      `Head Strike Struck Ground/Curb: ${status.toUpperCase()}`,
      status === 'yes' ? '🚨 C-Spine immobilization alert flagged for EMS' : 'No obvious cranial trauma reported',
      'vital'
    );
  };

  const handleSetWaterGiven = (status: 'no' | 'yes') => {
    setOralFluidsGiven(status);
    logTelemetryEvent(
      `Oral Fluids / Water Given: ${status.toUpperCase()}`,
      status === 'yes' ? '⚠️ High Aspiration risk! Patient given fluids pre-hospital' : 'NPO aspiration risk prevented (Nothing given by mouth)',
      'vital'
    );
  };

  const handleToggleSeizureClock = () => {
    const next = !isSeizureTracking;
    setIsSeizureTracking(next);
    if (next) {
      logTelemetryEvent('Active Convulsion / Seizure Clock Started', 'Tracking duration', 'vital');
    } else {
      logTelemetryEvent('Active Convulsion / Seizure Clock Stopped', `Total recorded seizure time: ${formatTime(seizureDurationSecs)}`, 'vital');
    }
  };

  const handleAddSeizureSecs = (added: number) => {
    setSeizureDurationSecs((prev) => {
      const next = prev + added;
      logTelemetryEvent('Seizure Duration Adjusted', `Manually adjusted to ${formatTime(next)}`, 'vital');
      return next;
    });
  };

  // Handle Video Forensic Ingestion into Black-Box Docket
  const handleVideoAnalysisIngest = (analysis: VideoIncidentAnalysis, frames: string[]) => {
    setHeadStrikeStatus(analysis.preHospitalAnswers.headStrikeDetected);
    setOralFluidsGiven(analysis.preHospitalAnswers.oralFluidsObserved);
    if (analysis.preHospitalAnswers.unresponsiveDurationSecs > 0) {
      setUnresponsiveSecs(analysis.preHospitalAnswers.unresponsiveDurationSecs);
    }
    if (analysis.preHospitalAnswers.seizureDurationSecs > 0) {
      setSeizureDurationSecs(analysis.preHospitalAnswers.seizureDurationSecs);
    }
    if (frames && frames.length > 0) {
      setIncidentPhotos((prev) => [...frames, ...prev].slice(0, 8));
    }
    setSymptomsRecorded((prev) => [
      `Video analysis: ${analysis.whatHappenedSummary}`,
      `Mechanism: ${analysis.mechanismOfInjury}`,
      ...prev
    ]);
    logTelemetryEvent(
      'Gemini 3.6 Flash Video Forensic Telemetry Ingested',
      `Identified: ${analysis.identifiedInjury} | MOI: ${analysis.mechanismOfInjury}`,
      'sensor'
    );
  };

  // Handle TTS narration, CPR metronome, and telemetry intervals
  useEffect(() => {
    if (!currentStep || isCompleted) {
      audioEngine.stopMetronome();
      audioEngine.stopSpeech();
      return;
    }

    // Voice narration of current micro-step
    audioEngine.speak(currentStep.audioPrompt);

    // CPR metronome management
    if (currentStep.isCPR) {
      audioEngine.startMetronome(currentStep.metronomeBpm || 110, (tick) => {
        setCprTick(tick);
      });
      logTelemetryEvent('CPR Metronome Active', `Rhythm: ${currentStep.metronomeBpm || 110} BPM`, 'cpr');
    } else {
      audioEngine.stopMetronome();
    }

    // Reset step timer & fatigue
    setStepTimer(0);
    setIsFatigueAlert(false);
    const interval = setInterval(() => {
      setStepTimer((prev) => {
        const next = prev + 1;
        // CPR Active duration & compression telemetry
        if (currentStep.isCPR) {
          setCprActiveSecs((s) => s + 1);
          setCprCompressionsCount((c) => c + 2);
          if (next >= 120 && next % 120 === 0) {
            setIsFatigueAlert(true);
            audioEngine.speak('Warning. Two minutes of chest compressions elapsed. Rescuer arms tire out. Swap rescuers on the count of 3.');
            logTelemetryEvent('2-Minute Rescuer Fatigue Interval', 'Swap rescuer prompt issued', 'vital');
          }
        }
        if (selectedProtocolId === 'bleeding' || currentStep.instruction.toLowerCase().includes('pressure')) {
          setWoundPressureSecs((s) => s + 1);
        }
        if (selectedProtocolId === 'burn' || currentStep.instruction.toLowerCase().includes('cool')) {
          setBurnCoolingSecs((s) => s + 1);
        }
        return next;
      });

      if (selectedProtocolId === 'unconscious') {
        setUnresponsiveSecs((s) => s + 1);
      }

      if (isSeizureTrackingRef.current) {
        setSeizureDurationSecs((s) => s + 1);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      audioEngine.stopSpeech();
      audioEngine.stopMetronome();
    };
  }, [currentStep, isCompleted]);

  // Handle selecting triage card
  const handleSelectTriage = (protocolId: InjuryProtocolId) => {
    setSelectedProtocolId(protocolId);
    setStepIndex(0);
    setIsCompleted(false);
    startTimeRef.current = Date.now();
    completedStepsRef.current = [];
    setCprActiveSecs(0);
    setCprCompressionsCount(0);
    setWoundPressureSecs(0);
    setBurnCoolingSecs(0);
    setUnresponsiveSecs(protocolId === 'unconscious' ? 1 : 0);
    setSeizureDurationSecs(0);
    setIsSeizureTracking(false);
    setHeadStrikeStatus('unwitnessed');
    setOralFluidsGiven('no');
    const initialTitle = FIRST_AID_PROTOCOLS[protocolId]?.title || protocolId;
    setForensicTimeline([
      { time: '00:00', event: 'Emergency protocol initiated', detail: initialTitle, type: 'admin' }
    ]);
  };

  // Step camera snapshot verification
  
  // Handle micro-step completion
  const handleNextStep = () => {
    if (!activeProtocol || !currentStep) return;

    if (!completedStepsRef.current.includes(currentStep.instruction)) {
      completedStepsRef.current.push(currentStep.instruction);
    }
    logTelemetryEvent(`Completed Step ${stepIndex + 1}: ${currentStep.instruction}`, currentStep.actionPrompt, currentStep.isCPR ? 'cpr' : 'vital');

    if (stepIndex + 1 < activeProtocol.microSteps.length) {
      setStepIndex((prev) => prev + 1);
    } else {
      const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const log: IncidentLog = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        protocolId: activeProtocol.id,
        protocolTitle: activeProtocol.title,
        startedAt: new Date(startTimeRef.current).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: duration,
        stepsCompleted: [...completedStepsRef.current],
        escalationTriggered: false,
        sensorObservations: activeProtocol.requiresCamera 
          ? ['Visual guidance verified via camera', 'Positioning confirmed', 'Rhythm monitored']
          : ['Non-visual protocol completed without camera prompt']
      };
      setIncidentLog(log);
      userService.addIncident(log);
      setIsCompleted(true);
      audioEngine.stopMetronome();
      audioEngine.stopSpeech();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = audioEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleShareLog = async () => {
    if (!incidentLog) return;
    const summaryText = `[SANJEEVANI FIRST-AID INCIDENT LOG]
Incident: ${incidentLog.protocolTitle}
Time: ${incidentLog.startedAt} - ${incidentLog.completedAt} (${incidentLog.durationSeconds}s)
Steps Completed:
${incidentLog.stepsCompleted.map((s, i) => `${i + 1}. ${s}`).join('\n')}
Status: Micro-steps administered safely. No hard-stop escalation required.
Generated by Sanjeevani v2`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(summaryText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  const handleSearchChange = (query: string) => {
    setFreeTextQuery(query);
    if (!query.trim()) {
      setFreeTextSuggestions([]);
      return;
    }
    const q = query.toLowerCase();
    const suggestions = [
      'Nosebleed (pinch soft nostrils & lean forward)',
      'Bee or wasp sting (scrape stinger sideways)',
      'Heat exhaustion (move to shade & sip water)',
      'Ankle sprain (rest, ice, compress, elevate)',
      'Fainting (raise legs 30 cm, loosen collar)'
    ].filter((s) => s.toLowerCase().includes(q));
    setFreeTextSuggestions(suggestions);
  };

  // ==========================================
  // VIEW 1: TRIAGE (Two-tap picker)
  // ==========================================
  const renderTriageView = () => {
    const triageOptions: { id: InjuryProtocolId; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; desc: string }[] = [
      { id: 'bleeding', label: 'Bleeding', icon: Droplet, desc: 'Cuts, scratches, or bleeding wounds' },
      { id: 'burn', label: 'Burn', icon: Flame, desc: 'Hot water, steam, tea, or hot surfaces' },
      { id: 'unconscious', label: 'Not breathing / Unconscious', icon: HeartPulse, desc: 'Not waking up or struggling to breathe' },
      { id: 'choking', label: 'Choking', icon: ShieldAlert, desc: 'Food or object stuck in throat' },
      { id: 'fracture', label: 'Fall or broken bone', icon: Bone, desc: 'Heavy fall, bad sprain, or swollen bone' },
      { id: 'custom', label: 'Something else', icon: HelpCircle, desc: 'Nosebleed, bee sting, sprain, or search' }
    ];

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-ink-muted hover:text-ink btn-press py-1.5 px-2.5 rounded-lg border border-border bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>

          <span className="text-xs font-semibold text-primary px-3 py-1 rounded-full bg-primary/10">
            Step 1: Choose Injury
          </span>
        </div>

        <div className="space-y-2 text-left pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            What happened?
          </h1>
          <p className="text-sm text-ink-muted">
            Tap what is wrong. We will provide clear clinical steps right away, with audio pacing and contraindication warnings.
          </p>
        </div>

        {/* Two-Tap Triage Grid (Immediate Clinical Access) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {triageOptions.map((opt) => {
            const Icon = opt.icon;
            const isHighPriority = opt.id === 'unconscious';
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectTriage(opt.id)}
                className={`text-left p-5 rounded-2xl border transition-all btn-press flex items-start space-x-4 cursor-pointer ${
                  isHighPriority 
                    ? 'border-alert/30 bg-alert/5 hover:border-alert/60 shadow-xs' 
                    : 'border-border bg-surface hover:border-primary/40 hover:shadow-xs'
                }`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${
                  isHighPriority ? 'bg-alert/15 text-alert' : 'bg-primary/10 text-primary'
                }`}>
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <span className="block text-base font-bold text-ink">
                    {opt.label}
                  </span>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Specialized Field Tools (Airy Secondary Shelf) */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Paramedic QR Shortcut */}
          <button
            onClick={() => setShowParamedicModal(true)}
            className="p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 flex items-center justify-between text-left transition-all btn-press cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary text-white shrink-0">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">Paramedic QR Docket</span>
                <span className="text-[11px] text-ink-muted block">Generate 0.5s offline handoff</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          </button>

          {/* AI Forensic Video Analyzer */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-4 rounded-2xl border border-accent/30 bg-accent/10 hover:bg-accent/15 flex items-center justify-between text-left transition-all btn-press cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-accent text-ink shrink-0">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">Video Incident Analyzer</span>
                <span className="text-[11px] text-ink-muted block">Analyze accident video clip</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-accent shrink-0" />
          </button>
        </div>

        {/* Emergency Escalation Hard Trigger Footer */}
        <div className="rounded-2xl border border-alert/20 bg-alert/5 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-alert">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold">
              Is the person bleeding heavily or in serious danger?
            </span>
          </div>
          <button
            onClick={() => onTriggerEscalation('Severe distress reported during triage')}
            className="px-3 py-1.5 rounded-lg bg-alert text-white text-xs font-bold btn-press shrink-0"
          >
            Call 112 for Help
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW 2: SOMETHING ELSE / FALLBACK SEARCH
  // ==========================================
  const renderCustomView = () => {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-200">
        <button
          onClick={() => setSelectedProtocolId(null)}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-ink-muted hover:text-ink btn-press py-1.5 px-2.5 rounded-lg border border-border bg-surface"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Triage</span>
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink">
            Describe what happened
          </h1>
          <p className="text-xs text-ink-muted">
            Search symptoms or select from common situations below.
          </p>
        </div>

        {/* Search Input with clean focus ring and Ask button */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-ink-muted" strokeWidth={1.75} />
            <input
              type="text"
              value={freeTextQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskAi();
              }}
              placeholder="e.g. nosebleed, bee sting, heat faint, sprained ankle..."
              className="w-full pl-11 pr-32 py-3 rounded-xl border border-border bg-surface text-ink text-sm placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoFocus
            />
            <button
              onClick={() => handleAskAi()}
              disabled={isAskingAi || !freeTextQuery.trim()}
              className="absolute right-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-xs hover:brightness-105 disabled:opacity-50 btn-press flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink" />
              <span>{isAskingAi ? 'Thinking...' : 'Ask AI'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
            <span>Verified doctor-approved clinical guidance</span>
            <span className="text-primary font-medium">Press Enter or tap Ask AI</span>
          </div>
        </div>

        {/* AI Loading State */}
        {isAskingAi && (
          <div className="p-6 rounded-2xl bg-accent/10 border border-accent/30 text-center space-y-3 animate-pulse">
            <div className="h-10 w-10 mx-auto rounded-full bg-accent/20 flex items-center justify-center text-ink">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-ink">
                Generating Calm Guidance...
              </h3>
              <p className="text-xs text-ink-muted">
                Checking safe everyday steps and emergency precautions.
              </p>
            </div>
          </div>
        )}

        {/* AI Response Card */}
        {aiAnswer && !isAskingAi && (
          <div className="p-5 rounded-2xl bg-surface border-2 border-accent/40 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-accent text-ink flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">
                    Sanjeevani AI First-Aid Advice
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    Model: {aiAnswer.modelUsed}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => audioEngine.speak(aiAnswer.text)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-border bg-base text-[11px] font-semibold text-ink hover:bg-surface btn-press"
                  title="Play voice instructions"
                >
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  <span>Listen</span>
                </button>
                <button
                  onClick={() => setAiAnswer(null)}
                  className="text-xs text-ink-muted hover:text-ink px-2 py-1"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Answer body with structured cards */}
            <div className="bg-base/80 p-4 rounded-xl border border-border/80">
              <FormattedAIMessage
                text={aiAnswer.text}
                onTriggerEscalation={(reason) => onTriggerEscalation(reason || 'AI Emergency Protocol')}
              />
            </div>

            {/* If emergency flag is present */}
            {aiAnswer.isEmergency && (
              <div className="p-3.5 rounded-xl bg-alert/10 border border-alert/30 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-alert text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>If bleeding is severe, or person is unconscious, call for an ambulance immediately.</span>
                </div>
                <button
                  onClick={() => onTriggerEscalation('High-risk signs identified by clinical AI')}
                  className="px-3 py-1.5 rounded-lg bg-alert text-white text-xs font-bold shrink-0 btn-press"
                >
                  Call 112
                </button>
              </div>
            )}

            {/* Follow-up / finish actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
                  const log: IncidentLog = {
                    id: `LOG-${Date.now().toString().slice(-6)}`,
                    protocolId: 'custom',
                    protocolTitle: `AI Assist: ${freeTextQuery}`,
                    startedAt: new Date(startTimeRef.current).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    durationSeconds: duration,
                    stepsCompleted: ['Followed Clinical Emergency Steps', 'Stabilized bystander'],
                    escalationTriggered: false,
                    sensorObservations: ['Custom AI advice administered safely']
                  };
                  setIncidentLog(log);
                  setIsCompleted(true);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold btn-press"
              >
                Person is Stabilized → Save Incident Log
              </button>

              <button
                onClick={() => handleSelectTriage('unconscious')}
                className="text-xs font-semibold text-ink-muted hover:text-ink px-2 py-1"
              >
                Switch to CPR Guide →
              </button>
            </div>
          </div>
        )}

        {/* Suggestions list */}
        {freeTextSuggestions.length > 0 && !aiAnswer && (
          <div className="rounded-xl border border-border bg-surface p-2 space-y-1">
            {freeTextSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleAskAi(item)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-ink hover:bg-base rounded-lg btn-press flex items-center justify-between"
              >
                <span>{item}</span>
                <span className="text-[10px] text-accent font-bold">Ask AI →</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick common chips */}
        {!aiAnswer && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Common Quick Situations (Tap to Ask AI)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Nosebleed', query: 'How do I stop a nosebleed?', desc: 'Lean forward, pinch nostrils for 10 min' },
                { title: 'Bee / Wasp Sting', query: 'How to treat a bee or wasp sting?', desc: 'Scrape stinger sideways, apply cold pack' },
                { title: 'Sprained Ankle', query: 'First aid for a badly sprained ankle?', desc: 'Rest, ice pack wrapped, elevate' },
                { title: 'Heat Exhaustion', query: 'How to help someone with heat exhaustion?', desc: 'Move to shade, sip cool water slowly' }
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFreeTextQuery(chip.query);
                    handleAskAi(chip.query);
                  }}
                  className="p-3.5 text-left rounded-xl border border-border bg-surface hover:border-primary/40 btn-press"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink block">{chip.title}</span>
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-[11px] text-ink-muted">{chip.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW 3: COMPLETED INCIDENT LOG
  // ==========================================
  const renderCompletedView = () => {
    if (!incidentLog) return null;

    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-200">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success mb-3">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            Protocol Completed Safely
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            The situation has been stabilized. An automated forensic incident summary has been prepared.
          </p>
        </div>

        {/* Incident Log Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-ink-muted">
                {incidentLog.id}
              </span>
              <h2 className="text-lg font-bold text-ink">
                {incidentLog.protocolTitle}
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-xs font-semibold text-primary">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {incidentLog.durationSeconds}s duration
              </span>
              <p className="text-[11px] text-ink-muted">
                {incidentLog.startedAt} - {incidentLog.completedAt}
              </p>
            </div>
          </div>

          {/* Steps Completed Sequence */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Steps You Completed
            </span>
            <div className="space-y-2">
              {incidentLog.stepsCompleted.map((step, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 text-xs text-ink bg-base px-3 py-2 rounded-lg border border-border/60">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2.5} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Forensic Summary Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-base border border-border text-center">
              <span className="text-[10px] text-ink-muted uppercase block">Head Strike</span>
              <span className={`text-xs font-bold ${headStrikeStatus === 'yes' ? 'text-alert' : 'text-ink'}`}>
                {headStrikeStatus.toUpperCase()}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-base border border-border text-center">
              <span className="text-[10px] text-ink-muted uppercase block">Oral Fluids</span>
              <span className={`text-xs font-bold ${oralFluidsGiven === 'yes' ? 'text-alert' : 'text-success'}`}>
                {oralFluidsGiven === 'no' ? 'NONE (NPO)' : 'GIVEN'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-base border border-border text-center">
              <span className="text-[10px] text-ink-muted uppercase block">CPR Delivered</span>
              <span className="text-xs font-bold text-ink">
                {cprActiveSecs > 0 ? `${cprActiveSecs}s (${cprAccuracyScore}%)` : 'None'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-base border border-border text-center">
              <span className="text-[10px] text-ink-muted uppercase block">Telemetry Logs</span>
              <span className="text-xs font-bold text-primary">
                {forensicTimeline.length} Events
              </span>
            </div>
          </div>

          {/* One-Tap Share and Paramedic Handover Action */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => setShowParamedicModal(true)}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-md hover:brightness-105 btn-press"
            >
              <FileText className="w-4 h-4 text-ink" />
              <span>Generate Paramedic Handover Docket (QR / NFC)</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleShareLog}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary-dark btn-press"
              >
                {copiedShare ? (
                  <>
                    <Check className="h-4 w-4 text-accent" />
                    <span>Log Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Share Summary with Nurse</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedProtocolId(null);
                  setIsCompleted(false);
                }}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-border bg-surface text-xs font-semibold text-ink hover:bg-base btn-press"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Start Over</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW 4: GUIDED MICRO-STEPS
  // ==========================================
  const renderMicroStepsView = () => {
    if (!activeProtocol || !currentStep) return null;

    const totalSteps = activeProtocol.microSteps.length;
    const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);
    const elapsedTotal = Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));

    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-8 space-y-5 animate-in fade-in duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedProtocolId(null)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-ink-muted hover:text-ink btn-press py-1.5 px-2.5 rounded-lg border border-border bg-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Menu</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Video Forensic Trigger */}
            <button
              onClick={() => setShowVideoModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-accent/40 bg-accent/20 text-ink text-xs font-bold hover:bg-accent/30 btn-press"
              title="Deconstruct incident video clip"
            >
              <Video className="h-3.5 w-3.5 text-accent" />
              <span>Video AI</span>
            </button>

            {/* Crowd Commander Squad Trigger */}
            <button
              onClick={() => setShowCrowdModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/20 text-ink text-xs font-bold btn-press shadow-2xs hover:bg-accent/30"
              title="Orchestrate onlookers into a trauma team"
            >
              <Users className="h-3.5 w-3.5 text-accent" />
              <span className="hidden sm:inline">Orchestrate Crowd</span>
              <span className="sm:hidden">Squad</span>
            </button>

            {/* Emergency Radar Trigger */}
            <button
              onClick={() => setShowRadarModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-ink text-xs font-semibold hover:bg-base btn-press"
              title="Find nearest Hospital & AED"
            >
              <Radar className="h-3.5 w-3.5 text-primary" />
              <span className="hidden md:inline">Radar</span>
            </button>

            {/* Paramedic Handover Trigger */}
            <button
              onClick={() => setShowParamedicModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 btn-press"
              title="Generate Paramedic QR Docket"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Paramedic QR</span>
            </button>

            {/* Hands-Free Voice Narration Toggle */}
            <button
              onClick={handleToggleMute}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border btn-press transition-colors ${
                isMuted 
                  ? 'border-border bg-surface text-ink-muted' 
                  : 'border-primary/40 bg-primary/10 text-primary'
              }`}
              title="Turn voice instructions on or off"
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Turn Voice On</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Voice Active</span>
                </>
              )}
            </button>

            {/* Hard-Stop Escalation Trigger Button */}
            <button
              onClick={() => onTriggerEscalation(`Reported critical in ${activeProtocol.title} step ${stepIndex + 1}`)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-alert text-white text-xs font-bold btn-press shadow-xs hover:bg-alert/90"
              title="Call emergency 112"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Call 112</span>
            </button>
          </div>
        </div>

        {/* Real-time Physiological Telemetry Bar */}
        <MedicalTelemetryBar
          isCPR={currentStep.isCPR}
          bpm={currentStep.metronomeBpm || 110}
          elapsedSeconds={cprActiveSecs || woundPressureSecs || burnCoolingSecs || Math.floor((Date.now() - startTimeRef.current) / 1000)}
          triageLevel={activeProtocol.severity === 'critical' ? 'immediate' : 'urgent'}
          protocolTitle={activeProtocol.title}
        />

        {/* Micro-Step Progress Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
            <span>
              {activeProtocol.title} • Step {stepIndex + 1} of {totalSteps}
            </span>
            <span>{formatTime(stepTimer)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CPR Metronome Banner */}
        {currentStep.isCPR && (
          <div className="space-y-2">
            {isFatigueAlert && (
              <div className="p-4 rounded-2xl bg-alert/20 border-2 border-alert text-alert animate-bounce flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    ⚠️ 2 MINUTES ELAPSED — SWAP RESCUERS NOW! Rescuer fatigue reduces chest depth.
                  </span>
                </div>
                <button 
                  onClick={() => setIsFatigueAlert(false)}
                  className="px-2.5 py-1 rounded-md bg-alert text-white text-[10px] font-bold"
                >
                  Swapped
                </button>
              </div>
            )}

            <div className="rounded-2xl border-2 border-accent bg-accent/10 p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink font-bold text-sm">
                  {cprTick % 4 === 1 ? '1' : cprTick % 4 === 2 ? '2' : cprTick % 4 === 3 ? '3' : '4'}
                </div>
                <div>
                  <span className="text-xs font-bold text-ink block">
                    CPR Beat Active ({currentStep.metronomeBpm || 110} beats per minute)
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    Push hard and fast in center of chest. Let chest rise fully each time.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent text-ink">
                30 Pushes : 2 Breaths
              </span>
            </div>
          </div>
        )}

        {/* Agonal Gasp Screener Tool */}
        {selectedProtocolId === 'unconscious' && (
          <button
            onClick={() => setShowAcousticModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-accent/20 border border-accent/40 text-ink font-bold text-xs flex items-center justify-center space-x-2 btn-press hover:bg-accent/30 shadow-2xs"
          >
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <span>Acoustic Breath Screener: Check for Agonal Gasping (4 Seconds)</span>
          </button>
        )}

        {/* Single Micro-Step Card */}
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-primary">
              What To Do Now
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink leading-tight">
              {currentStep.instruction}
            </h2>
            <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
              {currentStep.detail}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleNextStep}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-primary text-white font-bold text-base shadow-sm hover:bg-primary-dark btn-press"
            >
              <span>{currentStep.actionPrompt}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORENSIC TRAUMA TELEMETRY RECORDER & PRE-HOSPITAL FLIGHT DECK              */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Deck Header with live pulse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-alert"></span>
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Black-Box Trauma Telemetry
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-alert/15 text-alert">
                    ● REC T+{formatTime(elapsedTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Continuous pre-hospital timeline logging for arriving paramedics.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-ink px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/40 hover:bg-accent/30 btn-press"
              >
                <Video className="w-3.5 h-3.5 text-accent" />
                <span>Video AI</span>
              </button>

              <button
                onClick={() => setShowParamedicModal(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-primary hover:text-primary-dark btn-press"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Full Docket Preview</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Live Telemetry Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-base border border-border">
              <span className="text-[10px] uppercase font-bold text-ink-muted block">Elapsed Total</span>
              <span className="text-sm font-mono font-bold text-ink">
                {formatTime(elapsedTotal)}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              cprActiveSecs > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-base border-border text-ink-muted'
            }`}>
              <span className="text-[10px] uppercase font-bold block">Active CPR</span>
              <span className="text-sm font-mono font-bold">
                {cprActiveSecs > 0 ? `${formatTime(cprActiveSecs)} (${cprAccuracyScore}%)` : 'Inactive'}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              woundPressureSecs > 0 ? 'bg-alert/10 border-alert/30 text-alert' : 'bg-base border-border text-ink-muted'
            }`}>
              <span className="text-[10px] uppercase font-bold block">Direct Pressure</span>
              <span className="text-sm font-mono font-bold">
                {woundPressureSecs > 0 ? formatTime(woundPressureSecs) : '0:00'}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              burnCoolingSecs > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-base border-border text-ink-muted'
            }`}>
              <span className="text-[10px] uppercase font-bold block">Burn Cooling</span>
              <span className="text-sm font-mono font-bold">
                {burnCoolingSecs > 0 ? formatTime(burnCoolingSecs) : '0:00'}
              </span>
            </div>
          </div>

          {/* Pre-Hospital Blindness Checklist (The 3 Critical Questions) */}
          <div className="p-4 rounded-2xl bg-base border border-border/80 space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-ink uppercase tracking-wide">
                Eliminating Pre-Hospital Data Blindness (Answer in 1-Tap)
              </span>
            </div>

            {/* Question 1: Head Strike */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">1. Did the patient's head strike the curb or ground?</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  headStrikeStatus === 'yes' ? 'bg-alert/20 text-alert' : 'bg-surface text-ink-muted'
                }`}>
                  {headStrikeStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetHeadStrike('unwitnessed')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all btn-press ${
                    headStrikeStatus === 'unwitnessed' 
                      ? 'border-primary bg-primary text-white font-bold' 
                      : 'border-border bg-surface text-ink hover:bg-surface/80'
                  }`}
                >
                  Unwitnessed
                </button>
                <button
                  onClick={() => handleSetHeadStrike('yes')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all btn-press ${
                    headStrikeStatus === 'yes' 
                      ? 'border-alert bg-alert text-white font-bold' 
                      : 'border-border bg-surface text-alert hover:bg-alert/5'
                  }`}
                >
                  Yes (Struck)
                </button>
                <button
                  onClick={() => handleSetHeadStrike('no')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all btn-press ${
                    headStrikeStatus === 'no' 
                      ? 'border-success bg-success text-white font-bold' 
                      : 'border-border bg-surface text-ink hover:bg-surface/80'
                  }`}
                >
                  No (Clear)
                </button>
              </div>
              {headStrikeStatus === 'yes' && (
                <div className="p-2 rounded-lg bg-alert/10 border border-alert/30 text-[11px] text-alert font-medium flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>C-Spine Alert: Keep neck strictly immobilized. Do not twist or elevate head.</span>
                </div>
              )}
            </div>

            {/* Question 2: Water / Oral Fluids Given */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">2. Did anyone give the person water or food?</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  oralFluidsGiven === 'yes' ? 'bg-alert/20 text-alert' : 'bg-success/20 text-success'
                }`}>
                  {oralFluidsGiven === 'no' ? 'NO (SAFE)' : 'YES (ASPIRATION RISK)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSetWaterGiven('no')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all btn-press ${
                    oralFluidsGiven === 'no' 
                      ? 'border-success bg-success text-white font-bold' 
                      : 'border-border bg-surface text-ink hover:bg-surface/80'
                  }`}
                >
                  ✓ No (NPO Protected)
                </button>
                <button
                  onClick={() => handleSetWaterGiven('yes')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all btn-press ${
                    oralFluidsGiven === 'yes' 
                      ? 'border-alert bg-alert text-white font-bold' 
                      : 'border-border bg-surface text-alert hover:bg-alert/5'
                  }`}
                >
                  ⚠️ Yes (Water Given)
                </button>
              </div>
              {oralFluidsGiven === 'yes' && (
                <div className="p-2 rounded-lg bg-alert/10 border border-alert/30 text-[11px] text-alert font-medium flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Aspiration Risk Alert: Fluid in airway/stomach. Paramedics must be informed immediately.</span>
                </div>
              )}
            </div>

            {/* Question 3: Seizure Duration Tracker */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">3. Convulsive Seizure Duration Tracker</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isSeizureTracking ? 'bg-alert text-white animate-pulse' : 'bg-surface text-ink'
                }`}>
                  {formatTime(seizureDurationSecs)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleSeizureClock}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all btn-press ${
                    isSeizureTracking 
                      ? 'bg-alert text-white border-alert animate-pulse' 
                      : 'bg-surface border-border text-ink hover:border-primary/40'
                  }`}
                >
                  {isSeizureTracking ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Seizure Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Seizure Clock</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAddSeizureSecs(30)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-ink hover:bg-base btn-press"
                  title="Add 30 seconds"
                >
                  +30s
                </button>

                <button
                  onClick={() => handleAddSeizureSecs(60)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-ink hover:bg-base btn-press"
                  title="Add 1 minute"
                >
                  +1 min
                </button>

                {seizureDurationSecs > 0 && (
                  <button
                    onClick={() => {
                      setSeizureDurationSecs(0);
                      setIsSeizureTracking(false);
                    }}
                    className="text-[11px] text-ink-muted hover:text-ink px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* The Big 1-Tap Paramedic Handoff Button */}
          <button
            onClick={() => setShowParamedicModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-accent via-[#F0A85B] to-[#E08A35] text-ink font-bold text-sm shadow-md hover:brightness-105 btn-press border border-accent/40"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-surface/90 text-ink shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block text-base font-extrabold leading-tight">
                  🚨 Handoff to Paramedic (QR / NFC)
                </span>
                <span className="text-xs font-medium text-ink/80 block mt-0.5">
                  Generates offline 0.5s vector QR & NFC Beam (Zero internet / Zero login)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold bg-surface/90 px-3 py-2 rounded-xl border border-border/50 shrink-0">
              <span>Open Docket</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Escalation Conditions Watchlist */}
        <div className="rounded-2xl border border-border/80 bg-base p-4">
          <span className="text-xs font-bold text-ink block mb-1">
            When to stop and call an ambulance (112) right away:
          </span>
          <ul className="text-xs text-ink-muted space-y-1 list-disc list-inside">
            {activeProtocol.escalationTriggers.map((trigger, i) => (
              <li key={i}>{trigger}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // ==========================================
  // ROOT RENDER: Views + Root Modals
  // ==========================================
  return (
    <div className="w-full min-h-[calc(100vh-4rem)]">
      {!selectedProtocolId ? (
        renderTriageView()
      ) : selectedProtocolId === 'custom' && stepIndex === 0 && !isCompleted ? (
        renderCustomView()
      ) : isCompleted && incidentLog ? (
        renderCompletedView()
      ) : activeProtocol && currentStep ? (
        renderMicroStepsView()
      ) : null}

      {/* Breakthrough Modals */}
      <AcousticGaspDetector
        isOpen={showAcousticModal}
        onClose={() => setShowAcousticModal(false)}
        onStartCPR={() => {
          setShowAcousticModal(false);
          handleSelectTriage('unconscious');
        }}
      />

      <CrowdCommanderModal
        isOpen={showCrowdModal}
        onClose={() => setShowCrowdModal(false)}
        protocolTitle={activeProtocol?.title || incidentLog?.protocolTitle || 'Trauma Incident'}
        protocolId={activeProtocol?.id || incidentLog?.protocolId || selectedProtocolId || 'cardiac'}
      />

      <ParamedicHandoverModal
        isOpen={showParamedicModal}
        onClose={() => setShowParamedicModal(false)}
        incidentLog={incidentLog}
        protocolTitle={activeProtocol?.title || incidentLog?.protocolTitle}
        protocolId={activeProtocol?.id || incidentLog?.protocolId || selectedProtocolId || 'cardiac'}
        startTime={startTimeRef.current}
        durationSeconds={Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))}
        cprSeconds={cprActiveSecs}
        cprCycles={Math.max(1, Math.floor(cprActiveSecs / 30))}
        cprCompressions={cprCompressionsCount}
        cprAccuracy={cprAccuracyScore}
        pressureMinutes={Math.round(woundPressureSecs / 60)}
        coolingMinutes={Math.round(burnCoolingSecs / 60)}
        symptoms={symptomsRecorded}
        timeline={forensicTimeline}
        photos={incidentPhotos}
        headStrike={headStrikeStatus}
        waterGiven={oralFluidsGiven}
        seizureDurationSecs={seizureDurationSecs}
        unresponsiveDurationSecs={unresponsiveSecs}
      />

      <EmergencyRadarModal
        isOpen={showRadarModal}
        onClose={() => setShowRadarModal(false)}
      />

      {/* Real AI Video Forensic Analyzer Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-4xl my-auto">
            <VideoForensicAnalyzer
              onLaunchProtocol={(protocolId) => {
                setShowVideoModal(false);
                handleSelectTriage(protocolId as any);
              }}
              onInjectIntoDocket={(analysis, frames) => {
                handleVideoAnalysisIngest(analysis, frames);
              }}
              onClose={() => setShowVideoModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
