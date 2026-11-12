import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PanelRightClose,
  PanelRightOpen,
  Volume2,
  VolumeX,
  Users,
  QrCode
} from 'lucide-react';
import {
  BystanderSquadSession,
  broadcastCrowdAudioAnnouncement,
  localizeBystanderRole,
  SquadTaskRole
} from '../../services/bystanderSquadEngine';
import { ParamedicHandoutData } from '../../utils/handoutHelper';
import {
  subscribeToSquadSession,
  updateSquadRoleInFirestore,
  EmergencySquadSession
} from '../../firebase/db';
import { audioEngine } from '../../utils/audio';
import { QRTile } from './QRTile';
import { TaskRow } from './TaskRow';
import { HandoverSummary } from './HandoverSummary';
import { useAppLanguage, UI_TRANSLATIONS } from '../../utils/languageStore';

export interface RescueSidebarProps {
  variant: 'sidebar' | 'sheet';
  isOpen?: boolean;
  onClose?: () => void;
  squadSession?: BystanderSquadSession;
  handout?: ParamedicHandoutData;
}

/**
 * Compact Rescue Sidebar (Section F):
 * - Width 320–340px (w-[330px]).
 * - Both QR tiles side by side and sticky at the top, followed immediately by the progress row ("0 of 4 done" / "0 of 5 done") + Loudspeaker button.
 * - The sidebar's ONLY scroll area is the task list (`data-scroll-container="sidebar-tasks"`).
 * - At 1280×620 both QR codes, the progress row, and at least 3 task rows are visible without scrolling.
 */
