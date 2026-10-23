import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  HeartPulse, 
  Search, 
  Check, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Users, 
  Copy, 
  Zap,
  Radio,
  ExternalLink,
  FileText,
  Download,
  ShieldCheck,
  Ambulance,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { 
  subscribeToSquadSession, 
  updateSquadRoleInFirestore, 
  updateSquadRoleStatus, 
  EmergencySquadSession 
} from '../../firebase/db';
import { 
  SquadTaskRole, 
  generateSquadRolesForIncident, 
  detectIncidentCategory 
} from '../../services/bystanderSquadEngine';
import { audioEngine } from '../../utils/audio';
import { saveScannedQR, downloadMarkdownFile } from '../../services/qrStorageService';

interface SquadJoinViewProps {
  squadId: string;
  onExit?: () => void;
}

export const SquadJoinView: React.FC<SquadJoinViewProps> = ({ squadId, onExit }) => {
  const [session, setSession] = useState<EmergencySquadSession | null>(null);
  const [showMarkdownDocket, setShowMarkdownDocket] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [isFlashingBeacon, setIsFlashingBeacon] = useState(false);
  const [beaconColor, setBeaconColor] = useState(false);
  const [checkedAedSpots, setCheckedAedSpots] = useState<Record<number, boolean>>({});

  // User's assigned role
  const [myRoleId, setMyRoleId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`sanjeevani_my_role_${squadId}`) || null;
    } catch {
      return null;
    }
  });

  // Unique local onlooker index to distribute different tasks across bystanders
  const [onlookerIndex] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`sanjeevani_onlooker_idx_${squadId}`);
      if (stored) return parseInt(stored, 10);
      const idx = Math.floor(1 + Math.random() * 4);
      localStorage.setItem(`sanjeevani_onlooker_idx_${squadId}`, idx.toString());
      return idx;
    } catch {
      return 1;
    }
  });

  const [bystanderName] = useState<string>(() => {
    try {
      return localStorage.getItem('sanjeevani_bystander_name') || `Responder #${onlookerIndex}`;
    } catch {
      return `Responder #${onlookerIndex}`;
    }
  });

  // 1. Immediate Offline Session Synthesis (0ms delay on mobile) + Live Firestore Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        saveScannedQR(window.location.href, `Joined Bystander Rescue Squad #${squadId}`);
      } catch {}
    }

    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const category = detectIncidentCategory(urlParams.get('cat') || 'cardiac_cpr');
    const location = urlParams.get('addr') || 'Current Emergency Scene';
    const title = urlParams.get('title') || category.replace('_', ' ').toUpperCase();

    // Synthesize immediately so phone user never sees a blank loading screen
    setSession((prev) => {
      if (prev) return prev;
      const initialRoles = generateSquadRolesForIncident(category, location);
      return {
        id: squadId,
        leaderId: 'primary_responder',
        leaderName: 'Primary Rescuer',
        protocolId: category,
        protocolTitle: title,
        incidentSummary: `Emergency ${title} Incident. Coordinated bystander crowd response active.`,
        urgencyLevel: 'CRITICAL_112',
        locationAddress: location,
        roles: initialRoles,
        bystanderCount: 3,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const unsub = subscribeToSquadSession(squadId, (updated) => {
      if (updated) {
        setSession(updated);
      }
    });

    return () => {
      unsub();
    };
  }, [squadId, onlookerIndex]);

  // 2. Deterministic Role Auto-Assignment
  useEffect(() => {
    if (!session || !session.roles) return;
    if (myRoleId && session.roles[myRoleId]) return;

    const roleEntries = Object.values(session.roles) as SquadTaskRole[];
    const sortedRoles = [...roleEntries].sort((a, b) => a.priority - b.priority);
    const unassigned = sortedRoles.filter((r) => r.status === 'unassigned');
    let targetRole: SquadTaskRole | undefined;

    if (unassigned.length > 0) {
      const pickIdx = (onlookerIndex - 1) % unassigned.length;
      targetRole = unassigned[pickIdx] || unassigned[0];
    } else {
      const pickIdx = (onlookerIndex - 1) % sortedRoles.length;
      targetRole = sortedRoles[pickIdx];
    }

    if (targetRole) {
      setMyRoleId(targetRole.id);
      try {
        localStorage.setItem(`sanjeevani_my_role_${squadId}`, targetRole.id);
      } catch {}
      updateSquadRoleInFirestore(squadId, targetRole.id, `${bystanderName} (You)`, 'claimed');
    }
  }, [session, myRoleId, squadId, bystanderName, onlookerIndex]);

  // Metronome for CPR compressors
  useEffect(() => {
    if (isMetronomeActive) {
      audioEngine.startMetronome(110, (tick) => {
        setMetronomeTick(tick);
      });
    } else {
      audioEngine.stopMetronome();
    }
    return () => audioEngine.stopMetronome();
  }, [isMetronomeActive]);

  // Visual Beacon for Gate Flaggers (gentle card pulse instead of harsh full-screen strobe)
  useEffect(() => {
    let timer: any;
    if (isFlashingBeacon) {
      timer = setInterval(() => {
        setBeaconColor((prev) => !prev);
      }, 600);
    }
    return () => clearInterval(timer);
  }, [isFlashingBeacon]);

  const handleClaimRole = (roleId: string) => {
    if (!session) return;
    setMyRoleId(roleId);
    try {
      localStorage.setItem(`sanjeevani_my_role_${squadId}`, roleId);
    } catch {}
    const assignedLabel = `${bystanderName} (You)`;
    updateSquadRoleInFirestore(squadId, roleId, assignedLabel, 'claimed');
  };

  const handleSetStatus = (newStatus: 'in_progress' | 'completed') => {
    if (!session || !myRoleId) return;
    updateSquadRoleStatus(squadId, myRoleId, newStatus);
    setSession((prev) => {
      if (!prev || !prev.roles || !prev.roles[myRoleId]) return prev;
      return {
        ...prev,
        roles: {
          ...prev.roles,
          [myRoleId]: {
            ...prev.roles[myRoleId],
            status: newStatus,
            assignedTo: `${bystanderName} (You)`
          }
        }
      };
    });
    if (newStatus === 'completed') {
      try {
        audioEngine.playClick(true);
      } catch {}
    }
  };

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSpeakScript = (scriptText: string) => {
    audioEngine.speak(scriptText);
  };

  const generateMarkdownDocket = (): string => {
    if (!session) return '';
    const rolesList = Object.values(session.roles || {}) as SquadTaskRole[];

    return `# 🚨 SANJEEVANI v2 - EMERGENCY BYSTANDER SQUAD DOCKET
**Docket ID:** \`#${session.id}\`  
**Protocol:** ${session.protocolTitle}  
**Urgency Level:** ${session.urgencyLevel}  
**Scene Location:** ${session.locationAddress || 'Current GPS Scene'}  
**Recorded Timestamp:** ${new Date(session.createdAt || Date.now()).toLocaleString()}  

---

## 👥 Bystander Tasks & Rescue Matrix

| Priority | Task Name | Category | Assigned Rescuer | Current Status |
| :--- | :--- | :--- | :--- | :--- |
${rolesList.map(r => `| P${r.priority} | **${r.title}** | \`${r.category}\` | ${r.assignedTo || '*Unassigned*'} | \`${r.status.toUpperCase()}\` |`).join('\n')}

