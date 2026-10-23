import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  AlertTriangle, 
  PhoneCall, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  MapPin,
  HeartPulse, 
  Video as VideoIcon, 
  Zap,
  Activity,
  ShieldCheck,
  QrCode,
  Users
} from 'lucide-react';
import { askFirstAidAssistant, analyzeInjuryVisual, AIResponse, FailSafeEvent, FAIL_SAFE_MODELS } from '../../services/aiService';
import { extractFramesFromVideo, analyzeVideoIncident, VideoIncidentAnalysis } from '../../services/videoAnalysisService';
import { FormattedAIMessage } from '../common/FormattedAIMessage';
import { getAutomaticEscalationDispatch, EmergencyFacility, RouteComputationResult, getUserLocationInfo, UserLocationInfo } from '../../services/placesRoutesService';
import { EmergencyRouteMap } from '../common/EmergencyRouteMap';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { ParamedicHandoutCard } from './ParamedicHandoutCard';
import { createParamedicHandout, ParamedicHandoutData } from '../../utils/handoutHelper';
import { BystanderSquadCard } from './BystanderSquadCard';
import { createBystanderSquadSession, BystanderSquadSession } from '../../services/bystanderSquadEngine';
import { createSquadSessionInFirestore } from '../../firebase/db';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
  imagePreview?: string;
  videoPreview?: string;
  videoName?: string;
  modelUsed?: string;
  modelDisplayName?: string;
  tierUsed?: number;
  latencyMs?: number;
  failSafeTriggered?: boolean;
  facility?: EmergencyFacility;
  route?: RouteComputationResult;
  forensicReport?: VideoIncidentAnalysis;
  handout?: ParamedicHandoutData;
  squadSession?: BystanderSquadSession;
}