export const RescueSidebar: React.FC<RescueSidebarProps> = ({
  variant,
  isOpen = false,
  onClose,
  squadSession: initialSquadSession,
  handout
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const [session, setSession] = useState<EmergencySquadSession | BystanderSquadSession | undefined>(
    initialSquadSession
  );
  const [isCollapsedRail, setIsCollapsedRail] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [isSpeakingSBAR, setIsSpeakingSBAR] = useState(false);
  const [copiedSquadLink, setCopiedSquadLink] = useState(false);
  const [copiedHandoutSBAR, setCopiedHandoutSBAR] = useState(false);
  const [railModalTarget, setRailModalTarget] = useState<'bystanders' | 'paramedic' | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    setSession(initialSquadSession);
  }, [initialSquadSession]);

  useEffect(() => {
    if (!initialSquadSession?.id) return;
    const unsub = subscribeToSquadSession(initialSquadSession.id, (updated) => {
      setSession(updated);
    });
    return () => unsub();
  }, [initialSquadSession?.id]);

  useEffect(() => {
    if (variant !== 'sheet' || !isOpen) return;

    const sheetEl = sheetRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const firstFocusable = sheetEl?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && sheetEl) {
        const focusables = Array.from(sheetEl.querySelectorAll<HTMLElement>(focusableSelector));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [variant, isOpen, onClose]);

  const rawRolesList = Object.values(session?.roles || {}) as SquadTaskRole[];
  const rolesList = rawRolesList.map((role) => localizeBystanderRole(role, lang));
  const totalTasks = rolesList.length || 4;
  const completedTasks = rolesList.filter((r) => r.status === 'completed').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCopySquadLink = async () => {
    if (!session) return;
    const rawOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';
    const origin =
      rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1')
        ? 'https://sanjeevani-v2.web.app'
        : rawOrigin;
    const link = `${origin}/?squad=${session.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedSquadLink(true);
      setTimeout(() => setCopiedSquadLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadSquadSVG = () => {
    if (!session?.qrSvg) return;
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

  const handleToggleAnnounce = () => {
    if (!session) return;
    if (isAnnouncing) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsAnnouncing(false);
    } else {
      setIsAnnouncing(true);
      broadcastCrowdAudioAnnouncement(session as BystanderSquadSession, lang, () => {
        setIsAnnouncing(false);
      });
    }
  };

  const handleCopyHandoutSBAR = async () => {
    if (!handout) return;
    try {
      await navigator.clipboard.writeText(handout.sbarText);
      setCopiedHandoutSBAR(true);
      setTimeout(() => setCopiedHandoutSBAR(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadHandoutSVG = () => {
    if (!handout?.qrSvg) return;
    const blob = new Blob([handout.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanjeevani-${handout.handoutId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleSpeakSBAR = () => {
    if (!handout) return;
    if (isSpeakingSBAR) {
      audioEngine.stopSpeech();
      setIsSpeakingSBAR(false);
    } else {
      setIsSpeakingSBAR(true);
      const textToSpeak = handout.sbarText
        .replace(/[*_#`]/g, '')
        .replace(/\n+/g, '. ');
      audioEngine.speak(textToSpeak, () => {
        setIsSpeakingSBAR(false);
      });
    }
  };

  const handleMarkTaskComplete = (roleId: string) => {
    if (!session?.id) return;
    const role = session.roles?.[roleId];
    const assignee = role?.assignedTo || 'You (Primary Responder)';
    updateSquadRoleInFirestore(session.id, roleId, assignee, 'completed');
  };

  const renderStackContent = () => (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* 1. Pinned Top Section: Two Side-by-Side QR Tiles + Progress Row (Never Scrolls Away) */}
      <div className="sticky top-0 z-10 px-3 pt-2.5 pb-2 bg-surface border-b border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            {copy.rescueToolkit}
          </h2>

          {variant === 'sidebar' ? (
            <button
              type="button"
              onClick={() => setIsCollapsedRail(true)}
              className="h-8 w-8 min-h-[32px] min-w-[32px] rounded-lg bg-base hover:bg-border/50 border border-border text-ink-muted hover:text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Collapse Rescue toolkit sidebar"
              title="Collapse sidebar"
            >
              <PanelRightClose className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 min-h-[40px] min-w-[40px] rounded-xl bg-base hover:bg-border/50 border border-border text-ink flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close Rescue toolkit"
                title="Close"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )
          )}
        </div>

        {/* Two Equal Tiles Side by Side: "Bystanders" and "Paramedic" (One Label Only) */}
        <div className="grid grid-cols-2 gap-2">
          <QRTile
            label={copy.bystandersQrLabel}
            qrSvg={session?.qrSvg || ''}
            idValue={session?.id || ''}
            modalTitle="Bystander Squad QR"
            modalSubtitle="Point any phone camera to join and claim a rescue task. Zero install required."
            onCopy={handleCopySquadLink}
            copied={copiedSquadLink}
            copyLabel="Copy Link"
            onDownload={handleDownloadSquadSVG}
            extraModalAction={{
              label: copy.loudspeakerLabel,
              activeLabel: copy.stopLoudspeakerLabel,
              isActive: isAnnouncing,
              icon: isAnnouncing ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ),
              onClick: handleToggleAnnounce
            }}
            externalOpen={railModalTarget === 'bystanders' ? true : undefined}
            onExternalClose={() => setRailModalTarget(null)}
          />

          <QRTile
            label={copy.paramedicQrLabel}
            qrSvg={handout?.qrSvg || ''}
            idValue={handout?.handoutId || ''}
            modalTitle="Paramedic Handover QR"
            modalSubtitle="Offline SBAR docket for arriving ambulance e-PCR scanner or phone camera."
            onCopy={handleCopyHandoutSBAR}
            copied={copiedHandoutSBAR}
            copyLabel="Copy SBAR"
            onDownload={handleDownloadHandoutSVG}
            extraModalAction={{
              label: 'Speak Handover for Medic',
              activeLabel: 'Stop Speech',
              isActive: isSpeakingSBAR,
              icon: isSpeakingSBAR ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ),
              onClick: handleToggleSpeakSBAR
            }}
            externalOpen={railModalTarget === 'paramedic' ? true : undefined}
            onExternalClose={() => setRailModalTarget(null)}
          />
        </div>

        {/* 2. Squad Progress Row + Slim Progress Bar + Loudspeaker Button */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-2 text-[14px] font-semibold text-ink tabular-nums">
            <span>
              {copy.doneOfTotal(completedTasks, totalTasks)}
            </span>
            <button
              type="button"
              onClick={handleToggleAnnounce}
              className="inline-flex h-8 min-h-[32px] items-center gap-1.5 px-2.5 rounded-lg bg-base hover:bg-primary-soft border border-border text-[13px] font-semibold text-ink hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title={isAnnouncing ? copy.stopLoudspeakerLabel : copy.loudspeakerLabel}
              aria-label={isAnnouncing ? copy.stopLoudspeakerLabel : copy.loudspeakerLabel}
            >
              {isAnnouncing ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-alert shrink-0" aria-hidden="true" />
                  <span>{copy.stopLoudspeakerLabel}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span>{copy.loudspeakerLabel}</span>
                </>
              )}
            </button>
          </div>

          <div
            role="progressbar"
            aria-valuenow={completedTasks}
            aria-valuemin={0}
            aria-valuemax={totalTasks}
            aria-label="Squad tasks completed"
            className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden"
          >
            <div
              style={{ width: `${Math.max(4, progressPct)}%` }}
              className="h-full bg-primary rounded-full transition-all duration-150"
            />
          </div>
        </div>
      </div>

      {/* 3. The Sidebar's ONLY Scroll Area: Task List + Collapsed Handover Summary */}
      <div
        data-scroll-container="sidebar-tasks"
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 space-y-2"
      >
        <div className="space-y-1.5" role="list" aria-label="Bystander rescue tasks">
          {rolesList.map((role, index) => (
            <div key={role.id} role="listitem">
              <TaskRow
                role={role}
                index={index}
                isExpanded={expandedTaskId === role.id}
                onToggleExpand={() =>
                  setExpandedTaskId((prev) => (prev === role.id ? null : role.id))
                }
                onMarkComplete={handleMarkTaskComplete}
              />
            </div>
          ))}
        </div>

        {handout && <HandoverSummary handout={handout} />}
      </div>
    </div>
  );

  /* ==========================================================================
   * DESKTOP SIDEBAR (>= 1280px): 330px Fixed (within 320–340px budget) or 72px Rail
   * ========================================================================== */
  if (variant === 'sidebar') {
    if (isCollapsedRail) {
      return (
        <aside
          aria-label="Rescue toolkit rail"
          className="hidden xl:flex w-[72px] shrink-0 h-full min-h-0 border-l border-border bg-surface flex-col items-center py-3 gap-3 select-none"
        >
          <button
            type="button"
            onClick={() => setIsCollapsedRail(false)}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-base hover:bg-primary-soft border border-border text-ink hover:text-primary flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Expand Rescue toolkit sidebar"
            title="Expand Rescue toolkit"
          >
            <PanelRightOpen className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCollapsedRail(false);
              setRailModalTarget('bystanders');
            }}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-base hover:bg-primary-soft border border-border text-primary flex flex-col items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open Bystanders QR code"
            title="Bystanders QR"
          >
            <Users className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCollapsedRail(false);
              setRailModalTarget('paramedic');
            }}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl bg-base hover:bg-primary-soft border border-border text-primary flex flex-col items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Open Paramedic Handover QR code"
            title="Paramedic QR"
          >
            <QrCode className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsedRail(false)}
            className="px-2 py-1 rounded-lg bg-primary-soft text-primary text-[14px] font-bold tabular-nums border border-primary/25 cursor-pointer"
            aria-label={`${completedTasks} of ${totalTasks} tasks done. Expand toolkit.`}
            title={`${completedTasks} of ${totalTasks} tasks done`}
          >
            {completedTasks}/{totalTasks}
          </button>
        </aside>
      );
    }

    return (
      <aside
        aria-label="Rescue toolkit"
        className="hidden xl:flex w-[330px] shrink-0 h-full min-h-0 border-l border-border bg-base flex-col overflow-hidden"
      >
        {renderStackContent()}
      </aside>
    );
  }

  /* ==========================================================================
   * TABLET & MOBILE BOTTOM SHEET (< 1280px)
   * ========================================================================== */
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rescue toolkit"
      className="fixed inset-0 z-50 xl:hidden flex flex-col justify-end bg-navy/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-2xl mx-auto h-[90dvh] max-h-[90dvh] rounded-t-[24px] bg-base border-t border-x border-border shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0]?.clientY ?? null;
          }}
          onTouchEnd={(e) => {
            const startY = touchStartYRef.current;
            const endY = e.changedTouches[0]?.clientY ?? null;
            if (startY !== null && endY !== null && endY - startY > 60) {
              onClose?.();
            }
            touchStartYRef.current = null;
          }}
          onClick={onClose}
          className="w-full py-2.5 bg-surface flex items-center justify-center cursor-pointer shrink-0"
          title="Swipe down or tap to close"
        >
          <span className="w-12 h-1.5 rounded-full bg-border" aria-hidden="true" />
        </div>

        {renderStackContent()}
      </div>
    </div>
  );
};
