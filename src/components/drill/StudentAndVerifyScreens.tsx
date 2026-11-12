import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  HeartPulse,
  PhoneCall,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import { Badge, Button, Card } from '../common/DesignSystem';
import { DrillBanner, RoleCard } from './SharedDrillComponents';
import {
  CertificateRecord,
  DrillRecord,
  DrillRunRecord,
  drillService
} from '../../services/drillService';
import {
  DEFAULT_PROGRAM_TARGETS,
  DRILL_SCENARIOS,
  SquadRoleId,
  getNextPracticeRecommendation
} from '../../services/drillEngine';
import {
  CprSample,
  cprRateEstimator
} from '../../utils/cprRateEstimator';
import {
  REQUIRED_CERTIFICATE_CAVEAT,
  downloadCertificatesPdf
} from '../../utils/certificatePdf';
import { audioEngine } from '../../utils/audio';

/* ============================================================================
 * 1. STUDENT JOIN & LIVE DRILL TASK SCREEN (/join/:classCode & /drill/:runToken)
 * ============================================================================ */
export interface StudentDrillScreenProps {
  classCodeOrRunToken: string;
  mode: 'join' | 'drill';
  onNavigate: (path: string) => void;
  onOpenProtocol: (slug: string) => void;
  onRealEmergencyExit: () => void;
}

