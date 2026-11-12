import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  MapPin
} from 'lucide-react';
import {
  BystanderSquadSession,
  broadcastCrowdAudioAnnouncement,
  SquadTaskRole
} from '../../services/bystanderSquadEngine';
import { subscribeToSquadSession, EmergencySquadSession } from '../../firebase/db';
import { Button } from '../common/DesignSystem';
import { CountdownRing } from '../common/CountdownRing';
import { QRCard } from './QRCard';
import { TaskCard } from './TaskCard';

export interface BystanderSquadCardProps {
  session: BystanderSquadSession;
  defaultExpanded?: boolean;
}

export const BystanderSquadCard: React.FC<BystanderSquadCardProps> = ({
  session: initialSession
}) => {
  const [session, setSession] = useState<EmergencySquadSession | BystanderSquadSession>(
    initialSession
  );
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Sync when prop session changes
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Subscribe to real-time updates for this squad in Firestore
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
    const rawOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'https://sanjeevani-v2.web.app';
    const origin =
      rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1')
        ? 'https://sanjeevani-v2.web.app'
        : rawOrigin;
    const link = `${origin}/?squad=${session.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(session.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
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
  const totalTasks = rolesList.length || 5;
  const completedTasks = rolesList.filter((r) => r.status === 'completed').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="w-full space-y-5 text-ink">
      {/* 1. Header: Title, Neutral ID Chip with Copy Icon, Progress Line + Thin Primary Bar + Ring */}
      <div className="p-4 rounded-[18px] bg-surface border border-border shadow-2xs space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold tracking-tight text-ink">
                Bystander Squad QR
              </h3>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base hover:bg-primary-soft border border-border text-sm font-medium text-ink-muted hover:text-ink tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Copy Squad ID"
                aria-label={`Copy Squad ID ${session.id}`}
              >
                <span>{session.id}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-sm font-medium text-ink-muted tabular-nums">
              {completedTasks} of {totalTasks} tasks complete
            </p>
          </div>

          <CountdownRing
            size="xs"
            label={`${completedTasks}/${totalTasks}`}
            progress={progressPct}
          />
        </div>

        {/* Thin Primary Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={completedTasks}
          aria-valuemin={0}
          aria-valuemax={totalTasks}
          aria-label="Bystander squad task completion"
          className="w-full h-2 rounded-full bg-base border border-border/60 overflow-hidden"
        >
          <div
            style={{ width: `${Math.max(4, progressPct)}%` }}
            className="h-full bg-primary rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* 2. Centered White QR Card with Corner Brackets & Action Row */}
      <QRCard
        qrSvg={session.qrSvg || ''}
        idLabel={session.id}
        modalEyebrow="Crowd Task Assignment Beacon"
        modalTitle={`Squad ${session.id}`}
        modalSubtitle="Hold phone high for onlookers to scan with their camera. Zero download required."
        caption="Zero-install onboarding: point any phone camera to join"
        onCopy={handleCopyLink}
        copied={copiedLink}
        copyLabel="Copy"
        onDownload={handleDownloadSVG}
        primaryModalAction={{
          label: 'Broadcast Crowd Audio',
          activeLabel: 'Stop Loudspeaker',
          isActive: isAnnouncing,
          icon: isAnnouncing ? (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          ),
          onClick: handleToggleAnnounce
        }}
      />

      {/* 3. Broadcast Crowd Audio Button (Secondary / Alert, no orange) */}
      <Button
        type="button"
        variant={isAnnouncing ? 'alert' : 'secondary'}
        size="sm"
        fullWidth
        onClick={handleToggleAnnounce}
      >
        {isAnnouncing ? (
          <>
            <VolumeX className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Stop Loudspeaker</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Broadcast Crowd Audio</span>
          </>
        )}
      </Button>

      {/* Optional Scene Photo Summary */}
      {session.photoPreviewUrl && (
        <div className="flex items-center gap-3 p-3.5 rounded-[16px] bg-surface border border-border shadow-2xs">
          <img
            src={session.photoPreviewUrl}
            alt="Emergency scene visual"
            className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary block">
              Scene Photo · AI Verified
            </span>
            <p className="text-sm font-medium text-ink leading-snug">
              {session.incidentSummary}
            </p>
          </div>
        </div>
      )}

      {/* 4. Vertical Task Checklist (No nested inner scrollbar) */}
      <div className="space-y-3" role="list" aria-label="Bystander rescue tasks">
        {rolesList.map((role, index) => (
          <div key={role.id} role="listitem">
            <TaskCard role={role} index={index} />
          </div>
        ))}
      </div>

      {/* 5. Compact GPS Chip */}
      {session.locationAddress && (
        <div className="px-3.5 py-2.5 rounded-xl bg-base border border-border text-sm text-ink-muted flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <span className="break-words leading-snug">
            Scene GPS: {session.locationAddress}
          </span>
        </div>
      )}
    </div>
  );
};