interface ChatViewProps {
  initialQuery?: string;
  onTriggerEscalation: (reason?: string) => void;
  onLaunchProtocol?: (protocolId: string) => void;
  onBackToHome?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialQuery,
  onTriggerEscalation,
  onLaunchProtocol,
  onBackToHome
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        sender: 'model',
        text: "Namaste! I am your Sanjeevani AI First-Aid Guardian, built on AHA 2020 and AIIMS Emergency Medicine guidelines.\n\nAsk any urgent first-aid question, speak your symptoms with the microphone, or attach an injury photo or incident video. I provide immediate 1-2-3 steps, contraindication warnings, and live hospital route navigation.\n\n*If the victim is unconscious or not breathing, tap 112 SOS immediately.*",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-flash-lite-latest',
        modelDisplayName: 'Gemini Flash-Lite (Tier 1)',
        tierUsed: 1,
        handout: createParamedicHandout(
          'welcome',
          'First-Aid Standby & Scene Triage Readiness',
          "**Immediate Priority:** Check responsiveness, open airway, and verify breathing before moving.\n\n**Immediate Action Steps:**\n1. Verify scene safety for yourself and patient.\n2. Tap shoulders and shout to assess responsiveness.\n3. Call 112 if unresponsive or irregular agonal gasping.\n\n**CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**\n* Do not give water or oral fluids to drowsy patients.\n* Do not manipulate head/neck if trauma is suspected.",
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          false,
          'Clinical AI'
        ),
        squadSession: createBystanderSquadSession(
          'cardiac_cpr',
          'First-Aid Standby & Scene Triage Readiness — Bystander Task Delegation Active',
          'Current Emergency Scene'
        )
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [videoStatusText, setVideoStatusText] = useState<string | null>(null);
  const [failSafeStatus, setFailSafeStatus] = useState<{
    activeModelName: string;
    tier: number;
    isSwitching: boolean;
    switchReason?: string;
    secondsElapsed: number;
  } | null>(null);
  const [activeHandoutModal, setActiveHandoutModal] = useState<ParamedicHandoutData | null>(null);
  const [activeSquadModal, setActiveSquadModal] = useState<BystanderSquadSession | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ file: File; name: string; previewUrl: string } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userLocationInfo, setUserLocationInfo] = useState<UserLocationInfo | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [completedMsgIds, setCompletedMsgIds] = useState<Set<string>>(() => new Set(['welcome']));

  // Derive latest handout and squad session from messages stream
  const latestHandout = [...messages].reverse().find((m) => m.handout)?.handout;
  const latestSquadSession = [...messages].reverse().find((m) => m.squadSession)?.squadSession;

  // Live timer for fail-safe countdown / elapsed tracking
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setInterval(() => {
        setFailSafeStatus((prev) => prev ? { ...prev, secondsElapsed: prev.secondsElapsed + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const quickScenarios = [
    { title: '🫀 CPR & Unresponsive', prompt: 'Unresponsive person not breathing normally. Start CPR guidance immediately.' },
    { title: '🩸 Arterial Hemorrhage', prompt: 'Heavy arterial bleeding won’t stop. Guide me on direct pressure and tourniquet application.' },
    { title: '🐍 Snake Bite & Anti-Venom', prompt: 'Snake bite with puncture wounds, swelling and pain. Where is nearest Anti-Snake Venom (ASV) and what are safe first-aid steps?' },
    { title: '👶 Toddler Choking', prompt: 'Toddler or child is choking on food or small object and cannot make sound. Guide back blows and chest thrusts.' },
    { title: '🔥 Severe Scald Burn', prompt: 'Severe boiling water burn with skin peeling and severe pain. How to cool and protect the wound?' },
    { title: '☀️ Heatstroke (104°F+)', prompt: 'Person with high fever, hot dry skin, confusion, and dizziness from severe heat exhaustion or heatstroke.' },
    { title: '🦴 Broken Bone / Fracture', prompt: 'Suspected broken arm or leg bone with deformity and inability to bear weight. How do I immobilize it?' },
    { title: '🐝 Anaphylactic Shock', prompt: 'Severe allergic reaction, throat swelling, difficulty swallowing, rapid hives. Immediate first aid steps.' },
    { title: '🏥 Nearest Hospital Route', prompt: 'What is the nearest emergency hospital and live driving route right now?' }
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load location
  useEffect(() => {
    getUserLocationInfo().then(setUserLocationInfo);
  }, []);

  // Handle initial query if passed
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, []);

  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find((v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN'));
    if (indVoice) {
      utterance.voice = indVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend && !selectedImage && !selectedVideo) return;

    const userMsgId = 'user_' + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend || (selectedVideo ? 'Attached emergency incident video clip' : 'Attached injury photograph for analysis'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage || undefined,
      videoPreview: selectedVideo?.previewUrl || undefined,
      videoName: selectedVideo?.name || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    const imageToAnalyze = selectedImage;
    const videoToAnalyze = selectedVideo;
    setSelectedImage(null);
    setSelectedVideo(null);
    setIsLoading(true);
    setVideoStatusText(null);

    try {
      let replyText = '';
      let isEmergency = false;
      let modelUsed = 'gemini-flash-lite-latest';
      let modelDisplayName = 'Gemini Flash-Lite (Tier 1)';
      let tierUsed = 1;
      let latencyMs = 0;
      let failSafeTriggered = false;
      let forensicReport: VideoIncidentAnalysis | undefined = undefined;

      setFailSafeStatus({
        activeModelName: 'Gemini Flash-Lite (Tier 1)',
        tier: 1,
        isSwitching: false,
        secondsElapsed: 0
      });

      // 1. VIDEO FORENSIC MULTIMODAL PATH
      if (videoToAnalyze) {
        setVideoStatusText('Extracting keyframes from video clip...');
        const { frames, durationSeconds } = await extractFramesFromVideo(videoToAnalyze.file, 6);
        setVideoStatusText('Analyzing video with clinical multimodal engine...');
        
        forensicReport = await analyzeVideoIncident(
          frames,
          videoToAnalyze.file.name,
          durationSeconds,
          (_pct: number, st: string) => setVideoStatusText(st)
        );

        replyText = forensicReport.whatHappenedSummary + 
          '\n\n**IMMEDIATE PRIORITY:** ' + forensicReport.immediateActions[0] +
          '\n\n**Here is what you should do:**\n' +
          forensicReport.immediateActions.map((act, i) => `${i + 1}. ${act}`).join('\n') +
          '\n\n**WHAT NOT TO DO:** Avoid moving victim unnecessarily or administering fluids until airway is verified.' +
          '\n\n**Paramedic Handover Script:** ' + forensicReport.paramedicSummary;

        isEmergency = forensicReport.urgencyLevel === 'CRITICAL_112';
        modelUsed = forensicReport.modelUsed || 'clinical-model';
        modelDisplayName = 'Clinical Multimodal Forensics';
      }
      // 2. IMAGE VISUAL ANALYSIS PATH
      else if (imageToAnalyze) {
        const visionResult = await analyzeInjuryVisual(
          imageToAnalyze,
          textToSend || 'Evaluate this injury visual, state priority action and contraindications'
        );
        replyText = `• *Immediate Priority:* ${visionResult.actionSteps[0] || visionResult.summary}\n\n` +
          `### Immediate Action Steps:\n` +
          visionResult.actionSteps.map((s, idx) => {
            const parts = s.split(':');
            const stepTitle = parts.length > 1 ? parts[0].replace(/^\d+[\.\s]*/, '').trim() : `Action ${idx + 1}`;
            const stepContent = parts.length > 1 ? parts.slice(1).join(':').trim() : s.replace(/^\d+[\.\s]*/, '').trim();
            return `${idx + 1}. **${stepTitle}:** ${stepContent}`;
          }).join('\n') +
          `\n\n**CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**\n` +
          visionResult.whatNotToDo.map(w => `* ${w}`).join('\n') +
          (visionResult.isHardStop ? `\n\n**⚠️ Immediate 112 / Hospital Red Flags:**\n* Severe trauma, deep burns, active hemorrhage, or respiratory difficulty requiring emergency ambulance dispatch.` : '');
        isEmergency = visionResult.isHardStop;
        modelUsed = visionResult.modelUsed || 'clinical-model';
        modelDisplayName = 'Clinical Vision';
        latencyMs = visionResult.latencyMs || 0;
      }
      // 3. TEXT FIRST-AID PATH
      else {
        const historyContext = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-6)
          .map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('model' as const),
            text: m.text
          }));

        const aiRes: AIResponse = await askFirstAidAssistant(
          textToSend,
          historyContext,
          (evt: FailSafeEvent) => {
            if (evt.type === 'attempt_start') {
              setFailSafeStatus({
                activeModelName: evt.displayName,
                tier: evt.tier,
                isSwitching: false,
                secondsElapsed: 0
              });
            } else if (evt.type === 'timeout_switch' || evt.type === 'error_switch') {
              setFailSafeStatus({
                activeModelName: evt.displayName,
                tier: evt.tier,
                isSwitching: true,
                switchReason: evt.reason,
                secondsElapsed: 0
              });
            } else if (evt.type === 'offline_fallback') {
              setFailSafeStatus({
                activeModelName: 'Offline Clinical Safe-Guard (Tier 5)',
                tier: 5,
                isSwitching: true,
                switchReason: 'All remote AI tiers timed out (>10s); activated local protocol',
                secondsElapsed: 0
              });
            }
          }
        );

        replyText = aiRes.text;
        isEmergency = aiRes.isEmergency;
        modelUsed = aiRes.modelUsed;
        modelDisplayName = aiRes.modelDisplayName;
        tierUsed = aiRes.tierUsed;
        latencyMs = aiRes.latencyMs;
        failSafeTriggered = aiRes.failSafeTriggered;
      }

      // Check for hospital or route keywords
      const isHospitalOrRouteQuery = /hospital|ambulance|route|doctor|clinic|er|emergency room|drive|distance|eta/i.test(textToSend);

      let facilityData: EmergencyFacility | undefined = undefined;
      let routeData: RouteComputationResult | undefined = undefined;

      if (isEmergency || isHospitalOrRouteQuery) {
        try {
          const dispatch = await getAutomaticEscalationDispatch();
          facilityData = dispatch.nearestHospital;
          routeData = dispatch.route;
        } catch (dispatchErr) {
          console.warn('Escalation dispatch lookup error in chat:', dispatchErr);
        }
      }

      const botMsgId = 'bot_' + Date.now();
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Automatically synthesize Paramedic Handout & QR Beacon for this chat exchange
      const handout = createParamedicHandout(
        botMsgId,
        textToSend || (videoToAnalyze ? 'Incident Video Clip' : 'Injury Photo Analysis'),
        replyText,
        botTimestamp,
        isEmergency,
        modelDisplayName,
        facilityData,
        userLocationInfo?.formattedAddress
      );

      // Synthesize Bystander Paradox Crowd Squad session for onlooker task delegation & crowd rescue
      const squadSession = createBystanderSquadSession(
        textToSend || (videoToAnalyze ? 'Incident Video Clip' : 'Injury Photo Analysis') || 'Emergency Scene Response',
        replyText,
        userLocationInfo?.formattedAddress,
        facilityData ? {
          name: facilityData.name,
          distance: routeData ? routeData.distanceText : `${facilityData.distanceKm || 2} km`,
          eta: routeData ? routeData.durationText : `${facilityData.etaMinutes || 8} mins`,
          phone: facilityData.phoneNumber || '112'
        } : undefined
      );
      createSquadSessionInFirestore(squadSession);

      const botMessage: ChatMessage = {
        id: botMsgId,
        sender: 'model',
        text: replyText,
        timestamp: botTimestamp,
        isEmergency,
        modelUsed,
        modelDisplayName,
        tierUsed,
        latencyMs,
        failSafeTriggered,
        facility: facilityData,
        route: routeData,
        forensicReport,
        handout,
        squadSession
      };

      setMessages((prev) => [...prev, botMessage]);

      if (autoTTS) {
        handleSpeak(replyText, botMsgId);
      }
    } catch (err: any) {
      const errorMsgId = 'err_' + Date.now();
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorText = `Unable to reach cloud AI service: ${err?.message || 'Network timeout'}.\n\n**Immediate emergency safety rules:** Ensure patient airway is open. Keep neck immobilized if head trauma occurred. If bleeding, apply firm direct pressure with clean cloth. Tap 112 SOS immediately if unresponsive.`;
      const errorHandout = createParamedicHandout(
        errorMsgId,
        textToSend || 'Emergency First-Aid Query',
        errorText,
        errorTimestamp,
        true,
        'Offline Emergency Protocol',
        undefined,
        userLocationInfo?.formattedAddress
      );
      const errorSquadSession = createBystanderSquadSession(
        textToSend || 'Emergency Incident',
        errorText,
        userLocationInfo?.formattedAddress
      );
      createSquadSessionInFirestore(errorSquadSession);

      const errorMsg: ChatMessage = {
        id: errorMsgId,
        sender: 'model',
        text: errorText,
        timestamp: errorTimestamp,
        isEmergency: true,
        modelUsed: 'offline-clinical-rules',
        modelDisplayName: 'Offline Emergency Protocol',
        handout: errorHandout,
        squadSession: errorSquadSession
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setVideoStatusText(null);
      setFailSafeStatus(null);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setSelectedVideo(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setSelectedVideo({
        file,
        name: file.name,
        previewUrl: url
      });
      setSelectedImage(null);
    }
  };

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by your current browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your current conversation history?')) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      setMessages([
        {
          id: 'welcome_reset',
          sender: 'model',
          text: "Conversation reset. What emergency or first-aid question do you need assistance with?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-flash-lite-latest',
          modelDisplayName: 'Gemini Flash-Lite (Tier 1)',
          tierUsed: 1
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 h-dvh-screen z-50 flex flex-col bg-base overflow-hidden select-text text-ink">
      
      {/* ======================================================== */}
      {/* 1. TOP FULL-SCREEN COMMAND BAR (ADAPTIVE WIDTH)          */}
      {/* ======================================================== */}
      <header className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 bg-surface/95 backdrop-blur-xl border-b border-border shrink-0 shadow-2xs z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left: Back Button & Wordmark */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-bold transition-colors btn-press shadow-2xs cursor-pointer border border-border/70 shrink-0"
                title="Return to Sanjeevani Hub"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span className="hidden xs:inline">Hub</span>
              </button>
            )}

            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary-dark text-white shadow-xs shrink-0">
                <Bot className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-accent" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 
                    className="text-sm sm:text-lg font-black tracking-tight text-[#0E5A50] dark:!text-emerald-400 truncate"
                    style={{ color: '#0E5A50' }}
                  >
                    Sanjeevani AI Guardian
                  </h1>
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-ink-muted truncate">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">AHA 2020 & AIIMS Guidelines</span>
                  {userLocationInfo && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className="hidden sm:inline hover:underline text-primary truncate max-w-[140px] md:max-w-xs cursor-pointer font-medium"
                        title="Click to update GPS location"
                      >
                        📍 {userLocationInfo.formattedAddress}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Tools: Voice Narration, Reset & 112 SOS */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* TTS Narration Toggle */}
            <button
              onClick={() => setAutoTTS(!autoTTS)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full border border-border text-xs font-semibold btn-press transition-colors flex items-center space-x-1.5 cursor-pointer ${
                autoTTS 
                  ? 'bg-primary/15 text-primary border-primary/30' 
                  : 'bg-base text-ink-muted hover:text-ink'
              }`}
              title={autoTTS ? 'Auto Voice Narration On' : 'Turn Auto Voice Narration On'}
            >
              {autoTTS ? <Volume2 className="w-3.5 h-3.5 text-primary" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px] font-bold">{autoTTS ? 'Voice Active' : 'Voice Off'}</span>
            </button>

            {/* Reset Conversation */}
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-full bg-base hover:bg-border/60 text-ink-muted hover:text-ink text-xs font-semibold btn-press transition-colors border border-border cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Emergency 112 SOS */}
            <button
              onClick={() => onTriggerEscalation('Direct emergency 112 button from full-screen AI guide')}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full btn-tactile-danger text-white text-[11px] sm:text-xs font-bold shadow-md cursor-pointer whitespace-nowrap"
              title="Dispatch Emergency 112"
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
              <span className="font-extrabold tracking-wide">112 SOS</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HORIZONTAL EMERGENCY QUICK SCENARIO PILLS             */}
      {/* ======================================================== */}
      <div className="w-full bg-surface/90 backdrop-blur-md border-b border-border/70 px-3 sm:px-6 lg:px-8 py-1.5 shrink-0 z-20">
        <div className="max-w-5xl mx-auto overflow-x-auto flex items-center space-x-2 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted shrink-0 mr-1 flex items-center space-x-1">
            <Zap className="w-3 h-3 text-accent" />
            <span>Quick Trauma:</span>
          </span>
          {quickScenarios.map((scen, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(scen.prompt)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1 rounded-full bg-base hover:bg-primary/15 hover:text-primary text-[11px] font-bold text-ink transition-all shadow-2xs cursor-pointer whitespace-nowrap border border-border/80 btn-press"
            >
              {scen.title}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ADAPTIVE CENTERED MESSAGE STREAM                      */}
      {/* ======================================================== */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pt-4 pb-36 sm:pb-44 scroll-smooth">
        <div className="max-w-5xl mx-auto w-full space-y-5">
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMessageId === msg.id;
            const isLatestBotMsg = !isUser && index === messages.length - 1;
            const isReadyForQRs = !isLatestBotMsg || completedMsgIds.has(msg.id);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 w-full animate-in fade-in duration-200`}
              >
                {/* Message Header Tag */}
                <div className="flex items-center space-x-2 px-2 text-[11px] text-ink-muted">
                  {isUser ? (
                    <>
                      <User className="w-3.5 h-3.5 text-ink-muted" />
                      <span className="font-semibold">You</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 text-accent" />
                      <span className="font-bold text-ink">Sanjeevani Guardian</span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1.5 flex-wrap">
                        {msg.latencyMs !== undefined && msg.latencyMs > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[9px]">
                            ⚡ {(msg.latencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        {msg.failSafeTriggered && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-[9px]">
                            Fail-Safe Protected
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Container — High Contrast, Accessible Typography */}
                <div
                  className={`w-full text-base sm:text-lg leading-relaxed transition-all ${
                    isUser
                      ? 'max-w-2xl !bg-[#0E5A50] !text-white rounded-[26px] p-5 sm:p-6 ml-auto shadow-md border border-[#0E5A50]/30'
                      : 'bg-transparent text-ink p-2 sm:p-4 mr-auto border-none space-y-4'
                  }`}
                  style={isUser ? { backgroundColor: '#0E5A50', color: '#FFFFFF' } : undefined}
                >
                  {/* Attached Image Preview */}
                  {msg.imagePreview && (
                    <div className="mb-4 overflow-hidden rounded-3xl max-w-xl shadow-md border-none">
                      <img
                        src={msg.imagePreview}
                        alt="Uploaded injury visual"
                        className="w-full h-auto max-h-96 object-cover rounded-3xl"
                      />
                    </div>
                  )}

                  {/* Attached Video Preview */}
                  {msg.videoPreview && (
                    <div className="mb-4 overflow-hidden rounded-3xl max-w-xl shadow-md bg-black border-none">
                      <video
                        src={msg.videoPreview}
                        controls
                        className="w-full h-auto max-h-80 rounded-3xl"
                      />
                      {msg.videoName && (
                        <div className="p-3 bg-black/70 text-xs font-mono text-white/90 flex items-center space-x-2">
                          <VideoIcon className="w-4 h-4 text-accent shrink-0" />
                          <span className="truncate">{msg.videoName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formatted Markdown Body with High Contrast Guarantee */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-bold !text-white selection:bg-accent selection:text-ink text-base sm:text-lg" style={{ color: '#FFFFFF' }}>{msg.text}</p>
                  ) : (
                    <div className="w-full">
                      <FormattedAIMessage
                        text={msg.text}
                        onTriggerEscalation={onTriggerEscalation}
                        animate={isLatestBotMsg && !completedMsgIds.has(msg.id)}
                        onComplete={() => {
                          setCompletedMsgIds((prev) => new Set(prev).add(msg.id));
                        }}
                      />
                    </div>
                  )}

                  {/* Recommended Protocol Banner */}
                  {!isUser && msg.forensicReport && onLaunchProtocol && (
                    <div className="mt-5 p-5 rounded-3xl bg-primary/10 flex items-center justify-between border-none shadow-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                          AI Recommended Protocol
                        </span>
                        <span className="text-base font-bold text-ink capitalize">
                          {msg.forensicReport.recommendedProtocolId} Emergency Protocol
                        </span>
                      </div>
                      <button
                        onClick={() => onLaunchProtocol(msg.forensicReport!.recommendedProtocolId)}
                        className="px-5 py-2.5 rounded-2xl btn-tactile-primary text-xs font-bold shadow-xs flex items-center space-x-1.5"
                      >
                        <span>Start Protocol</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Emergency 112 Hard-Stop Alert Banner */}
                  {msg.isEmergency && !isUser && (
                    <div className="mt-5 p-6 rounded-3xl bg-alert/15 text-alert flex items-start space-x-4 border-none shadow-xs">
                      <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5 text-alert" />
                      <div className="space-y-2.5 flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-alert">EMERGENCY ALERT: Immediate 112 Response Required</h4>
                        <p className="text-sm leading-relaxed text-alert/90">
                          Critical trauma red flags identified. Do not delay emergency ambulance dispatch if there is active hemorrhage, unresponsiveness, or respiratory failure.
                        </p>
                        <button
                          onClick={() => onTriggerEscalation('AI Chat Emergency Hard-Stop')}
                          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl btn-tactile-danger text-xs font-bold shadow-md"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Dispatch 112 Ambulance Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full-Width Emergency Route Map */}
                  {!isUser && msg.facility && msg.route && (
                    <div className="mt-6 rounded-3xl overflow-hidden border-none shadow-md">
                      <EmergencyRouteMap
                        facility={msg.facility}
                        route={msg.route}
                      />
                    </div>
                  )}

                  {/* Dual Emergency Action QR Codes: Bystander Squad + Paramedic SBAR Docket */}
                  {!isUser && isReadyForQRs && (msg.squadSession || msg.handout) && (
                    <div className="mt-5 pt-4 border-t-2 border-border/70 space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center space-x-2 text-xs font-black text-ink uppercase tracking-wider">
                          <div className="p-1 rounded-md bg-primary/15 text-primary">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <span>Dual Emergency Action QR Codes</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          Ready for Rescuers & Paramedics
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {msg.squadSession && (
                          <BystanderSquadCard
                            session={msg.squadSession}
                            defaultExpanded={true}
                          />
                        )}
                        {msg.handout && (
                          <ParamedicHandoutCard
                            handout={msg.handout}
                            defaultExpanded={true}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Footer Actions */}
                  {!isUser && (
                    <div className="mt-4 pt-3 flex items-center justify-between text-xs text-ink-muted">
                      <button
                        onClick={() => handleSpeak(msg.text, msg.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-base text-ink font-semibold btn-press transition-colors border-none"
                        title={isSpeaking ? 'Stop voice reading' : 'Listen to voice instructions'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4 text-alert" />
                            <span className="text-alert font-bold">Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-primary" />
                            <span>Listen to Voice Steps</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center space-x-1.5 text-xs text-ink-muted font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>AHA / AIIMS Clinical Standard</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator with Live Fail-Safe Telemetry */}
          {isLoading && (
            <div className="flex flex-col space-y-3 w-full animate-in fade-in duration-200">
              <div className="flex items-start space-x-3 w-full">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-ink shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5 text-accent animate-spin" />
                </div>
                <div className="space-y-1 py-1 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-sm font-bold text-ink">
                      {videoStatusText 
                        ? videoStatusText 
                        : failSafeStatus 
                          ? 'Evaluating clinical emergency protocols...'
                          : 'Formulating first-aid guidance...'}
                    </span>
                    {failSafeStatus && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-base border border-border text-ink-muted">
                        ⏱️ {Math.min(10, failSafeStatus.secondsElapsed)}s / 10s auto-guard
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">
                    Checking emergency priorities, contraindications, and nearest trauma center routing...
                  </p>
                </div>
              </div>

              {/* Dynamic Fail-Safe Switch Alert Banner */}
              {failSafeStatus?.isSwitching && (
                <div className="ml-12 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center space-x-3 animate-pulse">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold block">Auto Fail-Safe Activated (&gt;10s threshold reached)</span>
                    <span className="text-[11px] opacity-90">
                      Primary tier reached 10s limit. Now seamlessly routing to <strong>{failSafeStatus.activeModelName}</strong>...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom spacing buffer so cards NEVER get obscured by floating input dock */}
          <div className="h-20 w-full shrink-0" />
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ======================================================== */}
      {/* 4. EXPANSIVE ADAPTIVE FLOATING INPUT DOCK                */}
      {/* ======================================================== */}
      <footer className="w-full shrink-0 px-3 sm:px-6 lg:px-8 pt-2 pb-3 sm:pb-4 z-30 bg-gradient-to-t from-base via-base/95 to-transparent">
        <div className="max-w-5xl mx-auto space-y-2">
          
          {/* Active Attached Media Pill */}
          {(selectedImage || selectedVideo) && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface dark:bg-surface/80 shadow-md border-none animate-in fade-in duration-150">
              <div className="flex items-center space-x-3 min-w-0">
                {selectedImage && (
                  <img src={selectedImage} alt="Thumbnail" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                )}
                {selectedVideo && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-base text-xs font-mono text-ink min-w-0">
                    <VideoIcon className="w-4 h-4 text-accent shrink-0" />
                    <span className="truncate max-w-[160px] sm:max-w-xs">{selectedVideo.name}</span>
                  </div>
                )}
                <span className="text-xs font-bold text-ink truncate">
                  {selectedVideo ? 'Video Attached for Forensic Breakdown' : 'Injury Photo Attached'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedVideo(null);
                }}
                className="p-1.5 rounded-full hover:bg-base text-ink-muted hover:text-ink transition-colors shrink-0"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Elevated Floating Input Box */}
          <div className="rounded-2xl p-2 sm:p-3 bg-surface dark:bg-surface border border-border shadow-xl flex flex-col gap-2">
            <textarea
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe the emergency... (e.g., 'Toddler swallowed coin', 'Deep cut spurting blood')"
              style={{ color: '#0F172A' }}
              className="w-full bg-transparent focus:outline-none resize-none px-2.5 sm:px-3 py-1 text-sm sm:text-base text-[#0F172A] dark:!text-white placeholder:text-ink-muted leading-relaxed border-none font-medium max-h-28"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-border/60">
              
              {/* Media & Dictation Attachments */}
              <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
                
                {/* Photo Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-semibold btn-press transition-colors border border-border/60 cursor-pointer shrink-0"
                  title="Upload injury photo"
                >
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="hidden xs:inline sm:hidden">Photo</span>
                  <span className="hidden sm:inline">Attach Photo</span>
                </button>

                {/* Video Upload */}
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-semibold btn-press transition-colors border border-border/60 cursor-pointer shrink-0"
                  title="Upload incident video clip"
                >
                  <VideoIcon className="w-4 h-4 text-accent shrink-0" />
                  <span className="hidden xs:inline sm:hidden">Video</span>
                  <span className="hidden sm:inline">Incident Video</span>
                </button>

                {/* Voice Dictation */}
                <button
                  onClick={handleSpeechInput}
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold btn-press transition-colors border cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse font-bold'
                      : 'bg-base hover:bg-border/60 text-ink border-border/60'
                  }`}
                  title="Speak emergency symptoms"
                >
                  {isListening ? <MicOff className="w-4 h-4 text-red-500 shrink-0" /> : <Mic className="w-4 h-4 text-emerald-500 shrink-0" />}
                  <span className="hidden xs:inline sm:hidden">{isListening ? 'Stop' : 'Voice'}</span>
                  <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                </button>

                {/* Location Picker */}
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-base hover:bg-border/60 text-ink text-xs font-medium btn-press transition-colors border border-border/60 cursor-pointer shrink-0"
                  title="Set exact GPS location"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="hidden md:inline text-[11px]">Set GPS</span>
                </button>
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!inputQuery.trim() && !selectedImage && !selectedVideo)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                  isLoading || (!inputQuery.trim() && !selectedImage && !selectedVideo)
                    ? 'bg-base text-ink-muted/50 cursor-not-allowed border border-border/40'
                    : 'btn-tactile-accent text-ink'
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleMediaUpload}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleMediaUpload}
        className="hidden"
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChanged={(loc) => {
          setUserLocationInfo(loc);
          setIsLocationModalOpen(false);
        }}
      />

      {/* Header Quick-Trigger Paramedic Handout Modal */}
      {activeHandoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-3xl bg-surface border border-border text-ink shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary shrink-0 shadow-2xs">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-ink">
                      Paramedic Handout QR Beacon
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/15 text-primary">
                      #{activeHandoutModal.handoutId}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Offline SBAR Protocol Beacon • Scannable by arriving ambulance e-PCR
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveHandoutModal(null)}
                className="p-2 rounded-full bg-base hover:bg-border/60 text-ink-muted hover:text-ink btn-press cursor-pointer"
                title="Close Handout Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ParamedicHandoutCard
              handout={activeHandoutModal}
              defaultExpanded={true}
            />
          </div>
        </div>
      )}

      {/* Header Quick-Trigger Bystander Squad QR Beacon Modal */}
      {activeSquadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-3xl bg-surface border border-border text-ink shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-ink">
                      Bystander Squad QR Beacon
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      #{activeSquadModal.id}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Solve Bystander Paradox • Point any phone camera to assign emergency tasks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSquadModal(null)}
                className="p-2 rounded-full bg-base hover:bg-border/60 text-ink-muted hover:text-ink btn-press cursor-pointer"
                title="Close Squad Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <BystanderSquadCard
              session={activeSquadModal}
              defaultExpanded={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
