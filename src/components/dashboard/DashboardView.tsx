import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Scan, 
  BookOpen, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Flame, 
  Droplet, 
  HeartPulse, 
  ShieldAlert, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Copy, 
  Download, 
  Edit3, 
  Shield, 
  Star, 
  Compass, 
  Check, 
  HelpCircle,
  Activity,
  FileText,
  Bot,
  Bookmark,
  ExternalLink,
  PhoneCall,
  TrendingUp,
  AlertTriangle,
  History,
  Users,
  Radar,
  Navigation,
  MapPin,
  Car
} from 'lucide-react';
import { Destination, InjuryProtocolId, IncidentLog, LibraryEntry } from '../../types';
import { useAuth } from '../../firebase/authContext';
import { Tilt3D } from '../common/Tilt3D';
import { LeafBorder } from '../common/LeafBorder';
import { userService, UserStats } from '../../services/userService';
import { LIBRARY_ENTRIES } from '../../data/libraryData';
import { CrowdCommanderModal } from '../crowd/CrowdCommanderModal';
import { EmergencyRadarModal } from '../radar/EmergencyRadarModal';
import { ParamedicHandoverModal } from '../respond/ParamedicHandoverModal';
import { 
  getAutomaticEscalationDispatch, 
  getUserLocationInfo, 
  UserLocationInfo, 
  EmergencyFacility, 
  RouteComputationResult 
} from '../../services/placesRoutesService';
import { EmergencyRouteMap } from '../common/EmergencyRouteMap';
import { LocationPickerModal } from '../common/LocationPickerModal';

