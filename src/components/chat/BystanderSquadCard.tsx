import React, { useState, useEffect } from 'react';
import { 
  Users, 
  QrCode, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Copy, 
  Check, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Radio, 
  Clock, 
  ShieldCheck, 
  Share2,
  X,
  PhoneCall,
  Search,
  Zap,
  MapPin
} from 'lucide-react';
import { BystanderSquadSession, broadcastCrowdAudioAnnouncement, SquadTaskRole } from '../../services/bystanderSquadEngine';
import { subscribeToSquadSession, EmergencySquadSession } from '../../firebase/db';

interface BystanderSquadCardProps {
  session: BystanderSquadSession;
  defaultExpanded?: boolean;
}

export const BystanderSquadCard: React.FC<BystanderSquadCardProps> = ({
  session: initialSession,
  defaultExpanded = true
}) => {
  const [session, setSession] = useState<EmergencySquadSession | BystanderSquadSession>(initialSession);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to real-time updates for this squad
  useEffect(() => {
    if (!initialSession?.id) return;
    const unsub = subscribeToSquadSession(initialSession.id, (updated) => {
      setSession(updated);
    });
    return () => unsub();
  }, [initialSession?.id]);

  const handleToggleAnnounce = () => {
    if (isAnnouncing) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsAnnouncing(false);
    } else {
      setIsAnnouncing(true);
      broadcastCrowdAudioAnnouncement(session as BystanderSquadSession, 'bilingual', () => {
        setIsAnnouncing(false);
      });
    }
  };

  const handleCopyLink = async () => {
    const rawOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';
    const origin = (rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1')) ? 'https://sanjeevani-v2.web.app' : rawOrigin;
    const link = `${origin}/?squad=${session.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownloadSVG = () => {
    if (!session.qrSvg) return;
    const blob = new Blob([session.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanjeevani-Squad-${session.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rolesList = Object.values(session.roles || {}) as SquadTaskRole[];
  const completedTasks = rolesList.filter((r) => r.status === 'completed').length;
  const inProgressTasks = rolesList.filter((r) => r.status === 'in_progress' || r.status === 'claimed').length;
  const progressPct = rolesList.length > 0 ? Math.round((completedTasks / rolesList.length) * 100) : 0;

  return (
    <div className="mt-4 w-full rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-surface to-surface overflow-hidden shadow-sm transition-all">
      
      {/* 1. Header Accordion Pill */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors select-none"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-bold text-ink">
                Bystander Squad QR Beacon
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                #{session.id}
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-alert text-white animate-pulse">
                SOLVE BYSTANDER EFFECT
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {completedTasks}/{rolesList.length} Tasks Complete • Show QR to onlookers for zero-install task assignment
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-2">
          <span className="hidden sm:inline text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {isExpanded ? 'Hide' : 'Open Squad Hub'}
          </span>
          <div className="p-1 rounded-lg bg-base border border-border text-ink-muted">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* 2. Expanded Content: High-Contrast QR Code + Real-Time Squad Roster */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-border/80 space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: QR Code & Crowd Voice Marshalling */}
            <div className="md:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-base border border-border/80 space-y-3">
              <div 
                className="p-2.5 rounded-2xl bg-white shadow-md cursor-pointer hover:scale-102 transition-transform relative group"
                onClick={() => setIsFullScreen(true)}
                title="Click to enlarge QR to maximum screen brightness"
              >
                <div 
                  className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: session.qrSvg || '' }}
                />
                <div className="absolute inset-0 bg-ink/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold space-y-1 backdrop-blur-2xs">
                  <Maximize2 className="w-5 h-5" />
                  <span>Enlarge for Crowd</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero-Install Onboarding</span>
                </span>
                <p className="text-[10px] text-ink-muted max-w-[220px] leading-tight">
                  Point any phone camera to join. Onlookers are instantly assigned prioritized life-saving roles.
                </p>
              </div>

              {/* Authoritative Audio Announcement */}
              <button
                onClick={handleToggleAnnounce}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 btn-press transition-all cursor-pointer ${
                  isAnnouncing
                    ? 'bg-alert text-white shadow-md animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm'
                }`}
              >
                {isAnnouncing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isAnnouncing ? 'Stop Loudspeaker' : '📢 Broadcast Crowd Audio'}</span>
              </button>

              {/* Action Toolbar */}
              <div className="flex items-center space-x-2 w-full pt-1">
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-surface hover:bg-base border border-border text-[11px] font-semibold text-ink btn-press"
                  title="Full Screen QR for Crowd"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>Full Screen</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center p-2 rounded-xl bg-surface hover:bg-base border border-border text-ink-muted hover:text-ink btn-press"
                  title="Copy Squad Join Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="flex items-center justify-center p-2 rounded-xl bg-surface hover:bg-base border border-border text-ink-muted hover:text-ink btn-press"
                  title="Download SVG QR"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Live Bystander Task Allocation Matrix */}
            <div className="md:col-span-7 space-y-3.5 text-xs">
              
              {/* Attached Incident Scene Photo & AI Summary */}
              {session.photoPreviewUrl && (
                <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-base border border-amber-500/30 shadow-xs">
                  <img
                    src={session.photoPreviewUrl}
                    alt="Emergency scene visual"
                    className="w-14 h-14 rounded-lg object-cover border border-border shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Scene Photo Attached • AI Verified
                    </span>
                    <p className="text-[11px] text-ink font-semibold line-clamp-2">
                      {session.incidentSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-base border border-border">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink-muted block">
                    Emergency Delegation Status
                  </span>
                  <span className="text-xs font-bold text-ink">
                    {completedTasks} of {rolesList.length} Tasks Executed
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {progressPct}% Solved
                  </span>
                </div>
              </div>

              {/* Dynamic Task List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {rolesList.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-xl border transition-all ${
                      role.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-ink'
                        : role.status === 'in_progress'
                        ? 'bg-blue-500/10 border-blue-500/30 text-ink'
                        : role.status === 'claimed'
                        ? 'bg-amber-500/10 border-amber-500/30 text-ink'
                        : 'bg-base border-border/80 text-ink-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-ink text-xs truncate">
                            {role.title}
                          </span>
                          <span className="text-[9px] font-mono px-1 rounded bg-border text-ink-muted">
                            P{role.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink font-medium line-clamp-2">
                          {role.instruction}
                        </p>
                        <div className="flex items-center space-x-2 text-[10px] text-ink-muted pt-0.5">
                          <span>Assigned: <strong>{role.assignedTo || 'Waiting for scan...'}</strong></span>
                          {role.completedAt && (
                            <span>• Finished: {role.completedAt}</span>
                          )}
                        </div>
                      </div>

                      <span className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        role.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : role.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : role.status === 'claimed'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-base text-ink-muted border border-border'
                      }`}>
                        {role.status === 'completed' ? 'Done ✅' : role.status === 'in_progress' ? 'Active' : role.status === 'claimed' ? 'Claimed' : 'Awaiting Scan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {session.locationAddress && (
                <div className="p-2.5 rounded-xl bg-base border border-border/70 text-[11px] text-ink-muted flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Scene GPS: {session.locationAddress}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. Full Screen QR Modal for Large Crowd Presentation */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-white text-slate-900 shadow-2xl flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 btn-press cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 block">
                Crowd Task Assignment Beacon
              </span>
              <h3 className="text-xl font-black tracking-tight text-slate-900">
                Squad #{session.id}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Hold phone high for onlookers to scan with their camera. Zero download required.
              </p>
            </div>

            {/* High-Contrast Large QR */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center">
              <div 
                className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: session.qrSvg || '' }}
              />
            </div>

            {/* Audio Broadcast in Fullscreen */}
            <div className="w-full flex items-center space-x-2 pt-2">
              <button
                onClick={handleToggleAnnounce}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 btn-press cursor-pointer"
              >
                {isAnnouncing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isAnnouncing ? 'Stop Loudspeaker' : '📢 Broadcast Crowd Audio'}</span>
              </button>
              <button
                onClick={handleDownloadSVG}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center space-x-1.5 btn-press cursor-pointer"
                title="Save QR Code SVG"
              >
                <Download className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