---

## 📋 Task Clinical Instructions

${rolesList.map(r => `### ${r.title}
- **Role Subtitle:** ${r.subtitle}
- **Clinical Directive:** ${r.instruction}
${r.scriptText ? `- **Teleprompter Script:** *"${r.scriptText}"*\n` : ''}`).join('\n')}
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownDocket();
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownDocket();
    downloadMarkdownFile(`Sanjeevani_Squad_${squadId}_Docket.md`, md);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F3F7F6] text-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0E5A50] text-white shadow-lg">
          <Radio className="w-8 h-8 animate-pulse text-[#F0A85B]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Connecting to Rescue Squad...</h2>
          <p className="text-xs text-slate-600 font-mono">Squad #{squadId}</p>
        </div>
      </div>
    );
  }

  const allRoles = (Object.values(session.roles || {}) as SquadTaskRole[]).sort((a, b) => a.priority - b.priority);
  const myRole = (myRoleId && session.roles && session.roles[myRoleId]) ? (session.roles[myRoleId] as SquadTaskRole) : allRoles[0] || null;
  const completedCount = allRoles.filter((r) => r.status === 'completed').length;
  const activeCount = allRoles.filter((r) => r.status === 'in_progress' || r.status === 'claimed' || r.status === 'completed').length;
  const progressPct = allRoles.length > 0 ? Math.round((completedCount / allRoles.length) * 100) : 0;

  return (
    <div className="min-h-dvh-screen bg-[#F3F7F6] text-slate-900 pb-16 font-sans">
      
      {/* 1. CALM, AUTHORITATIVE HOSPITAL-GRADE TOP HEADER */}
      <header className="sticky top-0 z-30 bg-[#0E5A50] text-white shadow-md border-b border-emerald-700/50 px-4 sm:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[#F0A85B] border border-white/25 font-black shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F0A85B]">
                  SANJEEVANI RESCUE SQUAD
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  LIVE
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                {session.protocolTitle} • #{session.id}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onExit && (
              <button
                onClick={onExit}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white text-[#0E5A50] hover:bg-emerald-50 text-xs font-black shadow-xs cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. SCENE LOCATION & INSTANT SOS BAR */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-700 truncate font-bold">
            <MapPin className="w-4 h-4 text-[#0E5A50] shrink-0" />
            <span className="truncate">{session.locationAddress || 'Active Emergency Scene'}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="tel:112"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-[11px] shadow-2xs"
            >
              <PhoneCall className="w-3 h-3" />
              <span>112 SOS</span>
            </a>
            <a
              href="tel:108"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-2xs"
            >
              <Ambulance className="w-3 h-3" />
              <span>108 EMS</span>
            </a>
          </div>
        </div>
      </div>

      {/* MAIN ADAPTIVE CONTAINER (Single column on phone/tablet, 12-col cockpit on laptop/desktop) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">

        {/* 3. REASSURING BYSTANDER WELCOME & ROLE SWITCHER PILLS */}
        <div className="rounded-3xl bg-white border-2 border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#0E5A50]" />
              <span className="text-xs font-black text-slate-900">
                Stay Calm • Zero App Install Required
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-[#0E5A50] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {activeCount}/{allRoles.length} Roles Active
            </span>
          </div>

          {/* Role Switcher Tabs so user can view or switch any of the 4 tasks easily on mobile */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Your Assigned Role (Tap any pill to switch role):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {allRoles.map((r, idx) => {
                const isSelected = myRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleClaimRole(r.id)}
                    className={`px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border text-xs font-black flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#0E5A50] text-white border-[#0E5A50] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-mono shrink-0 ${
                      isSelected ? 'bg-[#F0A85B] text-slate-950' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{r.title.replace(/^Role \d+:\s*/i, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-5">
            {/* 4. HERO ASSIGNED MISSION CARD */}
            {myRole && (
              <div className="rounded-3xl bg-white border-2 border-[#0E5A50]/40 shadow-lg overflow-hidden">
            
            {/* Mission Top Banner */}
            <div className="bg-gradient-to-r from-[#0E5A50] to-emerald-800 px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-[#F0A85B] text-slate-950 font-black text-[10px] uppercase">
                  PRIORITY P{myRole.priority}
                </span>
                <span className="text-xs font-extrabold tracking-wide uppercase">
                  Your Mission ({bystanderName})
                </span>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                myRole.status === 'completed'
                  ? 'bg-emerald-400 text-slate-950'
                  : myRole.status === 'in_progress'
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-white/20 text-white'
              }`}>
                {myRole.status === 'completed' ? 'Completed ✅' : myRole.status === 'in_progress' ? 'In Progress' : 'Assigned to You'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Role Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {myRole.title}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#0E5A50] mt-1">
                  {myRole.subtitle}
                </p>
              </div>

              {/* Clear Clinical Directive Box */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border-2 border-slate-200 space-y-3">
                <div className="flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E5A50]" />
                  <span>Step-by-Step Action Instructions</span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  {myRole.instruction}
                </p>

                {/* ================================================== */}
                {/* ROLE-SPECIFIC INTERACTIVE TOOL 1: 112 DISPATCHER   */}
                {/* ================================================== */}
                {myRole.actionType === 'call_112' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href="tel:112"
                        className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm active:scale-98 transition-all"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        <span>Dial 112 Now</span>
                      </a>
                      <a
                        href="tel:108"
                        className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm active:scale-98 transition-all"
                      >
                        <Ambulance className="w-4 h-4" />
                        <span>Dial 108 Ambulance</span>
                      </a>
                    </div>

                    {myRole.scriptText && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                            🗣️ Read This Exact Script to 112 Operator:
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleSpeakScript(myRole.scriptText!)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-black flex items-center space-x-1 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-[#0E5A50]" />
                              <span>Speak</span>
                            </button>
                            <button
                              onClick={() => handleCopyScript(myRole.scriptText!)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-black flex items-center space-x-1 cursor-pointer"
                            >
                              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-slate-900 italic leading-relaxed">
                          "{myRole.scriptText}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================== */}
                {/* ROLE-SPECIFIC INTERACTIVE TOOL 2: 110 BPM CPR      */}
                {/* ================================================== */}
                {myRole.actionType === 'metronome_cpr' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 flex flex-col items-center justify-center space-y-2 shadow-2xs">
                      <div className={`p-3.5 rounded-full transition-transform duration-150 ${
                        isMetronomeActive && metronomeTick % 2 === 0 
                          ? 'bg-rose-100 text-rose-600 scale-115 ring-4 ring-rose-200' 
                          : 'bg-emerald-50 text-[#0E5A50] scale-100'
                      }`}>
                        <HeartPulse className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-black font-mono text-slate-900 block">
                          110 BPM
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          Push Hard & Fast in Center of Chest (5–6 cm depth)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all ${
                        isMetronomeActive 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-[#0E5A50] hover:bg-[#0A4740] text-white'
                      }`}
                    >
                      {isMetronomeActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#F0A85B]" />}
                      <span>{isMetronomeActive ? 'Pause 110 BPM Audio Metronome' : '🔊 Start 110 BPM CPR Audio Guide'}</span>
                    </button>
                  </div>
                )}

                {/* ================================================== */}
                {/* ROLE-SPECIFIC INTERACTIVE TOOL 3: AED RUNNER       */}
                {/* ================================================== */}
                {myRole.actionType === 'search_aed' && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-black text-[#0E5A50] uppercase tracking-wider block">
                      Tap Locations Checked for AED / First-Aid Kit:
                    </span>
                    <div className="space-y-1.5">
                      {[
                        'Main Gate Security Desk / Guard Room',
                        'School Infirmary / Building Reception Desk',
                        'Nearest Metro / Mall / Pharmacy Counter',
                        'Gymnasium / Sports Complex Wall Cabinet'
                      ].map((loc, i) => (
                        <div
                          key={i}
                          onClick={() => setCheckedAedSpots(prev => ({ ...prev, [i]: !prev[i] }))}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            checkedAedSpots[i]
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 text-xs font-bold">
                            <Search className="w-4 h-4 text-[#0E5A50] shrink-0" />
                            <span>{loc}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            checkedAedSpots[i] ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {checkedAedSpots[i] ? 'Checked ✓' : 'Check'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* ROLE-SPECIFIC INTERACTIVE TOOL 4: GATE FLAGGER     */}
                {/* ================================================== */}
                {myRole.actionType === 'gate_flag' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    {isFlashingBeacon && (
                      <div className={`p-4 rounded-2xl border-2 text-center transition-colors duration-300 ${
                        beaconColor
                          ? 'bg-amber-400 border-amber-500 text-slate-950'
                          : 'bg-red-600 border-red-700 text-white'
                      }`}>
                        <span className="text-xs font-black uppercase tracking-widest block">
                          🚨 AMBULANCE CORRIDOR BEACON ACTIVE 🚨
                        </span>
                        <span className="text-sm font-extrabold block mt-1">
                          Hold Phone Up Towards Incoming 108/112 Ambulance
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setIsFlashingBeacon(!isFlashingBeacon)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all ${
                        isFlashingBeacon
                          ? 'bg-slate-900 text-white'
                          : 'bg-[#F0A85B] hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{isFlashingBeacon ? 'Turn Off Visual Guide Beacon' : '🚨 Activate Ambulance Guide Banner'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2 LARGE THUMB-FRIENDLY STATUS BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleSetStatus('in_progress')}
                  disabled={myRole.status === 'in_progress' || myRole.status === 'completed'}
                  className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    myRole.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-900 border-2 border-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-300 active:scale-98'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{myRole.status === 'in_progress' ? 'In Progress...' : 'I’m On It Now'}</span>
                </button>

                <button
                  onClick={() => handleSetStatus('completed')}
                  disabled={myRole.status === 'completed'}
                  className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm ${
                    myRole.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0E5A50] hover:bg-[#0A4740] text-white active:scale-98'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F0A85B]" />
                  <span>{myRole.status === 'completed' ? 'Completed ✅' : 'Mark Done ✅'}</span>
                </button>
              </div>

                </div>

              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5">
            {/* 5. COMPLETE SQUAD ROSTER & PROGRESS MATRIX */}
            <div className="rounded-3xl bg-white border-2 border-slate-200/90 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#0E5A50]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Live 4-Person Rescue Squad Matrix
                  </h3>
                </div>
                <span className="text-xs font-black font-mono text-[#0E5A50]">
                  {progressPct}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#0E5A50] to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.max(15, progressPct)}%` }}
                />
              </div>

              <div className="space-y-2">
                {allRoles.map((role) => {
                  const isMine = myRole?.id === role.id;

                  return (
                    <div
                      key={role.id}
                      onClick={() => !isMine && handleClaimRole(role.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isMine
                          ? 'bg-emerald-50/70 border-[#0E5A50] shadow-2xs'
                          : role.status === 'completed'
                          ? 'bg-slate-50 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-black text-[10px]">
                            P{role.priority}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {role.title}
                          </span>
                          {isMine && (
                            <span className="px-2 py-0.5 rounded-full bg-[#0E5A50] text-white font-black text-[9px] uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 truncate mt-0.5">
                          {role.assignedTo || 'Unassigned — Tap to switch to this role'}
                        </p>
                      </div>

                      <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full ${
                        role.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : role.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isMine
                          ? 'bg-[#F0A85B]/30 text-amber-950 border border-amber-400'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {role.status === 'completed' ? 'Done ✅' : role.status === 'in_progress' ? 'Active' : isMine ? 'Active (You)' : 'Switch →'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. COLLAPSIBLE INCIDENT DOCKET EXPORT BAR */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#0E5A50]" />
                  <span className="text-xs font-black text-slate-800">
                    Squad Incident Log
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-300 cursor-pointer"
                  >
                    {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMarkdown ? 'Copied' : 'Copy Log'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#F0A85B] hover:bg-amber-400 text-xs font-black text-slate-950 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    onClick={() => setShowMarkdownDocket(!showMarkdownDocket)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>{showMarkdownDocket ? 'Hide' : 'Raw .md'}</span>
                    {showMarkdownDocket ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {showMarkdownDocket && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-700">
                  {generateMarkdownDocket()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] font-bold text-slate-500 pt-1">
          Sanjeevani v2.0 Bystander Paradox Resolution Engine • 100% Zero-Install Mobile Web
        </div>

      </main>
    </div>
  );
};
