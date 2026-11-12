import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  HeartPulse,
  Droplet,
  ShieldAlert,
  Baby,
  Flame,
  Sun,
  Bone,
  AlertTriangle,
  Building2,
  ChevronDown,
  ArrowDown,
  QrCode
} from 'lucide-react';
import {
  streamFirstAidAssistant,
  matchOfflineProtocol,
  warmUpAIService,
  analyzeInjuryVisual,
  FailSafeEvent
} from '../../services/aiService';
import {
  extractFramesFromVideo,
  analyzeVideoIncident,
  VideoIncidentAnalysis
} from '../../services/videoAnalysisService';
import {
  getAutomaticEscalationDispatch,
  getUserLocationInfo,
  UserLocationInfo
} from '../../services/placesRoutesService';
import { LocationPickerModal } from '../common/LocationPickerModal';
import { createParamedicHandout } from '../../utils/handoutHelper';
import {
  createBystanderSquadSession,
  SquadTaskRole
} from '../../services/bystanderSquadEngine';
import {
  createSquadSessionInFirestore,
  subscribeToSquadSession
} from '../../firebase/db';
import { AppHeader } from '../common/AppHeader';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { Composer } from './Composer';
import { ScenarioGrid } from './ScenarioGrid';
import { RescueSidebar } from './RescueSidebar';
import { useChatScroll } from './useChatScroll';
import { downscaleImageFile } from '../../utils/mediaPreprocess';
import { perfMonitor } from '../../utils/perfMonitor';
import { PerfDebugOverlay } from './PerfDebugOverlay';
import {
  useAppLanguage,
  UI_TRANSLATIONS,
  getAppLanguageMeta,
  selectBestVoiceForLanguage
} from '../../utils/languageStore';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

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
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const langMeta = getAppLanguageMeta(lang);

  const [messages, setMessages] = useState<ChatMessageData[]>(() => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const initialSession = createBystanderSquadSession(
      'cardiac_cpr',
      'First-Aid Standby & Scene Triage Readiness — Bystander Task Delegation Active',
      'Current Emergency Scene'
    );
    createSquadSessionInFirestore(initialSession);
    return [
      {
        id: 'welcome',
        sender: 'model',
        text: "Namaste! I am your Sanjeevani AI First-Aid Guardian, built on AHA 2020 and AIIMS Emergency Medicine guidelines.\n\nAsk any urgent first-aid question, speak your symptoms with the microphone, or attach an injury photo or incident video. I provide immediate 1-2-3 steps, contraindication warnings, and live hospital route navigation.\n\nIf the victim is unconscious or not breathing, tap 112 SOS immediately.",
        timestamp: nowTime,
        modelUsed: 'gemini-flash-lite-latest',
        modelDisplayName: 'Gemini Flash-Lite (Tier 1)',
        tierUsed: 1,
        handout: createParamedicHandout(
          'welcome',
          'First-Aid Standby & Scene Triage Readiness',
          "**Immediate Priority:** Check responsiveness, open airway, and verify breathing before moving.\n\n**Immediate Action Steps:**\n1. Verify scene safety for yourself and patient.\n2. Tap shoulders and shout to assess responsiveness.\n3. Call 112 if unresponsive or irregular agonal gasping.\n\n**CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**\n* Do not give water or oral fluids to drowsy patients.\n* Do not manipulate head/neck if trauma is suspected.",
          nowTime,
          false,
          'Clinical AI'
        ),
        squadSession: initialSession
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingRevision, setStreamingRevision] = useState(0);
  const [composerHeight, setComposerHeight] = useState(64);
  const [failSafeStatus, setFailSafeStatus] = useState<{
    activeModelName: string;
    tier: number;
    isSwitching: boolean;
    switchReason?: string;
    secondsElapsed: number;
  } | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    file: File;
    name: string;
    previewUrl: string;
  } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userLocationInfo, setUserLocationInfo] = useState<UserLocationInfo | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [completedMsgIds, setCompletedMsgIds] = useState<Set<string>>(
    () => new Set(['welcome'])
  );
  const [showHowThisWorks, setShowHowThisWorks] = useState(false);

  // Rescue Toolkit Bottom Sheet State (<1280px)
  const [isToolkitSheetOpen, setIsToolkitSheetOpen] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(5);

  // Determine whether we are in the idle state (only initial welcome message present)
  const isEmptyConversation =
    messages.length === 1 && messages[0].id === 'welcome' && !isLoading;

  const conversationMessages = isEmptyConversation
    ? []
    : messages.filter((m) => m.id !== 'welcome');

  // Derive latest handout and squad session from messages stream
  const latestHandout = [...messages].reverse().find((m) => m.handout)?.handout;
  const latestSquadSession = [...messages].reverse().find((m) => m.squadSession)?.squadSession;
  const latestBotMessage = [...messages].reverse().find((m) => m.sender === 'model');
  const latestConversationBotId =
    [...conversationMessages].reverse().find((m) => m.sender === 'model')?.id || null;
  const isOfflineEngineActive = Boolean(
    latestBotMessage?.modelUsed?.includes('offline')
  );

  const {
    scrollerRef,
    showJumpToLatest,
    handleScroll,
    jumpToLatest
  } = useChatScroll({
    latestAssistantId: latestConversationBotId,
    streamingRevision,
    isConversationEmpty: isEmptyConversation
  });

  // Warm up AI proxy, pre-resolve user location, and enforce non-scrolling document shell (A.1 & G.8)
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    warmUpAIService();
    getUserLocationInfo().then(setUserLocationInfo);

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Keep task counts in sync with latest squad session & Firestore updates
  useEffect(() => {
    if (!latestSquadSession) return;
    const initialRoles = Object.values(latestSquadSession.roles || {}) as SquadTaskRole[];
    setTotalTasksCount(initialRoles.length || 5);
    setCompletedTasksCount(
      initialRoles.filter((r) => r.status === 'completed').length
    );

    if (!latestSquadSession.id) return;
    const unsub = subscribeToSquadSession(latestSquadSession.id, (updated) => {
      const roles = Object.values(updated.roles || {}) as SquadTaskRole[];
      setTotalTasksCount(roles.length || 5);
      setCompletedTasksCount(
        roles.filter((r) => r.status === 'completed').length
      );
    });
    return () => unsub();
  }, [latestSquadSession]);

  // Live timer for elapsed seconds (shown after 3s on skeleton)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      timer = setInterval(() => {
        setFailSafeStatus((prev) => {
          const nextElapsed = (prev?.secondsElapsed || 0) + 1;
          setMessages((msgs) =>
            msgs.map((m) =>
              m.isStreaming ? { ...m, streamingElapsedSeconds: nextElapsed } : m
            )
          );
          return prev ? { ...prev, secondsElapsed: nextElapsed } : null;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const quickScenarios = [
    {
      label: copy.scenarios.cpr,
      icon: <HeartPulse className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Unresponsive person not breathing normally. Start CPR guidance immediately.'
    },
    {
      label: copy.scenarios.bleeding,
      icon: <Droplet className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Heavy arterial bleeding won’t stop. Guide me on direct pressure and tourniquet application.'
    },
    {
      label: copy.scenarios.snakeBite,
      icon: <ShieldAlert className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Snake bite with puncture wounds, swelling and pain. Where is nearest Anti-Snake Venom (ASV) and what are safe first-aid steps?'
    },
    {
      label: copy.scenarios.choking,
      icon: <Baby className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Toddler or child is choking on food or small object and cannot make sound. Guide back blows and chest thrusts.'
    },
    {
      label: copy.scenarios.burn,
      icon: <Flame className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Severe boiling water burn with skin peeling and severe pain. How to cool and protect the wound?'
    },
    {
      label: copy.scenarios.heatstroke,
      icon: <Sun className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Person with high fever, hot dry skin, confusion, and dizziness from severe heat exhaustion or heatstroke.'
    },
    {
      label: copy.scenarios.fracture,
      icon: <Bone className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Suspected broken arm or leg bone with deformity and inability to bear weight. How do I immobilize it?'
    },
    {
      label: copy.scenarios.anaphylaxis,
      icon: <AlertTriangle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'Severe allergic reaction, throat swelling, difficulty swallowing, rapid hives. Immediate first aid steps.'
    },
    {
      label: copy.scenarios.hospitalRoute,
      icon: <Building2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />,
      prompt: 'What is the nearest emergency hospital and live driving route right now?'
    }
  ];

  const handleSpeak = useCallback((text: string, msgId: string) => {
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
    utterance.lang = langMeta.bcp47;
    utterance.rate = lang === 'en' ? 0.95 : 0.92;
    utterance.pitch = 1.0;

    const bestVoice = selectBestVoiceForLanguage(lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId, lang, langMeta.bcp47]);

  const handleSendMessage = async (queryText?: string, existingBotMsgId?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend && !selectedImage && !selectedVideo) return;

    // G.1: Mark send timestamp
    perfMonitor.markSend(
      textToSend || (selectedVideo ? 'video_analysis' : 'image_analysis')
    );

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const userMsgId = 'user_' + Date.now();
    const botMsgId = existingBotMsgId || 'bot_' + (Date.now() + 1);

    const imageToAnalyze = selectedImage;
    const videoToAnalyze = selectedVideo;

    // G.3: Instant offline protocol match (<100ms) for recognized scenario buttons & free text
    const rawOfflineMatch =
      !imageToAnalyze && !videoToAnalyze && textToSend
        ? matchOfflineProtocol(textToSend)
        : null;
    const matchedOffline = rawOfflineMatch?.matched ? rawOfflineMatch : null;

    // Determine whether we should look up hospital/route in parallel
    const shouldLookupHospital =
      Boolean(matchedOffline?.isEmergency) ||
      /\b(hospital|ambulance|route|doctor|clinic|er|emergency)\b|bleed|burn|bite|chok|unconscious|not breathing|cpr|collapse|heart|stroke|fracture|broken|allergic|shock|seizure|poison|head|trauma|accident/i.test(
        textToSend
      ) ||
      Boolean(imageToAnalyze) ||
      Boolean(videoToAnalyze);

    if (existingBotMsgId) {
      // Retry in-place on existing message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === existingBotMsgId
            ? {
                ...m,
                isStreaming: true,
                streamingElapsedSeconds: 0,
                aiSlowNotice: false
              }
            : m
        )
      );
    } else {
      const userMessage: ChatMessageData = {
        id: userMsgId,
        sender: 'user',
        text:
          textToSend ||
          (videoToAnalyze
            ? 'Attached emergency incident video clip'
            : 'Attached injury photograph for analysis'),
        timestamp: nowTime,
        imagePreview: imageToAnalyze || undefined,
        videoPreview: videoToAnalyze?.previewUrl || undefined,
        videoName: videoToAnalyze?.name || undefined
      };

      const initialBotMessage: ChatMessageData = {
        id: botMsgId,
        sender: 'model',
        text: '',
        timestamp: nowTime,
        isEmergency: Boolean(matchedOffline?.isEmergency),
        isStreaming: true,
        streamingElapsedSeconds: 0,
        offlineProtocolText: matchedOffline?.text,
        offlineProtocolTitle: matchedOffline?.protocolTitle,
        isHospitalLoading: shouldLookupHospital,
        userQueryForRetry: textToSend || undefined
      };

      // G.2 & G.3: Render user message + assistant placeholder/offline protocol immediately without blocking on QR generation
      setMessages((prev) => [...prev, userMessage, initialBotMessage]);
    }

    setInputQuery('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setIsLoading(true);
    setFailSafeStatus({
      activeModelName: 'Gemini Flash-Lite (Tier 1)',
      tier: 1,
      isSwitching: false,
      secondsElapsed: 0
    });

    // Record paint marks on next frame (<100ms) and then synthesize QR beacons asynchronously
    let initialSquadSession: ReturnType<typeof createBystanderSquadSession> | undefined;
    requestAnimationFrame(() => {
      perfMonitor.markSkeletonPainted();
      if (matchedOffline) {
        perfMonitor.markOfflineProtocolPainted();
      }
      if (matchedOffline && !existingBotMsgId) {
        setTimeout(() => {
          const handout = createParamedicHandout(
            botMsgId,
            textToSend,
            matchedOffline.text,
            nowTime,
            matchedOffline.isEmergency,
            'Offline Verified Protocol',
            undefined,
            userLocationInfo?.formattedAddress
          );
          const squad = createBystanderSquadSession(
            textToSend,
            matchedOffline.text,
            userLocationInfo?.formattedAddress
          );
          initialSquadSession = squad;
          createSquadSessionInFirestore(squad);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    handout: m.handout || handout,
                    squadSession: m.squadSession || squad
                  }
                : m
            )
          );
        }, 0);
      }
    });

    // G.7: Run hospital/route lookup in PARALLEL so it never blocks text steps
    if (shouldLookupHospital && !existingBotMsgId) {
      (async () => {
        try {
          perfMonitor.markHospitalStart();
          const dispatch = await getAutomaticEscalationDispatch();
          perfMonitor.markHospitalComplete(true);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    facility: dispatch.nearestHospital,
                    route: dispatch.route,
                    isHospitalLoading: false
                  }
                : m
            )
          );
        } catch (err) {
          console.warn('Parallel hospital lookup error:', err);
          perfMonitor.markHospitalComplete(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, isHospitalLoading: false } : m
            )
          );
        }
      })();
    }

    try {
      // 1. VIDEO FORENSIC MULTIMODAL PATH
      if (videoToAnalyze) {
        perfMonitor.markTierStart(1, 'clinical-video-forensics');
        const { frames, durationSeconds } = await extractFramesFromVideo(
          videoToAnalyze.file,
          6
        );
        const forensicReport: VideoIncidentAnalysis = await analyzeVideoIncident(
          frames,
          videoToAnalyze.file.name,
          durationSeconds
        );
        const usedModel = forensicReport.modelUsed || 'clinical-video-forensics';
        perfMonitor.markFirstToken(1, usedModel);

        const replyText =
          forensicReport.whatHappenedSummary +
          '\n\n**Immediate Action Steps:**\n' +
          forensicReport.immediateActions.map((act, i) => `${i + 1}. ${act}`).join('\n') +
          '\n\n**Avoid (What NOT to Do):**\n* Do not move the victim unnecessarily or give oral fluids until airway is verified.\n\n**Call 112 Immediately If:**\n* Victim is unresponsive, not breathing normally, or bleeding heavily.';

        const isEmergency = forensicReport.urgencyLevel === 'CRITICAL_112';
        const handout = createParamedicHandout(
          botMsgId,
          'Incident Video Clip',
          replyText,
          nowTime,
          isEmergency,
          'Clinical Multimodal Forensics',
          undefined,
          userLocationInfo?.formattedAddress
        );
        const squadSession = createBystanderSquadSession(
          'Incident Video Clip',
          replyText,
          userLocationInfo?.formattedAddress
        );
        createSquadSessionInFirestore(squadSession);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: replyText,
                  isStreaming: false,
                  isEmergency,
                  modelUsed: usedModel,
                  modelDisplayName: 'Clinical Multimodal Forensics',
                  forensicReport,
                  handout,
                  squadSession
                }
              : m
          )
        );
        perfMonitor.markTierComplete(1, usedModel);
      }
      // 2. IMAGE VISUAL ANALYSIS PATH
      else if (imageToAnalyze) {
        perfMonitor.markTierStart(1, 'clinical-vision');
        const visionResult = await analyzeInjuryVisual(
          imageToAnalyze,
          textToSend ||
            'Evaluate this injury visual, state priority action and contraindications'
        );
        const usedModel = visionResult.modelUsed || 'clinical-vision';
        perfMonitor.markFirstToken(1, usedModel);

        const replyText =
          `**Immediate Action Steps:**\n` +
          visionResult.actionSteps
            .slice(0, 6)
            .map((s, idx) => {
              const parts = s.split(':');
              const stepTitle =
                parts.length > 1
                  ? parts[0].replace(/^\d+[.\s]*/, '').trim()
                  : `Step ${idx + 1}`;
              const stepContent =
                parts.length > 1
                  ? parts.slice(1).join(':').trim()
                  : s.replace(/^\d+[.\s]*/, '').trim();
              return `${idx + 1}. **${stepTitle}:** ${stepContent}`;
            })
            .join('\n') +
          `\n\n**Avoid (What NOT to Do):**\n` +
          visionResult.whatNotToDo.map((w) => `* ${w}`).join('\n') +
          (visionResult.isHardStop
            ? `\n\n**Call 112 Immediately If:**\n* Severe trauma, deep burns, active hemorrhage, or breathing difficulty.`
            : '');

        const isEmergency = visionResult.isHardStop;
        const handout = createParamedicHandout(
          botMsgId,
          'Injury Photo Analysis',
          replyText,
          nowTime,
          isEmergency,
          'Clinical Vision',
          undefined,
          userLocationInfo?.formattedAddress
        );
        const squadSession = createBystanderSquadSession(
          'Injury Photo Analysis',
          replyText,
          userLocationInfo?.formattedAddress
        );
        createSquadSessionInFirestore(squadSession);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: replyText,
                  isStreaming: false,
                  isEmergency,
                  modelUsed: usedModel,
                  modelDisplayName: 'Clinical Vision',
                  latencyMs: visionResult.latencyMs || 0,
                  handout,
                  squadSession
                }
              : m
          )
        );
        perfMonitor.markTierComplete(1, usedModel);
      }
      // 3. STREAMING TEXT FIRST-AID PATH (G.4 + G.5 + G.6)
      else {
        const historyContext = messages
          .filter((m) => m.id !== 'welcome' && m.id !== 'welcome_reset' && m.text)
          .slice(-4)
          .map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('model' as const),
            text: m.text
          }));

        let latestStreamedText = '';
        let rafId: number | null = null;

        const flushStreamedText = () => {
          rafId = null;
          const snapshot = latestStreamedText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, text: snapshot } : m
            )
          );
          setStreamingRevision((r) => r + 1);
        };

        const aiRes = await streamFirstAidAssistant({
          userQuery: textToSend,
          history: historyContext,
          onToken: (accumulatedText: string) => {
            latestStreamedText = accumulatedText;
            if (rafId === null) {
              rafId = requestAnimationFrame(flushStreamedText);
            }
          },
          onTierStart: (tier, modelId) => {
            perfMonitor.markTierStart(tier, modelId);
          },
          onFirstToken: (tier, modelId) => {
            perfMonitor.markFirstToken(tier, modelId);
          },
          onTierComplete: (tier, modelId) => {
            perfMonitor.markTierComplete(tier, modelId);
          },
          onTierAbortedOrFailed: (tier, modelId, status, reason) => {
            perfMonitor.markTierAbortedOrFailed(tier, modelId, status, reason);
          },
          onFailSafeEvent: (evt: FailSafeEvent) => {
            if (evt.type === 'attempt_start') {
              setFailSafeStatus((prev) => ({
                activeModelName: evt.displayName,
                tier: evt.tier,
                isSwitching: false,
                secondsElapsed: prev?.secondsElapsed || 0
              }));
            } else if (evt.type === 'timeout_switch' || evt.type === 'error_switch') {
              setFailSafeStatus((prev) => ({
                activeModelName: evt.displayName,
                tier: evt.tier,
                isSwitching: true,
                switchReason: evt.reason,
                secondsElapsed: prev?.secondsElapsed || 0
              }));
            } else if (evt.type === 'offline_fallback') {
              setFailSafeStatus((prev) => ({
                activeModelName: 'Offline Emergency Protocol (Tier 5)',
                tier: 5,
                isSwitching: true,
                switchReason: evt.reason,
                secondsElapsed: prev?.secondsElapsed || 0
              }));
            }
          }
        });

        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        const isTimedOutOrOffline = Boolean(
          aiRes.timedOutToOffline || aiRes.modelUsed === 'offline-safe-guide'
        );

        // If AI timed out at 8s or browser is offline:
        // Keep the offline protocol on screen and show "AI is slow, showing offline protocol" + Retry
        const ensuredOfflineText =
          matchedOffline?.text ||
          (isTimedOutOrOffline ? matchOfflineProtocol(textToSend).text : undefined);

        const finalAiText = isTimedOutOrOffline
          ? latestStreamedText // empty if nothing arrived in 8s, so offline protocol remains primary
          : aiRes.text;

        const effectiveClinicalText =
          finalAiText || ensuredOfflineText || aiRes.text;
        const isEmergency = Boolean(
          matchedOffline?.isEmergency || aiRes.isEmergency || isTimedOutOrOffline
        );

        const handout = createParamedicHandout(
          botMsgId,
          textToSend,
          effectiveClinicalText,
          nowTime,
          isEmergency,
          aiRes.modelDisplayName,
          undefined,
          userLocationInfo?.formattedAddress
        );

        const squadSession =
          initialSquadSession ||
          createBystanderSquadSession(
            textToSend,
            effectiveClinicalText,
            userLocationInfo?.formattedAddress
          );
        if (!initialSquadSession) {
          createSquadSessionInFirestore(squadSession);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: finalAiText,
                  offlineProtocolText: m.offlineProtocolText || ensuredOfflineText,
                  offlineProtocolTitle:
                    m.offlineProtocolTitle || matchedOffline?.protocolTitle,
                  isStreaming: false,
                  isEmergency,
                  modelUsed: aiRes.modelUsed,
                  modelDisplayName: aiRes.modelDisplayName,
                  tierUsed: aiRes.tierUsed,
                  latencyMs: aiRes.latencyMs,
                  failSafeTriggered: aiRes.failSafeTriggered,
                  aiSlowNotice: isTimedOutOrOffline,
                  userQueryForRetry: textToSend,
                  handout,
                  squadSession
                }
              : m
          )
        );
        setStreamingRevision((r) => r + 1);

        if (autoTTS && effectiveClinicalText) {
          handleSpeak(effectiveClinicalText, botMsgId);
        }
      }
    } catch (err: unknown) {
      console.warn('Error in handleSendMessage:', err);
      const fallbackProtocol =
        matchedOffline || matchOfflineProtocol(textToSend || 'cpr unresponsive');

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: '',
                offlineProtocolText:
                  m.offlineProtocolText || fallbackProtocol.text,
                offlineProtocolTitle:
                  m.offlineProtocolTitle || fallbackProtocol.protocolTitle,
                isStreaming: false,
                isEmergency: true,
                aiSlowNotice: true,
                userQueryForRetry: textToSend,
                modelUsed: 'offline-clinical-rules',
                modelDisplayName: 'Offline Emergency Protocol'
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setFailSafeStatus(null);
    }
  };

  // Handle initial query if passed
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, []);

  // G.8: Downscale uploaded photos to <= 1024px JPEG ~0.7 before sending
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        const downscaledDataUrl = await downscaleImageFile(file, 1024, 0.72);
        setSelectedImage(downscaledDataUrl);
        setSelectedVideo(null);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
          setSelectedVideo(null);
        };
        reader.readAsDataURL(file);
      }
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
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition || typeof SpeechRecognition !== 'function') {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognition as new () => {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      })();
      recognition.lang = langMeta.bcp47;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setShowHowThisWorks(false);
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const freshSession = createBystanderSquadSession(
      'cardiac_cpr',
      'First-Aid Standby & Scene Triage Readiness — Bystander Task Delegation Active',
      'Current Emergency Scene'
    );
    createSquadSessionInFirestore(freshSession);
    setMessages([
      {
        id: 'welcome',
        sender: 'model',
        text: "Namaste! I am your Sanjeevani AI First-Aid Guardian, built on AHA 2020 and AIIMS Emergency Medicine guidelines.\n\nAsk any urgent first-aid question, speak your symptoms with the microphone, or attach an injury photo or incident video. I provide immediate 1-2-3 steps, contraindication warnings, and live hospital route navigation.\n\nIf the victim is unconscious or not breathing, tap 112 SOS immediately.",
        timestamp: nowTime,
        modelUsed: 'gemini-flash-lite-latest',
        modelDisplayName: 'Gemini Flash-Lite (Tier 1)',
        tierUsed: 1,
        handout: createParamedicHandout(
          'welcome',
          'First-Aid Standby & Scene Triage Readiness',
          "**Immediate Priority:** Check responsiveness, open airway, and verify breathing before moving.\n\n**Immediate Action Steps:**\n1. Verify scene safety for yourself and patient.\n2. Tap shoulders and shout to assess responsiveness.\n3. Call 112 if unresponsive or irregular agonal gasping.\n\n**CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**\n* Do not give water or oral fluids to drowsy patients.\n* Do not manipulate head/neck if trauma is suspected.",
          nowTime,
          false,
          'Clinical AI'
        ),
        squadSession: freshSession
      }
    ]);
  };

  const bottomPadPx = composerHeight + 16;

  return (
    <div className="fixed inset-0 w-full max-w-full h-dvh z-50 flex flex-col bg-surface overflow-hidden select-text text-ink">
      {/* ======================================================== */}
      {/* 1. SHARED APP HEADER (<= 56px, 40px buttons)             */}
      {/* ======================================================== */}
      <AppHeader
        mode="guardian"
        title="Sanjeevani AI Guardian"
        isOfflineEngine={isOfflineEngineActive}
        autoTTS={autoTTS}
        onToggleAutoTTS={() => setAutoTTS((prev) => !prev)}
        onResetConversation={handleClearHistory}
        onBackToHome={onBackToHome}
        onTriggerEscalation={onTriggerEscalation}
        locationInfoOverride={userLocationInfo}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        runningTimerText={
          isLoading && failSafeStatus && failSafeStatus.secondsElapsed >= 3
            ? `${failSafeStatus.secondsElapsed}s`
            : null
        }
      />

      {/* ======================================================== */}
      {/* 2. BODY: FLAT CHAT COLUMN (max-w-3xl) + RIGHT SIDEBAR    */}
      {/* ======================================================== */}
      <div className="flex flex-1 min-w-0 min-h-0 w-full max-w-full overflow-hidden bg-surface">
        {/* Main Column: [chat scroller | composer] flex column */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 w-full max-w-full h-full overflow-hidden bg-surface relative">
          {/* Chat Scroller Wrapper with 16px top/bottom fade masks */}
          <div className="relative flex-1 min-w-0 min-h-0 w-full flex flex-col overflow-hidden">
            {/* Top 16px fade mask */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-surface to-transparent z-10"
            />

            {/* SCROLL CONTAINER #1: Chat Scroller */}
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              role="log"
              aria-live="polite"
              aria-label="First-aid conversation"
              style={{
                paddingBottom: `${bottomPadPx}px`,
                scrollPaddingBottom: `${bottomPadPx}px`
              }}
              className="flex-1 min-w-0 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden px-3.5 sm:px-6 pt-3"
            >
              {isEmptyConversation ? (
                /* ======================================================== */
                /* IDLE STATE: max-w-3xl, 6 Scenario Buttons + Examples     */
                /* ======================================================== */
                <div className="min-h-full max-w-3xl mx-auto w-full min-w-0 flex flex-col justify-start sm:justify-center py-2 space-y-3.5 sm:space-y-4">
                  {/* 5-Language Voice & Protocol Toggle Bar (English · हिंदी · বাংলা · தமிழ் · मराठी) */}
                  <LanguageSwitcher variant="bar" showVoicePreview />

                  <div className="space-y-2.5 min-w-0 w-full">
                    <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                      <h2 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-ink leading-tight">
                        {copy.whatsTheEmergency}
                      </h2>

                      {/* <1280px Rescue Toolkit trigger chip */}
                      <button
                        type="button"
                        onClick={() => setIsToolkitSheetOpen(true)}
                        className="xl:hidden min-h-[38px] sm:min-h-[40px] px-3 rounded-xl bg-base border border-border text-[13px] sm:text-[14px] font-semibold text-ink inline-flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <QrCode className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                        <span>
                          {copy.rescueToolkit} · {completedTasksCount}/{totalTasksCount}
                        </span>
                      </button>
                    </div>

                    {/* Non-Dismissible Safety Notice */}
                    <div
                      role="note"
                      aria-label="Critical emergency notice"
                      className="rounded-xl bg-base border border-border px-3 py-2 flex items-start sm:items-center gap-2.5 text-[14px] sm:text-[15px] text-ink-muted min-w-0 w-full"
                    >
                      <PhoneCall
                        className="w-4 h-4 text-alert shrink-0 mt-0.5 sm:mt-0"
                        aria-hidden="true"
                      />
                      <p className="leading-snug min-w-0 flex-1 break-words">
                        {copy.sosNoticePrefix}{' '}
                        <strong className="font-bold text-ink">{copy.sosNoticeStrong}</strong>{' '}
                        {copy.sosNoticeSuffix}
                      </p>
                    </div>

                    {/* Welcome Sentence + "How this works" Disclosure */}
                    <div className="text-[15px] sm:text-[16px] text-ink-muted leading-relaxed min-w-0 w-full">
                      <p className="break-words">
                        {copy.guardianWelcome}{' '}
                        <button
                          type="button"
                          onClick={() => setShowHowThisWorks((prev) => !prev)}
                          aria-expanded={showHowThisWorks}
                          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                        >
                          <span>{showHowThisWorks ? copy.hideDetails : copy.howThisWorks}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-150 ${
                              showHowThisWorks ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      </p>

                      {showHowThisWorks && (
                        <p className="mt-2 p-3 rounded-xl bg-base border border-border text-[14px] sm:text-[15px] text-ink-muted leading-relaxed break-words">
                          {copy.howThisWorksDetail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Six Scenario Buttons in 2 Columns */}
                  <ScenarioGrid
                    scenarios={quickScenarios.slice(0, 6)}
                    onSelect={(prompt) => handleSendMessage(prompt)}
                    disabled={isLoading}
                  />
                </div>
              ) : (
                /* ======================================================== */
                /* CONVERSATION STATE: Flat surface, max-w-3xl, 16-24px pad */
                /* ======================================================== */
                <div className="max-w-3xl mx-auto w-full min-w-0 space-y-5 py-1">
                  {/* 5-Language Voice & Protocol Toggle Bar */}
                  <LanguageSwitcher variant="bar" showVoicePreview />

                  {/* Non-Dismissible Safety Notice + <1280px Toolkit Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                    <div
                      role="note"
                      aria-label="Critical emergency notice"
                      className="rounded-xl bg-base border border-border px-3 py-1.5 flex items-start sm:items-center gap-2 text-[14px] sm:text-[15px] text-ink-muted min-w-0 flex-1"
                    >
                      <PhoneCall
                        className="w-4 h-4 text-alert shrink-0 mt-0.5 sm:mt-0"
                        aria-hidden="true"
                      />
                      <p className="leading-snug min-w-0 flex-1 break-words">
                        {copy.sosNoticePrefix}{' '}
                        <strong className="font-bold text-ink">{copy.sosNoticeStrong}</strong>{' '}
                        {copy.sosNoticeSuffix}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsToolkitSheetOpen(true)}
                      className="xl:hidden min-h-[36px] px-2.5 rounded-lg bg-base border border-border text-[14px] font-semibold text-ink inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <QrCode className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span>
                        {copy.rescueToolkit} ({completedTasksCount}/{totalTasksCount})
                      </span>
                    </button>
                  </div>

                  {/* Active Conversation Stream */}
                  {conversationMessages.map((msg, index) => {
                    const isLatestBotMsg =
                      msg.sender === 'model' &&
                      index === conversationMessages.length - 1;
                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        isLatestBotMsg={isLatestBotMsg}
                        isCompleted={completedMsgIds.has(msg.id)}
                        onMarkCompleted={(id) =>
                          setCompletedMsgIds((prev) => new Set(prev).add(id))
                        }
                        isSpeaking={speakingMessageId === msg.id}
                        onSpeak={handleSpeak}
                        onTriggerEscalation={onTriggerEscalation}
                        onLaunchProtocol={onLaunchProtocol}
                        onOpenToolkit={() => setIsToolkitSheetOpen(true)}
                        onRetryQuery={(q, msgId) => handleSendMessage(q, msgId)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom 16px fade mask */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-surface to-transparent z-10"
            />

            {/* "Jump to latest" pill when streaming/new content lands off-screen */}
            {showJumpToLatest && (
              <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center z-20">
                <button
                  type="button"
                  onClick={jumpToLatest}
                  className="pointer-events-auto min-h-[36px] px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold shadow-md inline-flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Jump to latest</span>
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. SINGLE-ROW COMPOSER (<= 72px when idle)               */}
          {/* ======================================================== */}
          <Composer
            value={inputQuery}
            onChange={setInputQuery}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            isListening={isListening}
            onToggleSpeech={handleSpeechInput}
            selectedImage={selectedImage}
            selectedVideo={selectedVideo}
            onClearMedia={() => {
              setSelectedImage(null);
              setSelectedVideo(null);
            }}
            onTriggerImageSelect={() => fileInputRef.current?.click()}
            onTriggerVideoSelect={() => videoInputRef.current?.click()}
            scenarios={quickScenarios}
            onSelectScenario={(prompt) => handleSendMessage(prompt)}
            onHeightChange={setComposerHeight}
          />
        </main>

        {/* Right Sidebar (330px fixed on >=1280px, collapsible to 56px rail) */}
        <RescueSidebar
          variant="sidebar"
          squadSession={latestSquadSession}
          handout={latestHandout}
        />
      </div>

      {/* Tablet & Mobile Bottom Sheet (< 1280px) */}
      <RescueSidebar
        variant="sheet"
        isOpen={isToolkitSheetOpen}
        onClose={() => setIsToolkitSheetOpen(false)}
        squadSession={latestSquadSession}
        handout={latestHandout}
      />

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

      {/* Location Picker Modal (triggered from the single header GPS chip) */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChanged={(loc) => {
          setUserLocationInfo(loc);
          setIsLocationModalOpen(false);
        }}
      />

      {/* Dev-only Latency & Viewport Budget Overlay (?debug=1) */}
      <PerfDebugOverlay />
    </div>
  );
};