export const StudentDrillScreen: React.FC<StudentDrillScreenProps> = ({
  classCodeOrRunToken,
  mode,
  onNavigate,
  onOpenProtocol,
  onRealEmergencyExit
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const store = drillService.getStore();

  // Resolve either by runToken or by classCode (strictly real classes/drills only)
  const resolvedRunPair = drillService.findRunByTokenOrId(classCodeOrRunToken);
  const resolvedClass =
    !resolvedRunPair && mode === 'join'
      ? drillService.findClassByJoinCodeOrId(classCodeOrRunToken)
      : resolvedRunPair
      ? store.classes[resolvedRunPair.drill.classId]
      : undefined;

  // Find active/latest drill for this class if joining via /join/:classCode
  const activeDrill: DrillRecord | null = resolvedRunPair
    ? resolvedRunPair.drill
    : resolvedClass
    ? Object.values(store.drills)
        .filter((d) => d.classId === resolvedClass.id)
        .sort(
          (a, b) =>
            (b.startedAt ?? b.scheduledAt) - (a.startedAt ?? a.scheduledAt)
        )[0] ?? null
    : null;

  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(0);
  const activeRun: DrillRunRecord | null = resolvedRunPair
    ? resolvedRunPair.run
    : activeDrill?.runs[selectedTeamIdx] ?? activeDrill?.runs[0] ?? null;

  const roster = resolvedClass ? store.rosters[resolvedClass.id] ?? [] : [];
  const [studentCode, setStudentCode] = useState<string>(
    roster[0]?.code || 'S-01'
  );
  const [selectedRole, setSelectedRole] = useState<SquadRoleId>('112_caller');
  const [hasJoinedRun, setHasJoinedRun] = useState<boolean>(false);
  const [slotJoinError, setSlotJoinError] = useState<string | null>(null);

  // Simulated 112 state
  const [simulated112Banner, setSimulated112Banner] = useState<string | null>(
    null
  );

  // CPR Rhythm Coach state (accelerometer + tap fallback)
  const [cprSamples, setCprSamples] = useState<CprSample[]>([]);
  const [cprActive, setCprActive] = useState<boolean>(false);
  const [motionPermissionState, setMotionPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'unsupported'
  >('prompt');
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(
    null
  );

  // Handover checklist state
  const [handoverChecks, setHandoverChecks] = useState({
    incidentType: true,
    t0Recorded: true,
    actionsSummary: true,
    cprSummary: true
  });

  const scenario =
    DRILL_SCENARIOS[activeDrill?.scenarioId || 'cardiac-arrest-unresponsive'] ??
    DRILL_SCENARIOS['cardiac-arrest-unresponsive'];

  const liveCprSummary = cprRateEstimator(cprSamples, {
    minBpm: 100,
    maxBpm: 120
  });

  useEffect(() => {
    return () => {
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
      }
      audioEngine.stopMetronome();
    };
  }, []);

  const handleJoinAndClaimRole = async (roleId: SquadRoleId) => {
    setSelectedRole(roleId);
    setSlotJoinError(null);
    if (!activeDrill || !activeRun) {
      setSlotJoinError(
        'No active practice drill found for this class code. Ask your teacher to start a live Practice Drill from their Teacher Dashboard.'
      );
      return;
    }
    if (activeDrill.status !== 'live') {
      drillService.startLiveDrill(activeDrill.id);
    }
    const res = await drillService.joinDrillRunAsStudent({
      runTokenOrId: activeRun.runToken,
      studentCode,
      roleId
    });
    if (!res || res.slotLockedError) {
      setSlotJoinError(res?.slotLockedError || 'Could not claim roster slot.');
      return;
    }
    setHasJoinedRun(true);
  };

  /**
   * Non-negotiable invariant #2:
   * In drill mode the 112 action is SIMULATED. It must never open tel:, never call,
   * never show real dispatch UI. It logs a "call112_confirmed" event and shows
   * "Practice: 112 call simulated".
   */
  const handleSimulate112Call = () => {
    if (!activeDrill || !activeRun) return;
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'call112_confirmed',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: '112_caller',
      payload: {
        note: 'Practice: 112 call simulated'
      }
    });
    setSimulated112Banner('Practice: 112 call simulated');
  };

  const requestAccelerometerPermission = async () => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setMotionPermissionState('unsupported');
      return;
    }
    const DM = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DM.requestPermission === 'function') {
      try {
        const res = await DM.requestPermission();
        setMotionPermissionState(res);
        if (res === 'granted') {
          attachAccelerometerListener();
        }
      } catch {
        setMotionPermissionState('denied');
      }
    } else {
      setMotionPermissionState('granted');
      attachAccelerometerListener();
    }
  };

  const attachAccelerometerListener = () => {
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
    }
    const handler = (ev: DeviceMotionEvent) => {
      const acc = ev.accelerationIncludingGravity || ev.acceleration;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      setCprSamples((prev) => [
        ...prev.slice(-600),
        {
          tMs: Date.now(),
          magnitude: mag,
          source: 'accelerometer'
        }
      ]);
    };
    motionHandlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
  };

  const handleStartCprCoach = () => {
    if (!activeDrill || !activeRun) return;
    setCprActive(true);
    setCprSamples([]);
    audioEngine.startMetronome(110);
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'cpr_started',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'cpr_compressor'
    });
  };

  const handleTapCompression = () => {
    if (!cprActive) {
      handleStartCprCoach();
    }
    const now = Date.now();
    setCprSamples((prev) => [
      ...prev,
      {
        tMs: now,
        source: 'tap'
      }
    ]);
  };

  const handleStopAndSaveCprSample = () => {
    setCprActive(false);
    audioEngine.stopMetronome();
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    if (!activeDrill || !activeRun) return;
    const est = cprRateEstimator(cprSamples);
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'cpr_rate_sample',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'cpr_compressor',
      payload: {
        bpm: est.medianBpm,
        inRangePct: est.inRangePct,
        longestPauseSec: est.longestPauseSec,
        source: est.source,
        samples: cprSamples
      }
    });
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'cpr_stopped',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'cpr_compressor'
    });
  };

  const handleConfirmAed = () => {
    if (!activeDrill || !activeRun) return;
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'aed_confirmed',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'aed_runner'
    });
  };

  const handleConfirmCrowdAndHandover = () => {
    if (!activeDrill || !activeRun) return;
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'crowd_controlled',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'crowd_airway'
    });
    drillService.recordDrillEvent({
      drillId: activeDrill.id,
      runId: activeRun.id,
      type: 'handover_generated',
      actorUid: `anon-${studentCode}`,
      studentCode,
      roleId: 'crowd_airway',
      payload: {
        handoverFields: { ...handoverChecks }
      }
    });
  };

  const elapsedSec =
    activeDrill?.startedAt && activeDrill.status === 'live'
      ? Math.max(0, Math.floor((Date.now() - activeDrill.startedAt) / 1000))
      : 0;
  const offlineCount = drillService.getOfflineQueueCount();

  const [manualJoinInput, setManualJoinInput] = useState(classCodeOrRunToken);

  if (!resolvedClass && !activeDrill) {
    return (
      <div className="min-h-screen bg-base text-ink pb-16">
        <DrillBanner onRealEmergencyExit={onRealEmergencyExit} compact />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <Card className="p-6 sm:p-8 space-y-4 text-center">
            <Smartphone className="w-10 h-10 text-primary mx-auto" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
              Enter Active Classroom Drill Code
            </h1>
            <p className="text-sm text-ink-muted">
              No active classroom drill was found for code{' '}
              <span className="font-mono font-bold text-ink">
                {classCodeOrRunToken || '—'}
              </span>
              . Enter the 10-character class or live drill code displayed on your teacher&apos;s screen.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualJoinInput.trim()) {
                  onNavigate(`/join/${manualJoinInput.trim().toUpperCase()}`);
                }
              }}
              className="flex flex-col sm:flex-row gap-2.5 pt-2"
            >
              <input
                type="text"
                value={manualJoinInput}
                onChange={(e) => setManualJoinInput(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XX"
                required
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-border bg-base font-mono text-sm font-bold text-ink uppercase"
              />
              <Button type="submit" variant="primary" size="sm">
                <span>Join Drill</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink pb-16">
      <DrillBanner
        onRealEmergencyExit={onRealEmergencyExit}
        compact
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {slotJoinError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-alert/10 border border-alert/35 text-xs sm:text-sm font-bold text-alert flex flex-wrap items-center justify-between gap-2"
          >
            <span>{slotJoinError}</span>
            <button
              type="button"
              onClick={() => setSlotJoinError(null)}
              className="underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {offlineCount > 0 && (
          <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-amber-500/40 text-xs sm:text-sm font-bold text-[#B45309] flex flex-wrap items-center justify-between gap-2">
            <span>
              Offline Event Queue: {offlineCount} practice event(s) saved locally on this device.
            </span>
            <button
              type="button"
              onClick={() => drillService.flushOfflineDrillEvents()}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border text-ink text-xs font-bold cursor-pointer"
            >
              Sync Queued Events Now
            </button>
          </div>
        )}

        {/* Header Card */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">
                  Class {resolvedClass?.name || '8-B'} • {activeRun?.teamName || 'Team 1'}
                </Badge>
                <span className="text-xs font-mono text-ink-muted">
                  Token: {activeRun?.runToken || classCodeOrRunToken}
                </span>
                {activeDrill?.activeJoinCode && (
                  <span className="text-xs font-mono font-bold text-primary">
                    Join Code: {activeDrill.activeJoinCode}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink mt-2">
                {scenario.title}
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                {scenario.summary}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="px-3.5 py-2 rounded-xl bg-base border border-border text-right font-mono tabular-nums">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-ink-muted block">
                  Practice Drill Timer
                </span>
                <span className="text-xl font-extrabold text-primary">
                  {Math.floor(elapsedSec / 60)}:
                  {String(elapsedSec % 60).padStart(2, '0')}
                </span>
              </div>
              {activeRun && (
                <button
                  type="button"
                  onClick={() => onNavigate(`/drill/${activeRun.runToken}/result`)}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Team Result</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Teacher-Assigned Roster Slot & Team Selector (Pseudonymous Student Codes) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
            <div>
              <label
                htmlFor="student-code-select"
                className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1"
              >
                Teacher-Assigned Roster Slot
              </label>
              <select
                id="student-code-select"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-mono font-bold text-ink"
              >
                {(roster.length > 0
                  ? roster.map((r) => r.code)
                  : ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-07', 'S-08']
                ).map((code) => (
                  <option key={code} value={code}>
                    {code} (Teacher-Assigned Slot)
                  </option>
                ))}
              </select>
            </div>

            {activeDrill && activeDrill.runs.length > 1 && (
              <div>
                <label
                  htmlFor="team-select"
                  className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1"
                >
                  Squad Team
                </label>
                <select
                  id="team-select"
                  value={selectedTeamIdx}
                  onChange={(e) => setSelectedTeamIdx(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
                >
                  {activeDrill.runs.map((r, idx) => (
                    <option key={r.id} value={idx}>
                      {r.teamName} ({r.runToken})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => handleJoinAndClaimRole(selectedRole)}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {hasJoinedRun ? `Active as ${studentCode}` : `Bind Slot & Claim Role (${studentCode})`}
                </span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Step 1: Claim Your Squad Role */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              1. Select &amp; Claim Your Squad Role
            </h2>
            <span className="text-xs text-ink-muted">
              Tap a role card to claim it for {studentCode}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenario.roles.map((role) => {
              const claimer = activeRun?.teamMembers.find(
                (m) => m.roleId === role.id
              );
              const evDone = activeRun?.events.find(
                (e) => e.type === role.eventType
              );
              const doneSec =
                evDone && activeRun?.startedAt
                  ? Math.max(
                      0,
                      Math.round((evDone.clientAt - activeRun.startedAt) / 1000)
                    )
                  : null;

              return (
                <RoleCard
                  key={role.id}
                  role={role}
                  claimedByStudentCode={claimer?.studentCode ?? null}
                  completedAtSec={doneSec}
                  isSelected={selectedRole === role.id}
                  onSelect={() => handleJoinAndClaimRole(role.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Step 2: Active Role Task Execution Panel */}
        <Card className="p-5 sm:p-6 space-y-5 border-2 border-primary/35">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Active Practice Task • {studentCode}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-ink">
                {scenario.roles.find((r) => r.id === selectedRole)?.title}
              </h3>
            </div>
            <Badge variant="soft">Mode: Practice Drill</Badge>
          </div>

          {/* ROLE A: SIMULATED 112 CALLER */}
          {selectedRole === '112_caller' && (
            <div className="space-y-4">
              <p className="text-sm text-ink leading-relaxed">
                Confirm the person is unresponsive and not breathing normally. Tap the button below to log a{' '}
                <strong>simulated 112 call</strong>. In Drill Mode, this action never dials your phone.
              </p>

              <Button
                variant="primary"
                onClick={handleSimulate112Call}
                className="w-full sm:w-auto min-h-[52px]"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Simulate 112 Call &amp; Confirm Campus Location</span>
              </Button>

              {simulated112Banner && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-4 rounded-xl bg-primary-soft border border-primary/30 flex items-center gap-3 text-ink"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{simulated112Banner}</p>
                    <p className="text-xs text-ink-muted">
                      Event &ldquo;call112_confirmed&rdquo; logged to {activeRun?.teamName || 'Team 1'}. No real telephone call was placed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLE B: CPR RHYTHM COACH (Accelerometer + Tap Fallback) */}
          {selectedRole === 'cpr_compressor' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-base border border-border text-xs sm:text-sm text-ink-muted flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Honest sensor note:</strong> Phone sensors measure compression <strong>rate (BPM)</strong> and pauses only — never chest depth. Target: <strong>100–120 BPM</strong>.
                </span>
                <button
                  type="button"
                  onClick={requestAccelerometerPermission}
                  className="min-h-[36px] px-3 py-1 rounded-lg border border-primary text-primary font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {motionPermissionState === 'granted'
                      ? 'Accelerometer Active'
                      : 'Enable Phone Motion Sensor'}
                  </span>
                </button>
              </div>

              {/* Central Thumb-Zone Tap & Cadence Pad */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-base border border-border space-y-4">
                <div className="grid grid-cols-3 gap-3 w-full max-w-md text-center font-mono tabular-nums">
                  <div className="p-2.5 rounded-xl bg-surface border border-border">
                    <span className="text-[10px] font-sans font-bold uppercase text-ink-muted block">
                      Median BPM
                    </span>
                    <span className="text-xl font-extrabold text-ink">
                      {liveCprSummary.medianBpm || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface border border-border">
                    <span className="text-[10px] font-sans font-bold uppercase text-ink-muted block">
                      In 100–120 BPM
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {liveCprSummary.inRangePct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface border border-border">
                    <span className="text-[10px] font-sans font-bold uppercase text-ink-muted block">
                      Max Pause
                    </span>
                    <span className="text-xl font-extrabold text-ink">
                      {liveCprSummary.longestPauseSec}s
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTapCompression}
                  className="w-full max-w-sm min-h-[96px] rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-lg shadow-md flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <HeartPulse className="w-7 h-7" />
                  <span>
                    {cprActive
                      ? `TAP IN RHYTHM (${liveCprSummary.compressionCount} pushes)`
                      : 'START CPR & TAP ALONG'}
                  </span>
                  <span className="text-xs font-normal text-white/85">
                    Works with on-screen thumb taps or phone accelerometer peaks
                  </span>
                </button>

                {cprSamples.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleStopAndSaveCprSample}
                      className="min-h-[38px] px-4 py-1.5 rounded-xl bg-ink text-surface text-xs font-bold cursor-pointer"
                    >
                      Save CPR Cadence Sample to Team Run ({cprSamples.length} compressions)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROLE C: AED & KIT RUNNER */}
          {selectedRole === 'aed_runner' && (
            <div className="space-y-4">
              <p className="text-sm text-ink leading-relaxed">
                Retrieve the school AED and first-aid kit from the designated cabinet, return to the patient, and confirm arrival below.
              </p>
              <Button variant="primary" onClick={handleConfirmAed}>
                <Zap className="w-5 h-5" />
                <span>I Have the AED &amp; Kit at Scene</span>
              </Button>
            </div>
          )}

          {/* ROLE D: CROWD CONTROL & HANDOVER SCRIBE */}
          {selectedRole === 'crowd_airway' && (
            <div className="space-y-4">
              <p className="text-sm text-ink leading-relaxed">
                Keep a 2-meter clear perimeter around the patient and verify all 4 paramedic handover fields before submitting.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'incidentType', label: '1. Suspected cardiac arrest noted' },
                  { key: 't0Recorded', label: '2. Collapse time (t0) recorded' },
                  { key: 'actionsSummary', label: '3. Simulated 112 & AED status logged' },
                  { key: 'cprSummary', label: '4. Continuous CPR tempo & pauses logged' }
                ].map((item) => {
                  const k = item.key as keyof typeof handoverChecks;
                  return (
                    <label
                      key={item.key}
                      className="min-h-[44px] p-3 rounded-xl bg-base border border-border flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-ink cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={handoverChecks[k]}
                        onChange={(e) =>
                          setHandoverChecks((prev) => ({
                            ...prev,
                            [k]: e.target.checked
                          }))
                        }
                        className="w-4 h-4 accent-primary"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <Button variant="primary" onClick={handleConfirmCrowdAndHandover}>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Perimeter &amp; Generate Handover Docket</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Bottom CTA to finish & view student result screen */}
        {activeRun && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-ink-muted">
              Events logged in this run: <strong>{activeRun.events.length}</strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate(`/drill/${activeRun.runToken}/result`)}
            >
              <span>Complete &amp; View Team Result</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. STUDENT RESULT SCREEN (/drill/:runToken/result)
 * Phone-first team result page:
 * - Team score (0-100) + plain-language summary
 * - 5-step horizontal timeline vs program targets
 * - Student's own role card & timestamps
 * - 1 plain-rule "Next time" tip with direct link to First-Aid Library protocol
 * - Zero individual rankings, zero comparison to other teams, zero social share
 * ============================================================================ */
export interface StudentResultScreenProps {
  runToken: string;
  onNavigate: (path: string) => void;
  onOpenProtocol: (slug: string) => void;
  onRealEmergencyExit: () => void;
}

export const StudentResultScreen: React.FC<StudentResultScreenProps> = ({
  runToken,
  onNavigate,
  onOpenProtocol,
  onRealEmergencyExit
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const found = drillService.findRunByTokenOrId(runToken);
  const store = drillService.getStore();
  const drill = found?.drill;
  const run = found?.run;

  if (!drill || !run) {
    return (
      <div className="min-h-screen bg-base text-ink">
        <DrillBanner onRealEmergencyExit={onRealEmergencyExit} compact />
        <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
          <h1 className="text-xl font-bold">Drill Run Not Found</h1>
          <Button variant="primary" onClick={() => onNavigate('/teach')}>
            Back to Drill Home
          </Button>
        </div>
      </div>
    );
  }

  const school = store.schools[drill.schoolId];
  const targets = school?.settings.targets ?? DEFAULT_PROGRAM_TARGETS;
  const isScored = run.status === 'scored' && run.metrics && run.score !== null;

  const m = run.metrics;
  const tip = m
    ? getNextPracticeRecommendation(m, targets)
    : getNextPracticeRecommendation(
        {
          tCall112: null,
          tFirstCompression: null,
          cprInRangePct: 0,
          longestPauseSec: 0,
          tAedConfirmed: null,
          tRoleCoverage: null,
          handoverComplete: false
        },
        targets
      );

  const steps = [
    {
      label: 'Roles Claimed',
      actual: m?.tRoleCoverage !== null && m?.tRoleCoverage !== undefined ? `${m.tRoleCoverage}s` : 'Pending',
      target: `≤${targets.roleCoverageFullSec}s`,
      met:
        m?.tRoleCoverage !== null &&
        m?.tRoleCoverage !== undefined &&
        m.tRoleCoverage <= targets.roleCoverageFullSec
    },
    {
      label: '112 Simulated',
      actual: m?.tCall112 !== null && m?.tCall112 !== undefined ? `${m.tCall112}s` : 'Pending',
      target: `≤${targets.call112FullSec}s`,
      met:
        m?.tCall112 !== null &&
        m?.tCall112 !== undefined &&
        m.tCall112 <= targets.call112FullSec
    },
    {
      label: '1st Compression',
      actual:
        m?.tFirstCompression !== null && m?.tFirstCompression !== undefined
          ? `${m.tFirstCompression}s`
          : 'Pending',
      target: `≤${targets.firstCompressionFullSec}s`,
      met:
        m?.tFirstCompression !== null &&
        m?.tFirstCompression !== undefined &&
        m.tFirstCompression <= targets.firstCompressionFullSec
    },
    {
      label: 'AED Confirmed',
      actual:
        m?.tAedConfirmed !== null && m?.tAedConfirmed !== undefined
          ? `${m.tAedConfirmed}s`
          : 'Pending',
      target: `≤${targets.aedConfirmedTargetSec}s`,
      met:
        m?.tAedConfirmed !== null &&
        m?.tAedConfirmed !== undefined &&
        m.tAedConfirmed <= targets.aedConfirmedTargetSec
    },
    {
      label: 'Handover Ready',
      actual: m?.handoverComplete ? 'Complete (4/4)' : 'Incomplete',
      target: '4/4 fields',
      met: Boolean(m?.handoverComplete)
    }
  ];

  return (
    <div className="min-h-screen bg-base text-ink pb-16">
      <DrillBanner
        isDemo={drill.isDemo}
        onRealEmergencyExit={onRealEmergencyExit}
        compact
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!isScored ? (
          <Card className="p-6 text-center space-y-4">
            <Clock className="w-10 h-10 text-primary mx-auto animate-pulse" />
            <h1 className="text-xl font-extrabold text-ink">
              Scoring in progress… waiting for teacher to end drill
            </h1>
            <p className="text-sm text-ink-muted max-w-md mx-auto">
              This page updates automatically as soon as the drill ends and your team&apos;s timestamps are scored.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => drillService.endAndScoreDrill(drill.id)}
            >
              <span>End &amp; Score Drill Now (Practice Control)</span>
            </Button>
          </Card>
        ) : (
          <>
            {/* 1. Team Score & Plain-Language Summary */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="soft">
                    Class {drill.className} • {run.teamName}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">
                    Team Practice Result
                  </h1>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted block">
                    Team Readiness Score
                  </span>
                  <span className="text-4xl font-extrabold text-primary">
                    {run.score}/100
                  </span>
                </div>
              </div>

              <p className="text-base text-ink leading-relaxed bg-primary-soft/45 border border-primary/20 rounded-xl p-4">
                Your team started chest compressions in{' '}
                <strong className="font-mono">{m?.tFirstCompression ?? '—'}s</strong>, confirmed the simulated 112 call in{' '}
                <strong className="font-mono">{m?.tCall112 ?? '—'}s</strong>, and kept CPR rhythm in the 100–120 BPM range{' '}
                <strong className="font-mono">{m?.cprInRangePct ?? 0}%</strong> of the time.
              </p>
              <p className="text-xs text-ink-muted">
                Program target benchmark (not a clinical evaluation — targets to be confirmed by a certified first-aid instructor).
              </p>
            </Card>

            {/* 2. 5-Step Team Timeline */}
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-ink">
                5-Step Squad Response Timeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {steps.map((st, idx) => (
                  <div
                    key={st.label}
                    className={`p-3.5 rounded-xl border ${
                      st.met
                        ? 'bg-primary-soft/35 border-primary/40'
                        : 'bg-base border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs font-bold text-ink-muted">
                      <span>Step {idx + 1}</span>
                      {st.met ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-ink mt-1">
                      {st.label}
                    </div>
                    <div className="text-lg font-extrabold font-mono text-ink tabular-nums mt-0.5">
                      {st.actual}
                    </div>
                    <div className="text-[11px] font-mono text-ink-muted">
                      Target: {st.target}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Your Role Contributions */}
            <Card className="p-5 sm:p-6 space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Team Roles &amp; Logged Timestamps
              </h2>
              <div className="divide-y divide-border">
                {run.teamMembers.map((tm) => {
                  const memberEvents = run.events.filter(
                    (e) => e.studentCode === tm.studentCode && e.type !== 'run_ended'
                  );
                  return (
                    <div
                      key={tm.studentCode}
                      className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-base border border-border font-mono font-bold text-xs">
                          {tm.studentCode}
                        </span>
                        <span className="font-semibold text-ink">
                          {tm.roleId?.replace('_', ' ').toUpperCase() || 'Responder'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-muted">
                        {memberEvents.map((ev) => {
                          const sec = drill.startedAt
                            ? Math.max(
                                0,
                                Math.round((ev.clientAt - drill.startedAt) / 1000)
                              )
                            : 0;
                          return (
                            <span
                              key={ev.id}
                              className="px-2 py-0.5 rounded bg-surface border border-border"
                            >
                              {ev.type}: {sec}s
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 4. One Plain-Rule "Next Time" Tip + Library Link */}
            <Card className="p-5 sm:p-6 space-y-3 border-2 border-primary/35">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <BookOpen className="w-4 h-4" />
                <span>Next Time Focus (Rule-Based Tip)</span>
              </div>
              <h3 className="text-lg font-extrabold text-ink">{tip.headline}</h3>
              <p className="text-sm text-ink-muted">{tip.reason}</p>
              <p className="text-sm text-ink font-medium">{tip.actionTip}</p>
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenProtocol(tip.protocolSlug)}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open Protocol: {tip.protocolTitle}</span>
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. PUBLIC CERTIFICATE VERIFICATION PAGE (/verify/:certId)
 * Read-only, no login required, rate-limited.
 * Shows ONLY: valid/revoked badge, school name, class grade, drill date.
 * NEVER shows student name or student code on the public verification page.
 * ============================================================================ */
export interface CertificateVerifyScreenProps {
  certId: string;
  onNavigate: (path: string) => void;
}

export const CertificateVerifyScreen: React.FC<CertificateVerifyScreenProps> = ({
  certId,
  onNavigate
}) => {
  const [lookupInput, setLookupInput] = useState(certId);
  const [lookupCount, setLookupCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);

  const cert: CertificateRecord | null = rateLimited
    ? null
    : drillService.getCertificateById(lookupInput);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupCount >= 15) {
      setRateLimited(true);
      return;
    }
    setLookupCount((c) => c + 1);
    onNavigate(`/verify/${lookupInput.trim().toUpperCase()}`);
  };

  const handleDownloadSamplePdf = () => {
    if (!cert) return;
    downloadCertificatesPdf(
      [
        {
          certId: cert.certId,
          schoolName: cert.schoolName,
          className: cert.className,
          grade: cert.grade,
          drillDateIso: cert.drillDateIso,
          scenarioTitle: cert.scenarioTitle,
          studentIdentifier: cert.studentCode,
          rolePracticed: cert.rolePracticed,
          verifyUrl: `${window.location.origin}/verify/${cert.certId}`,
          isDemo: cert.isDemo
        }
      ],
      `sanjeevani-${cert.certId}.pdf`
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Public Verification Registry
            </span>
            <h1 className="text-2xl font-extrabold text-ink">
              Practice Drill Certificate Verification
            </h1>
          </div>
          <Badge variant="soft">Read-Only • Privacy-Preserving</Badge>
        </div>

        {/* Lookup Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value)}
            placeholder="Enter Certificate ID issued by your school"
            aria-label="Certificate ID"
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-border bg-base font-mono text-sm text-ink"
          />
          <Button type="submit" variant="primary" size="sm">
            <span>Verify ID</span>
          </Button>
        </form>

        {rateLimited ? (
          <div className="p-4 rounded-xl bg-alert/10 border border-alert/30 text-sm font-semibold text-alert">
            Too many verification requests. Please wait a minute before trying again.
          </div>
        ) : cert ? (
          <div className="space-y-5">
            {/* Valid vs Revoked Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                cert.revoked
                  ? 'bg-alert/10 border-alert/30 text-alert'
                  : 'bg-primary-soft/50 border-primary/30 text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                {cert.revoked ? (
                  <XCircle className="w-6 h-6 text-alert shrink-0" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                )}
                <div>
                  <span className="text-base font-extrabold block">
                    {cert.revoked
                      ? 'REVOKED — This participation record has been revoked by the school'
                      : 'VALID — Verified School Practice Drill Record'}
                  </span>
                  <span className="text-xs text-ink-muted font-mono">
                    ID: {cert.certId} {cert.isDemo ? '• [DEMO DATA]' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Non-Qualification Statement */}
            <div className="p-4 rounded-xl bg-base border border-border text-sm font-bold text-ink">
              {REQUIRED_CERTIFICATE_CAVEAT}
            </div>

            {/* Strictly Limited Public Fields (NO Student Name or Student Code) */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-base border border-border">
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  School Name
                </dt>
                <dd className="text-base font-bold text-ink mt-1">
                  {cert.schoolName}
                </dd>
              </div>

              <div className="p-3.5 rounded-xl bg-base border border-border">
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Class Grade
                </dt>
                <dd className="text-base font-bold text-ink mt-1">
                  Grade {cert.grade}
                </dd>
              </div>

              <div className="p-3.5 rounded-xl bg-base border border-border">
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Practice Drill Date
                </dt>
                <dd className="text-base font-bold font-mono text-ink mt-1">
                  {new Date(cert.drillDateIso).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </dd>
              </div>

              <div className="p-3.5 rounded-xl bg-base border border-border">
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Scenario Practised
                </dt>
                <dd className="text-base font-bold text-ink mt-1">
                  {cert.scenarioTitle}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <p className="text-xs text-ink-muted">
                Privacy protection: Student names and internal roster codes are never displayed on public verification pages.
              </p>
              {!cert.revoked && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadSamplePdf}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certificate PDF</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-base border border-border text-center space-y-2">
            <p className="text-base font-bold text-ink">
              {lookupInput
                ? `No certificate found matching "${lookupInput}"`
                : 'Enter a Certificate ID above to verify a school practice drill participation record'}
            </p>
            <p className="text-xs text-ink-muted">
              Certificates are generated when a teacher completes and scores a classroom practice drill and clicks &ldquo;Issue Certificates (PDF)&rdquo;.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