interface DashboardViewProps {
  onSelectDestination: (dest: Destination) => void;
  onStartRespond: (protocolId?: string) => void;
  onViewLandingPage: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectDestination,
  onStartRespond,
  onViewLandingPage
}) => {
  const { user, userProfile } = useAuth();

  // Dynamic user data synchronized from central service
  const [userStats, setUserStats] = useState<UserStats>(() => userService.getStats());
  const [incidents, setIncidents] = useState<IncidentLog[]>(() => userService.getIncidents());
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => userService.getBookmarks());

  // Breakthrough Modals
  const [showCrowdModal, setShowCrowdModal] = useState<boolean>(false);
  const [showRadarModal, setShowRadarModal] = useState<boolean>(false);
  const [showParamedicModal, setShowParamedicModal] = useState<boolean>(false);
  const [selectedIncidentForHandover, setSelectedIncidentForHandover] = useState<IncidentLog | null>(null);

  // Live Location & Nearest Emergency Hospital Dispatch
  const [locationInfo, setLocationInfo] = useState<UserLocationInfo | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState<boolean>(false);
  const [nearestDispatch, setNearestDispatch] = useState<{
    nearestHospital: EmergencyFacility;
    route: RouteComputationResult;
  } | null>(null);
  const [showDashboardRouteMap, setShowDashboardRouteMap] = useState<boolean>(false);

  const loadDashboardLocation = async () => {
    try {
      const loc = await getUserLocationInfo();
      setLocationInfo(loc);
      const dispatch = await getAutomaticEscalationDispatch();
      setNearestDispatch(dispatch);
    } catch (err) {
      console.warn('Dashboard location fetch error:', err);
    }
  };

  useEffect(() => {
    loadDashboardLocation();

    const handleLocationUpdate = () => {
      loadDashboardLocation();
    };

    window.addEventListener('sanjeevani_location_updated', handleLocationUpdate);
    window.addEventListener('sanjeevani_location_cleared', handleLocationUpdate);

    const unsub = userService.subscribe((updated) => {
      setUserStats(updated);
      setIncidents(userService.getIncidents());
      setBookmarkedIds(userService.getBookmarks());
    });

    return () => {
      unsub();
      window.removeEventListener('sanjeevani_location_updated', handleLocationUpdate);
      window.removeEventListener('sanjeevani_location_cleared', handleLocationUpdate);
    };
  }, []);

  // User details
  const displayName = user?.displayName || userProfile?.fullName || 'Samyak Verma';
  const userInitial = displayName.charAt(0).toUpperCase();
  const userRole = userProfile?.role === 'parent' 
    ? 'Family Protector' 
    : userProfile?.role === 'responder' 
    ? 'School Nurse / Responder' 
    : 'Campus Guardian';

  // Level & XP calculations
  const { currentLevelXp, nextLevelXp, progressPercent } = userService.getNextLevelThreshold();

  // Daily Secret Carousel State
  const secrets = [
    {
      title: 'The Cool Water Rule',
      tag: 'Burn Safety Hack',
      text: 'Never put butter, toothpaste, or ice on a burn! Gently running cool tap water for 15-20 minutes removes heat trapped in the skin and prevents permanent scarring.',
      protocolId: 'burn'
    },
    {
      title: 'The Firm Pressure Rule',
      tag: 'Bleeding Hack',
      text: 'If a cut bleeds through your cloth or gauze, NEVER peel it off! Peeling rips away the body clots. Always pile fresh pads right on top and press firmly.',
      protocolId: 'bleeding'
    },
    {
      title: 'The 110 BPM Song Beat',
      tag: 'CPR Rhythm Hack',
      text: 'Push down in the center of the chest to the beat of "Stayin Alive" (104–110 BPM). Lock your elbows straight and let the chest rise fully each time.',
      protocolId: 'unconscious'
    },
    {
      title: 'The Choking Cough Rule',
      tag: 'Choking Hack',
      text: 'If a choking person is coughing loudly, DO NOT slap their back yet! Slapping can wedge the object deeper. Encourage them to keep coughing hard first.',
      protocolId: 'choking'
    }
  ];

  const [currentSecretIndex, setCurrentSecretIndex] = useState(0);

  const nextSecret = () => {
    setCurrentSecretIndex((prev) => (prev + 1) % secrets.length);
  };

  const prevSecret = () => {
    setCurrentSecretIndex((prev) => (prev - 1 + secrets.length) % secrets.length);
  };

  // Card view mode: 'id-card' or 'compact'
  const [cardMode, setCardMode] = useState<'id-card' | 'compact'>('id-card');
  const [copiedToast, setCopiedToast] = useState(false);
  const [copiedIncidentId, setCopiedIncidentId] = useState<string | null>(null);

  const handleCopyCard = () => {
    const text = `SANJEEVANI CERTIFIED GUARDIAN RECORD
Name: ${displayName}
Role: ${userRole}
Readiness Level: Level ${userStats.level} (${userStats.readinessScore}% Certified)
Earned Experience: ${userStats.xp} XP
Scenarios Completed: ${userStats.completedScenarioIds.length}
Technique Drills: ${userStats.drillsCompleted} (Best Rhythm: ${userStats.cprBestAccuracy}%)
Emergency Incidents Managed: ${incidents.length}
Verification ID: SV2-${Math.abs(userStats.xp * 37 + 1042)}
Engine: Gemma 4 31B & ARCore Cloud Anchors
Verified by Sanjeevani v2: https://sanjeevani.app`;
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleCopyIncident = (log: IncidentLog) => {
    const text = `[SANJEEVANI INCIDENT RECORD]
Incident: ${log.protocolTitle}
Time: ${log.startedAt} - ${log.completedAt} (${log.durationSeconds}s)
Steps Administered:
${log.stepsCompleted.map((s, i) => `${i + 1}. ${s}`).join('\n')}
Status: Micro-steps administered safely. Escalation: ${log.escalationTriggered ? 'Escalated' : 'Handled on scene'}.
Generated by Sanjeevani v2`;
    navigator.clipboard.writeText(text);
    setCopiedIncidentId(log.id);
    setTimeout(() => setCopiedIncidentId(null), 2500);
  };

  // Get bookmarked Library Entries
  const bookmarkedEntries = LIBRARY_ENTRIES.filter(e => bookmarkedIds.includes(e.id)).slice(0, 4);

  // Daily quests list
  const quests = [
    {
      id: 'drill',
      title: 'Practice an AI Scenario Dilemma',
      xp: 50,
      action: () => onSelectDestination('practice'),
      icon: GraduationCap,
      isDone: userStats.questsCompleted.includes('drill') || userStats.completedScenarioIds.length > 0
    },
    {
      id: 'cpr',
      title: 'Practice 110 BPM CPR Cadence',
      xp: 30,
      action: () => onSelectDestination('practice'),
      icon: HeartPulse,
      isDone: userStats.questsCompleted.includes('cpr') || userStats.drillsCompleted > 0
    },
    {
      id: 'library',
      title: 'Bookmark or Read an Emergency Guide',
      xp: 20,
      action: () => onSelectDestination('library'),
      icon: BookOpen,
      isDone: userStats.questsCompleted.includes('library') || bookmarkedIds.length > 0
    },
    {
      id: 'login',
      title: 'Daily Readiness Check-In',
      xp: 10,
      action: () => {},
      icon: Check,
      isDone: true
    }
  ];

  const completedQuestsCount = quests.filter(q => q.isDone).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* 1. TOP USER PROFILE & LEVEL PROGRESS BANNER */}
      {/* ======================================================== */}
      <Tilt3D maxTilt={3} scale={1.005}>
        <div className="relative rounded-3xl bg-gradient-to-r from-surface via-surface to-accent/10 border border-border p-6 sm:p-8 shadow-xs overflow-hidden">
          <LeafBorder side="left" className="opacity-40" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar + Name + Level */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-accent to-[#F9D08B] p-1 shadow-md flex items-center justify-center">
                  <div className="h-full w-full rounded-full bg-surface flex items-center justify-center text-ink font-display-italic font-bold text-2xl sm:text-3xl">
                    {userInitial}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-accent text-ink font-bold text-[10px] shadow-xs uppercase tracking-wider">
                  LVL {userStats.level}
                </span>
              </div>

              {/* User Info */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ink">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                    <span>{user ? 'Cloud Synced (Firestore)' : 'Offline Local Cache'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <span className="inline-flex items-center space-x-1 font-semibold text-accent">
                    <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                    <span>{userRole}</span>
                  </span>
                  <span>•</span>
                  <span className="text-primary font-semibold">
                    {userStats.readinessScore}% Emergency Readiness
                  </span>
                  <span>•</span>
                  <span>{userStats.streakDays}-Day Activity Streak</span>
                </div>
              </div>
            </div>

            {/* Right: XP Score + Encouragement */}
            <div className="text-left md:text-right space-y-2">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-accent/20 border border-accent/40 text-ink shadow-xs">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-display-italic font-bold text-xl sm:text-2xl leading-none">
                  {userStats.xp} XP
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="italic font-medium">
                  "Ready to protect lives, {displayName.split(' ')[0]}! Keep up your skills."
                </span>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-6 pt-4 border-t border-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>LEVEL {userStats.level} → LEVEL {userStats.level + 1} (Life Protector)</span>
              <span>{userStats.xp} / {nextLevelXp} XP ({progressPercent}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-base overflow-hidden border border-border/60">
              <div 
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Tilt3D>

      {/* ======================================================== */}
      {/* 2. MAIN DASHBOARD CONTENT (Two Columns) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: DAILY QUESTS, SECRET CAROUSEL & STORY (4 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card A: Dynamic Daily Quests */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-ink font-bold text-sm">
                <Compass className="w-4 h-4 text-accent" />
                <span>Daily Readiness Quests</span>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {completedQuestsCount}/{quests.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {quests.map((quest) => {
                const Icon = quest.icon;
                return (
                  <div key={quest.id} className="p-3 rounded-2xl bg-base border border-border flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        quest.isDone ? 'bg-success text-white' : 'bg-surface text-ink-muted border border-border'
                      }`}>
                        {quest.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-ink block">{quest.title}</span>
                        <span className="text-[10px] text-ink-muted">+{quest.xp} XP</span>
                      </div>
                    </div>

                    {quest.isDone ? (
                      <span className="text-[10px] font-bold text-success bg-success/15 px-2.5 py-1 rounded-lg shrink-0">
                        DONE
                      </span>
                    ) : (
                      <button 
                        onClick={quest.action}
                        className="text-[11px] font-bold text-ink bg-accent/30 hover:bg-accent/50 px-3 py-1 rounded-lg btn-press shrink-0"
                      >
                        Start
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card B: Daily First-Aid Secret / Myth Buster */}
          <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-surface to-accent/5 border border-border shadow-xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>DAILY FIRST-AID SECRET</span>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={prevSecret}
                  className="h-7 w-7 rounded-lg border border-border bg-surface flex items-center justify-center text-ink hover:bg-base btn-press"
                  aria-label="Previous tip"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextSecret}
                  className="h-7 w-7 rounded-lg border border-border bg-surface flex items-center justify-center text-ink hover:bg-base btn-press"
                  aria-label="Next tip"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/20 text-ink">
                {secrets[currentSecretIndex].tag}
              </span>
              <h3 className="text-base font-bold text-ink">
                {secrets[currentSecretIndex].title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed italic bg-base/80 p-3 rounded-xl border border-border/60">
                "{secrets[currentSecretIndex].text}"
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => onStartRespond(secrets[currentSecretIndex].protocolId)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-xs hover:brightness-105 btn-press text-center"
              >
                Act on this Tip →
              </button>
            </div>
          </div>

          {/* Card C: Revisit Our Story & Philosophy */}
          <div className="p-4 rounded-2xl bg-base border border-border flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-ink block">Want to read our full story?</span>
              <span className="text-[11px] text-ink-muted">From Sacred Legend to Modern AI</span>
            </div>
            <button
              onClick={onViewLandingPage}
              className="text-xs font-bold text-primary hover:underline px-2 py-1"
            >
              View Story →
            </button>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: CORE TOOLS, SAVED GUIDES, INCIDENTS & ID CARD (8 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Ready To Respond Callout Banner */}
          <Tilt3D maxTilt={3} scale={1.005}>
            <div className="rounded-3xl bg-gradient-to-r from-primary via-[#0E5A50] to-[#124B43] p-6 sm:p-7 text-white shadow-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent">
                  <Sparkles className="w-4 h-4" />
                  <span>INSTANT EMERGENCY ACCESS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Ready to help in an emergency?
                </h2>
                <p className="text-xs text-white/80 max-w-md">
                  Step-by-step clinical guidance for 100+ situations with voice pacing, 10s fail-safe AI, and paramedic handoff.
                </p>
              </div>

              <button
                onClick={() => onStartRespond()}
                className="shrink-0 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs sm:text-sm shadow-lg shadow-accent/25 hover:brightness-105 btn-press"
              >
                <Zap className="w-4 h-4" />
                <span>Open Emergency Guide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Tilt3D>

          {/* Real-time Nearest Trauma Hospital & Route Card (Auto GPS / City Aware) */}
          {nearestDispatch && (
            <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-primary/25 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-alert/15 text-alert flex items-center justify-center font-bold shadow-xs shrink-0">
                    ✚
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                        CLOSEST LEVEL-1 TRAUMA CENTER ({locationInfo?.city?.toUpperCase() || 'YOUR AREA'})
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-ink pt-0.5">
                      {nearestDispatch.nearestHospital.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-base border border-border text-xs font-bold text-ink hover:border-primary/40 flex items-center space-x-1.5 shrink-0 shadow-2xs btn-press"
                  title="Change emergency zone and doorstep address"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[120px]">
                    {locationInfo?.houseNumber 
                      ? `${locationInfo.houseNumber}, ${locationInfo.locality || locationInfo.city}` 
                      : locationInfo?.locality 
                      ? `${locationInfo.locality}, ${locationInfo.city}` 
                      : locationInfo?.city || 'Set Exact Address'}
                  </span>
                </button>
              </div>

              {locationInfo?.formattedAddress ? (
                <div className="p-2.5 rounded-xl bg-base border border-border/80 text-[11px] flex items-start space-x-2">
                  <Navigation className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5 truncate">
                    <span className="font-bold text-ink block truncate">
                      Doorstep Dispatch: {locationInfo.formattedAddress}
                    </span>
                    <span className="text-[10px] text-ink-muted block">
                      GPS Origin: {locationInfo.lat.toFixed(6)}, {locationInfo.lng.toFixed(6)} {locationInfo.accuracyMeters ? `(±${locationInfo.accuracyMeters}m lock)` : ''}
                    </span>
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-ink-muted">
                <span className="font-semibold text-ink">Destination Facility:</span> {nearestDispatch.nearestHospital.address}
              </p>

              {/* Badges strip: Category + Capabilities */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                  {nearestDispatch.nearestHospital.category}
                </span>
                {nearestDispatch.nearestHospital.hasAntiVenom && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-accent/25 text-ink">
                    🐍 Anti-Snake Venom (ASV)
                  </span>
                )}
                {nearestDispatch.nearestHospital.hasAED && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-alert/15 text-alert">
                    ⚡ AED Equipped
                  </span>
                )}
                {nearestDispatch.nearestHospital.isOpen24Hours && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    ✓ Open 24/7
                  </span>
                )}
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-base text-ink-muted border border-border">
                  ● {nearestDispatch.route.trafficCondition} Traffic
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-extrabold text-primary pt-1">
                <span>{nearestDispatch.route.distanceText} driving distance</span>
                <span>•</span>
                <span className="text-accent">{nearestDispatch.route.durationText} (Live Routing)</span>
              </div>

              {/* Toggle Live Leaflet Route Map */}
              {showDashboardRouteMap ? (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center space-x-1">
                      <Car className="w-3.5 h-3.5 text-primary" />
                      <span>Interactive Driving Route & Steps</span>
                    </span>
                    <button
                      onClick={() => setShowDashboardRouteMap(false)}
                      className="text-xs font-bold text-ink-muted hover:text-alert"
                    >
                      Hide Map
                    </button>
                  </div>
                  <EmergencyRouteMap
                    facility={nearestDispatch.nearestHospital}
                    route={nearestDispatch.route}
                    compact
                  />
                </div>
              ) : (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowDashboardRouteMap(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-base border border-primary/30 text-primary font-bold text-xs hover:bg-primary/10 btn-press flex items-center justify-center space-x-1.5 shadow-2xs"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>View Live Route Map</span>
                  </button>

                  <a
                    href={nearestDispatch.nearestHospital.navUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark btn-press flex items-center justify-center space-x-1.5 shadow-xs text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Launch GPS Navigation</span>
                  </a>

                  {nearestDispatch.nearestHospital.phoneNumber && (
                    <a
                      href={`tel:${nearestDispatch.nearestHospital.phoneNumber}`}
                      className="py-2.5 px-3 rounded-xl bg-surface border border-border text-ink font-bold text-xs hover:bg-base btn-press flex items-center space-x-1 shadow-2xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-alert" />
                      <span>Call Desk</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card 2: Core Tools Grid */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-ink font-bold text-sm">
              <Activity className="w-4 h-4 text-primary" />
              <span>Core First-Aid Tools</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  title: 'Two-Tap Emergency Guide',
                  desc: 'Fast help for bleeding, burns, CPR and choking',
                  action: () => onStartRespond(),
                  icon: Zap,
                  badgeBg: 'bg-alert/10 text-alert'
                },
                {
                  title: 'Paramedic Handoff & Docket',
                  desc: 'AI incident video analysis, SBAR audio & QR beacon',
                  action: () => onSelectDestination('handoff'),
                  icon: FileText,
                  badgeBg: 'bg-alert/10 text-alert'
                },
                {
                  title: 'CPR Beat Practice',
                  desc: '110 BPM metronome and rhythm trainer',
                  action: () => onSelectDestination('practice'),
                  icon: HeartPulse,
                  badgeBg: 'bg-accent/20 text-ink'
                },
                {
                  title: 'Dynamic AI Scenarios',
                  desc: 'On-the-fly dilemma quizzes by Gemma 4 31B',
                  action: () => onSelectDestination('practice'),
                  icon: GraduationCap,
                  badgeBg: 'bg-primary/10 text-primary'
                },
                {
                  title: 'Offline First-Aid Library',
                  desc: 'Search 77+ easy protocols without internet',
                  action: () => onSelectDestination('library'),
                  icon: BookOpen,
                  badgeBg: 'bg-info/15 text-info'
                },
                {
                  title: 'AI Guardian Chatbot',
                  desc: 'Ask Gemma 4 31B for advice, voice guidance, & myth checks',
                  action: () => onSelectDestination('chat'),
                  icon: Bot,
                  badgeBg: 'bg-accent/20 text-ink'
                },
                {
                  title: 'Crowd Commander Squad',
                  desc: 'Orchestrate onlookers into a synchronized trauma squad',
                  action: () => setShowCrowdModal(true),
                  icon: Users,
                  badgeBg: 'bg-accent/30 text-ink'
                },
                {
                  title: 'Antidote, AED & Hospital Radar',
                  desc: 'Locate nearest trauma centers, ASV & AEDs via Google APIs',
                  action: () => setShowRadarModal(true),
                  icon: Radar,
                  badgeBg: 'bg-primary/15 text-primary'
                }
              ].map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={idx}
                    onClick={tool.action}
                    className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 shadow-xs hover:shadow-sm text-left flex items-center justify-between gap-3 btn-press group transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tool.badgeBg}`}>
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-ink block group-hover:text-primary transition-colors">
                          {tool.title}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {tool.desc}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* Card 3: SAVED GUIDES SHELF (Connected to App Bookmarks) */}
          {/* ======================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-ink font-bold text-sm">
                <Bookmark className="w-4 h-4 text-accent fill-accent" />
                <span>Saved Life-Saving Guides ({bookmarkedIds.length})</span>
              </div>
              <button
                onClick={() => onSelectDestination('library')}
                className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
              >
                <span>Browse All 77</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {bookmarkedEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookmarkedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl bg-base border border-border hover:border-primary/40 transition-all flex flex-col justify-between space-y-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {entry.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          entry.severityBadge === 'Emergency' ? 'bg-alert/15 text-alert' :
                          entry.severityBadge === 'Urgent' ? 'bg-accent/25 text-ink' : 'bg-success/15 text-success'
                        }`}>
                          {entry.severityBadge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-ink line-clamp-1">{entry.title}</h4>
                      <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                        {entry.whatIsIt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <button
                        onClick={() => onStartRespond(entry.linkedProtocolId)}
                        className="text-[11px] font-bold text-alert hover:underline flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Act Live</span>
                      </button>
                      <button
                        onClick={() => onSelectDestination('library')}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        View Full Protocol →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-base rounded-2xl border border-dashed border-border space-y-2">
                <Bookmark className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
                <p className="text-xs text-ink-muted">
                  No bookmarks saved yet. Star emergency protocols in the library for instant 1-tap offline access.
                </p>
                <button
                  onClick={() => onSelectDestination('library')}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark btn-press"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open First-Aid Library</span>
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* Card 4: RECENT EMERGENCY INCIDENT LOGS (From RespondView) */}
          {/* ======================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-ink font-bold text-sm">
                <History className="w-4 h-4 text-primary" />
                <span>Recent Emergency Responses ({incidents.length})</span>
              </div>
              <span className="text-[11px] text-ink-muted">
                Persistent On-Device Audit Log
              </span>
            </div>

            {incidents.length > 0 ? (
              <div className="space-y-3">
                {incidents.slice(0, 3).map((log) => (
                  <div 
                    key={log.id}
                    className="p-4 rounded-2xl bg-base border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-success"></span>
                        <h4 className="text-xs font-bold text-ink">{log.protocolTitle}</h4>
                        <span className="text-[10px] text-ink-muted">
                          • {log.durationSeconds}s duration
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        Completed: {log.stepsCompleted.slice(0, 2).join(' • ')}
                        {log.stepsCompleted.length > 2 ? ` (+${log.stepsCompleted.length - 2} more)` : ''}
                      </p>
                      <span className="text-[10px] text-ink-muted block">
                        Recorded at {log.completedAt}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedIncidentForHandover(log);
                          setShowParamedicModal(true);
                        }}
                        className="p-2 rounded-xl bg-accent/20 border border-accent/40 text-ink text-xs font-bold hover:bg-accent/30 btn-press flex items-center space-x-1"
                        title="Generate Paramedic Handover QR Docket"
                      >
                        <FileText className="w-3.5 h-3.5 text-accent" />
                        <span>Paramedic QR</span>
                      </button>

                      <button
                        onClick={() => handleCopyIncident(log)}
                        className="p-2 rounded-xl bg-surface border border-border text-xs font-semibold text-ink hover:bg-base btn-press flex items-center space-x-1"
                        title="Copy summary for doctor/school"
                      >
                        <Copy className="w-3.5 h-3.5 text-primary" />
                        <span>{copiedIncidentId === log.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => onStartRespond(log.protocolId)}
                        className="p-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 btn-press"
                      >
                        Re-open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted italic text-center py-4 bg-base rounded-2xl">
                No active incident records logged. When you complete an emergency sequence in Respond, its verified timeline will appear here.
              </p>
            )}
          </div>

          {/* ======================================================== */}
          {/* Card 5: YOUR GUARDIAN PROFILE CARD (Matching Reference Image) */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-ink font-bold text-sm">
                <Award className="w-4 h-4 text-accent" />
                <span>Your First-Aid Guardian Profile</span>
              </div>

              {/* Card Switcher Pills */}
              <div className="inline-flex p-1 rounded-xl bg-surface border border-border text-xs">
                <button
                  onClick={() => setCardMode('id-card')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    cardMode === 'id-card' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Guardian ID Card
                </button>
                <button
                  onClick={() => setCardMode('compact')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    cardMode === 'compact' ? 'bg-primary text-white shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>

            {/* THE DARK SLEEK ID CARD */}
            <Tilt3D maxTilt={5} scale={1.01} className="w-full">
              <div className="relative rounded-3xl bg-[#1E252B] text-white p-6 sm:p-8 shadow-2xl border border-white/15 overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

                {/* Card Header: User name and title */}
                <div className="text-center space-y-1 pb-4 border-b border-white/10">
                  <span className="font-display-italic text-2xl sm:text-3xl font-bold tracking-wider text-white uppercase block">
                    {displayName}
                  </span>
                  <span className="text-[11px] font-bold tracking-widest text-accent uppercase block">
                    CAMPUS FIRST-AID GUARDIAN • LEVEL {userStats.level}
                  </span>
                  <span className="text-[10px] text-white/50 tracking-wider">
                    JOINED SEPTEMBER 2026 • SANJEEVANI VERIFIED • {userStats.xp} XP
                  </span>
                </div>

                {/* Card Main Body: Central Compass/Emblem + 3 Stats Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-6 items-center">
                  
                  {/* Left: The Central Badge Emblem */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-b from-[#2A343D] to-[#181E23] border-2 border-accent/40 shadow-inner flex items-center justify-center p-3">
                      <div className="relative flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full border border-dashed border-accent flex items-center justify-center">
                          <Compass className="h-10 w-10 text-accent" strokeWidth={1.75} />
                        </div>
                      </div>
                    </div>
                    <span className="mt-3 text-[10px] font-bold text-accent uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>{userStats.readinessScore}% READY RESPONDER</span>
                    </span>
                  </div>

                  {/* Right: 3 Vertical Pillars */}
                  <div className="sm:col-span-7 grid grid-cols-3 gap-2">
                    
                    {/* Pillar 1: Role */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center space-y-1.5 flex flex-col justify-between">
                      <div className="h-7 w-7 rounded-lg bg-primary/30 text-accent mx-auto flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">
                        ROLE
                      </span>
                      <span className="text-[11px] font-bold text-white leading-tight block">
                        {userRole}
                      </span>
                    </div>

                    {/* Pillar 2: Core Focus */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center space-y-1.5 flex flex-col justify-between">
                      <div className="h-7 w-7 rounded-lg bg-accent/30 text-accent mx-auto flex items-center justify-center">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">
                        CPR ACCURACY
                      </span>
                      <span className="text-[11px] font-bold text-accent leading-tight block">
                        {userStats.cprBestAccuracy}% Steady
                      </span>
                    </div>

                    {/* Pillar 3: Scenarios Solved */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center space-y-1.5 flex flex-col justify-between">
                      <div className="h-7 w-7 rounded-lg bg-success/30 text-success mx-auto flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">
                        SCENARIOS
                      </span>
                      <span className="text-[11px] font-bold text-white leading-tight block">
                        {userStats.completedScenarioIds.length} Solved
                      </span>
                    </div>

                  </div>
                </div>

                {/* Card Footer Strip */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                    <span>GEMMA 4 31B & ARCORE ACTIVE</span>
                  </div>
                  <span className="text-accent font-semibold">
                    ID #SV2-{Math.abs(userStats.xp * 37 + 1042)} • PRJ-678230707158
                  </span>
                </div>
              </div>
            </Tilt3D>

            {/* Bottom Card Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyCard}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-ink text-xs font-bold hover:bg-base btn-press shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                  <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Record'}</span>
                </button>

                <button
                  onClick={handleCopyCard}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink text-xs font-bold shadow-xs hover:brightness-105 btn-press"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Share Guardian Card</span>
                </button>
              </div>

              <span className="text-xs text-ink-muted">
                100% Verified by Sanjeevani v2
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Breakthrough Modals */}
      <CrowdCommanderModal
        isOpen={showCrowdModal}
        onClose={() => setShowCrowdModal(false)}
      />

      <EmergencyRadarModal
        isOpen={showRadarModal}
        onClose={() => setShowRadarModal(false)}
      />

      <ParamedicHandoverModal
        isOpen={showParamedicModal}
        onClose={() => setShowParamedicModal(false)}
        incidentLog={selectedIncidentForHandover || incidents[0] || null}
      />

      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationChanged={(fresh) => {
          setLocationInfo(fresh);
          loadDashboardLocation();
        }}
      />

    </div>
  );
};
