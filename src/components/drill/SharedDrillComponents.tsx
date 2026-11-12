import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Database,
  Play,
  ShieldAlert,
  Table,
  TrendingUp,
  Users,
  WifiOff,
  RotateCcw,
  Trash2,
  Building2,
  GraduationCap,
  Award,
  BarChart3,
  UserPlus,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Badge, Button, Card } from '../common/DesignSystem';
import {
  ClassRecord,
  ClassStatsRecord,
  ClassTrendPoint,
  DrillRunRecord,
  drillService
} from '../../services/drillService';
import {
  DRILL_SCENARIOS,
  DrillEventType,
  ProgramTargets,
  ScenarioRoleSpec,
  guardSmallSample
} from '../../services/drillEngine';

/* ============================================================================
 * 1. PERSISTENT DRILL SAFETY BANNER
 * Non-negotiable invariant #3 & #5:
 * - Every drill screen shows a persistent "DRILL / PRACTICE" banner and a clear
 *   "This is a real emergency" button that exits the drill immediately and opens
 *   the normal 112 flow.
 * ============================================================================ */
export interface DrillBannerProps {
  isDemo?: boolean;
  onRealEmergencyExit: () => void;
  compact?: boolean;
}

export const DrillBanner: React.FC<DrillBannerProps> = ({
  onRealEmergencyExit
}) => {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      drillService.flushOfflineDrillEvents();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="print:hidden border-b border-border bg-surface sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-xs sm:text-sm font-bold tracking-wide uppercase">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>DRILL / PRACTICE MODE</span>
          </span>

          <span className="text-xs sm:text-sm font-medium text-ink-muted">
            112 calls are simulated. No real emergency dispatch is contacted.
          </span>

          {isOffline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-amber-500/40 text-[#B45309] text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Offline — events queued locally &amp; will sync automatically</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRealEmergencyExit}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-alert hover:bg-alert-dark text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This is a real emergency</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. DRILL WORKSPACE SUB-NAVIGATION BAR
 * Lets teachers, school admins, and students navigate all Drill Mode
 * routes cleanly while preserving deep links and multi-school switching.
 * ============================================================================ */
export interface DrillTopNavProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

export const DrillTopNav: React.FC<DrillTopNavProps> = ({
  activePath,
  onNavigate
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const store = drillService.getStore();
  const schools = Object.values(store.schools);
  const activeSchool = drillService.getActiveSchool();

  const schoolClasses = Object.values(store.classes).filter(
    (c) => (!activeSchool || c.schoolId === activeSchool.id) && !c.archived
  );
  const firstJoinCode = schoolClasses[0]?.joinCode || '';
  const firstCertId = Object.keys(store.certificates)[0] || '';

  const navItems = [
    {
      id: '/teach',
      label: 'Teacher Home',
      icon: <GraduationCap className="w-4 h-4" />,
      match: (p: string) => p === '/teach' || p.startsWith('/teach/')
    },
    {
      id: '/school',
      label: 'School Dashboard',
      icon: <Building2 className="w-4 h-4" />,
      match: (p: string) => p === '/school' || p.startsWith('/school/reports')
    },
    {
      id: '/school/members',
      label: 'Members & Invites',
      icon: <UserPlus className="w-4 h-4" />,
      match: (p: string) => p.startsWith('/school/members')
    },
    {
      id: firstJoinCode ? `/join/${firstJoinCode}` : '/join/',
      label: 'Student Drill View',
      icon: <Smartphone className="w-4 h-4" />,
      match: (p: string) => p.startsWith('/join/') || p.startsWith('/drill/')
    },
    {
      id: firstCertId ? `/verify/${firstCertId}` : '/verify/',
      label: 'Verify Certificate',
      icon: <Award className="w-4 h-4" />,
      match: (p: string) => p.startsWith('/verify/')
    },
    {
      id: '/platform',
      label: 'Pilot Evidence',
      icon: <BarChart3 className="w-4 h-4" />,
      match: (p: string) => p.startsWith('/platform')
    }
  ];

  return (
    <div className="print:hidden border-b border-border bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <nav
          aria-label="Drill Mode Views"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
        >
          {navItems.map((item) => {
            const active = item.match(activePath);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface text-ink hover:bg-primary-soft border border-border'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeSchool && (
            <div className="flex items-center gap-2">
              {schools.length > 1 ? (
                <select
                  aria-label="Switch Active School"
                  value={activeSchool.id}
                  onChange={(e) => drillService.setActiveSchool(e.target.value)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink cursor-pointer"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.verificationStatus === 'verified' ? 'Verified' : 'Unverified'})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink">
                  {activeSchool.name}
                </span>
              )}

              {activeSchool.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-soft border border-primary/30 text-primary text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified School</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-amber-500/40 text-[#B45309] text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {activeSchool.verificationStatus === 'pending'
                      ? 'Verification Pending (Invite-Only)'
                      : 'Unverified School (Invite-Only)'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. SCORE TILE COMPONENT
 * Enforces tabular numerals, small-sample suppression (n < 5), baseline delta,
 * and program target disclaimer.
 * ============================================================================ */
export interface ScoreTileProps {
  label: string;
  value: number | null;
  formattedValue: string;
  baselineValue?: number | null;
  formattedBaseline?: string;
  lowerIsBetter?: boolean;
  unit?: string;
  nStudents: number;
  targetCaption: string;
  onClick?: () => void;
}

export const ScoreTile: React.FC<ScoreTileProps> = ({
  label,
  value,
  formattedValue,
  baselineValue,
  formattedBaseline,
  lowerIsBetter = false,
  unit = '',
  nStudents,
  targetCaption,
  onClick
}) => {
  const guarded = guardSmallSample(value, formattedValue, nStudents, 5);

  let deltaLabel: string | null = null;
  let isImproved = false;

  if (
    !guarded.suppressed &&
    typeof value === 'number' &&
    typeof baselineValue === 'number'
  ) {
    const diff = Math.round((value - baselineValue) * 10) / 10;
    if (diff !== 0) {
      const sign = diff > 0 ? '+' : '';
      deltaLabel = `${sign}${diff}${unit} vs baseline (${formattedBaseline ?? baselineValue})`;
      isImproved = lowerIsBetter ? diff < 0 : diff > 0;
    } else {
      deltaLabel = `No change vs baseline (${formattedBaseline ?? baselineValue})`;
      isImproved = true;
    }
  }

  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between gap-3 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            {label}
          </span>
          <span className="text-xs font-mono text-ink-muted tabular-nums">
            n={nStudents}
          </span>
        </div>

        {guarded.suppressed || value === null ? (
          <div className="py-2">
            <span className="text-base font-bold text-ink-muted block">
              {nStudents < 5 ? 'Not enough data yet (n < 5)' : 'No completed drills'}
            </span>
          </div>
        ) : (
          <div className="text-3xl sm:text-4xl font-extrabold text-ink tabular-nums tracking-tight">
            {guarded.displayLabel}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border/70">
        {deltaLabel && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
              isImproved ? 'text-primary' : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {isImproved ? (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{deltaLabel}</span>
          </div>
        )}
        <p className="text-xs text-ink-muted leading-snug">{targetCaption}</p>
      </div>
    </Card>
  );
};

/* ============================================================================
 * 4. ROLE CARD COMPONENT
 * Used in Student Join/Task view and Teacher Live Control.
 * ============================================================================ */
export interface RoleCardProps {
  role: ScenarioRoleSpec;
  claimedByStudentCode?: string | null;
  completedAtSec?: number | null;
  isSelected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  claimedByStudentCode,
  completedAtSec,
  isSelected = false,
  onSelect,
  disabled = false
}) => {
  return (
    <Card
      interactive={Boolean(onSelect) && !disabled}
      onClick={!disabled ? onSelect : undefined}
      className={`p-4 sm:p-5 transition-all ${
        isSelected
          ? 'border-2 border-primary bg-primary-soft/40'
          : claimedByStudentCode
          ? 'border-primary/40 bg-surface'
          : 'border-border bg-surface'
      } ${onSelect && !disabled ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-ink">
              {role.title}
            </span>
            {claimedByStudentCode ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-primary-soft text-primary text-xs font-bold font-mono">
                Claimed: {claimedByStudentCode}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-lg bg-base border border-border text-ink-muted text-xs font-semibold">
                Unclaimed
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            {role.description}
          </p>
        </div>

        {typeof completedAtSec === 'number' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold font-mono tabular-nums shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedAtSec}s</span>
          </span>
        )}
      </div>
    </Card>
  );
};

/* ============================================================================
 * 5. ACCESSIBLE SVG TREND CHART + TABLE FALLBACK
 * Plots Readiness score and key timings across drills for a class.
 * Never relies on colour alone (uses distinct marker shapes + direct labels).
 * ============================================================================ */
export interface TrendChartProps {
  points: ClassTrendPoint[];
  targets: ProgramTargets;
  onSelectDrill?: (drillId: string) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  points,
  targets,
  onSelectDrill
}) => {
  const [showTable, setShowTable] = useState(false);

  if (!points || points.length === 0) {
    return (
      <Card className="p-6 text-center space-y-2">
        <p className="text-base font-bold text-ink">No completed drills yet</p>
        <p className="text-sm text-ink-muted">
          Run your first practice drill to establish a class baseline score and timing chart.
        </p>
      </Card>
    );
  }

  const width = 680;
  const height = 230;
  const padLeft = 48;
  const padRight = 32;
  const padTop = 28;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (i: number) =>
    points.length === 1
      ? padLeft + plotW / 2
      : padLeft + (i / (points.length - 1)) * plotW;

  // Score (0-100) mapped to Y
  const getScoreY = (score: number) =>
    padTop + plotH - (Math.min(100, Math.max(0, score)) / 100) * plotH;

  const scorePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getScoreY(pt.medianScore).toFixed(1)}`)
    .join(' ');

  const cprPath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getScoreY(pt.cprInRangePct).toFixed(1)}`)
    .join(' ');

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-ink">
            Baseline vs Follow-Up Progression
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted">
            Solid circle line = Readiness Score (0–100) • Dashed square line = CPR Rhythm in {targets.cprMinBpm}–{targets.cprMaxBpm} BPM (%)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-border bg-base hover:bg-primary-soft text-xs font-bold text-ink inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showTable ? 'Show Chart' : 'View as Table'}</span>
        </button>
      </div>

      {!showTable ? (
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Class readiness and CPR rhythm progression across drills"
            className="w-full h-auto min-w-[460px]"
          >
            {/* Horizontal grid lines at 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getScoreY(val);
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-border"
                    strokeDasharray={val === 70 ? '4 4' : undefined}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-current text-ink-muted text-[11px] font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Dashed line: CPR In-Range % */}
            <path
              d={cprPath}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.2"
              strokeDasharray="5 4"
            />

            {/* Solid line: Readiness Score */}
            <path
              d={scorePath}
              fill="none"
              stroke="#0E5A50"
              strokeWidth="3"
            />

            {/* Points & direct labels */}
            {points.map((pt, i) => {
              const cx = getX(i);
              const cyScore = getScoreY(pt.medianScore);
              const cyCpr = getScoreY(pt.cprInRangePct);
              return (
                <g
                  key={pt.drillId}
                  onClick={() => onSelectDrill?.(pt.drillId)}
                  className={onSelectDrill ? 'cursor-pointer' : ''}
                >
                  {/* Square marker for CPR in-range % */}
                  <rect
                    x={cx - 4.5}
                    y={cyCpr - 4.5}
                    width="9"
                    height="9"
                    fill="#D97706"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Circle marker for Readiness Score */}
                  <circle
                    cx={cx}
                    cy={cyScore}
                    r="6"
                    fill="#0E5A50"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cyScore - 10}
                    textAnchor="middle"
                    className="fill-current text-ink text-[11px] font-bold font-mono"
                  >
                    {pt.medianScore} pts
                  </text>

                  {/* X-axis label */}
                  <text
                    x={cx}
                    y={height - 18}
                    textAnchor="middle"
                    className="fill-current text-ink text-[11px] font-semibold"
                  >
                    {pt.label}
                  </text>
                  <text
                    x={cx}
                    y={height - 5}
                    textAnchor="middle"
                    className="fill-current text-ink-muted text-[10px] font-mono"
                  >
                    1st CPR: {pt.tFirstCompression ?? '—'}s (n={pt.studentsCount})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : null}

      {/* Accessible data table (always rendered when toggled or in print) */}
      <div className={`${showTable ? 'block' : 'hidden print:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2 pr-3 font-bold">Drill</th>
              <th className="py-2 px-3 font-bold">Date</th>
              <th className="py-2 px-3 font-bold text-right">Students (n)</th>
              <th className="py-2 px-3 font-bold text-right">Median Score</th>
              <th className="py-2 px-3 font-bold text-right">Simulated 112</th>
              <th className="py-2 px-3 font-bold text-right">1st Compression</th>
              <th className="py-2 pl-3 font-bold text-right">CPR in 100–120 BPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono tabular-nums">
            {points.map((pt) => (
              <tr
                key={pt.drillId}
                onClick={() => onSelectDrill?.(pt.drillId)}
                className={onSelectDrill ? 'hover:bg-base cursor-pointer' : ''}
              >
                <td className="py-2.5 pr-3 font-sans font-bold text-ink">{pt.label}</td>
                <td className="py-2.5 px-3 text-ink-muted">
                  {new Date(pt.at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="py-2.5 px-3 text-right">{pt.studentsCount}</td>
                <td className="py-2.5 px-3 text-right font-bold text-primary">
                  {pt.medianScore}/100
                </td>
                <td className="py-2.5 px-3 text-right">
                  {pt.tCall112 !== null ? `${pt.tCall112}s` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {pt.tFirstCompression !== null ? `${pt.tFirstCompression}s` : '—'}
                </td>
                <td className="py-2.5 pl-3 text-right">{pt.cprInRangePct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/* ============================================================================
 * 6. HORIZONTAL MULTI-TEAM TIMELINE CHART + TABLE FALLBACK
 * Plots each team's key events on a shared 0..durationSec axis alongside
 * the Ideal Program Target strip.
 * ============================================================================ */
export interface TimelineChartProps {
  runs: DrillRunRecord[];
  durationSec: number;
  scenarioId: string;
}

const EVENT_SHORT_MARKERS: Array<{
  type: DrillEventType;
  code: string;
  label: string;
}> = [
  { type: 'role_claimed', code: 'R', label: 'Roles Claimed' },
  { type: 'call112_confirmed', code: '112', label: 'Simulated 112' },
  { type: 'cpr_started', code: 'CPR', label: '1st Compression' },
  { type: 'crowd_controlled', code: 'C', label: 'Crowd Cleared' },
  { type: 'aed_confirmed', code: 'AED', label: 'AED at Scene' },
  { type: 'handover_generated', code: 'H', label: 'Handover Ready' }
];

export const TimelineChart: React.FC<TimelineChartProps> = ({
  runs,
  durationSec,
  scenarioId
}) => {
  const [showTable, setShowTable] = useState(false);
  const scenario =
    DRILL_SCENARIOS[scenarioId] ?? DRILL_SCENARIOS['cardiac-arrest-unresponsive'];
  const maxAxisSec = Math.max(120, durationSec);

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-ink">
            Team Response Timeline (0s – {maxAxisSec}s)
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted">
            Markers: <span className="font-mono font-bold">R</span>=All Roles •{' '}
            <span className="font-mono font-bold">112</span>=Simulated 112 •{' '}
            <span className="font-mono font-bold">CPR</span>=1st Compression •{' '}
            <span className="font-mono font-bold">AED</span>=AED Confirmed •{' '}
            <span className="font-mono font-bold">H</span>=Handover Docket
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-border bg-base hover:bg-primary-soft text-xs font-bold text-ink inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Table className="w-3.5 h-3.5" />
          <span>{showTable ? 'Show Visual Timeline' : 'View as Table'}</span>
        </button>
      </div>

      {!showTable && (
        <div className="space-y-3 overflow-x-auto">
          <div className="min-w-[540px] space-y-2.5">
            {/* Ideal Program Target Reference Bar */}
            <div className="grid grid-cols-12 items-center gap-3 bg-primary-soft/45 border border-primary/25 rounded-xl px-3 py-2.5">
              <div className="col-span-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                  Program Target
                </span>
                <span className="text-[11px] text-ink-muted">
                  Reference benchmark
                </span>
              </div>
              <div className="col-span-9 relative h-9 bg-surface rounded-lg border border-border">
                {Object.entries(scenario.idealTimelineSec).map(([evType, sec]) => {
                  const pct = Math.min(96, Math.max(3, (sec / maxAxisSec) * 100));
                  const spec = EVENT_SHORT_MARKERS.find((m) => m.type === evType);
                  if (!spec) return null;
                  return (
                    <div
                      key={evType}
                      style={{ left: `${pct}%` }}
                      className="absolute top-1 -translate-x-1/2 flex flex-col items-center"
                      title={`${spec.label}: ≤${sec}s`}
                    >
                      <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-mono font-bold leading-none">
                        {spec.code}:{sec}s
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* One horizontal bar per team run */}
            {runs.map((run) => {
              const m = run.metrics;
              const points: Array<{ code: string; sec: number | null; label: string }> = [
                { code: 'R', sec: m?.tRoleCoverage ?? null, label: 'Roles Claimed' },
                { code: '112', sec: m?.tCall112 ?? null, label: 'Simulated 112' },
                { code: 'CPR', sec: m?.tFirstCompression ?? null, label: '1st Compression' },
                { code: 'AED', sec: m?.tAedConfirmed ?? null, label: 'AED Confirmed' },
                { code: 'H', sec: m?.tHandoverGenerated ?? null, label: 'Handover Ready' }
              ];

              return (
                <div
                  key={run.id}
                  className="grid grid-cols-12 items-center gap-3 bg-base border border-border rounded-xl px-3 py-2.5"
                >
                  <div className="col-span-3 flex items-center justify-between pr-2">
                    <div>
                      <span className="text-sm font-bold text-ink block">
                        {run.teamName}
                      </span>
                      <span className="text-xs font-mono text-ink-muted">
                        {run.teamMembers.map((tm) => tm.studentCode).join(', ') || 'No students'}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-primary tabular-nums">
                      {run.score !== null ? `${run.score}` : '—'}
                    </span>
                  </div>

                  <div className="col-span-9 relative h-9 bg-surface rounded-lg border border-border">
                    {[30, 60, 90, 120].map((tick) => (
                      <div
                        key={tick}
                        style={{ left: `${(tick / maxAxisSec) * 100}%` }}
                        className="absolute top-0 bottom-0 border-l border-dashed border-border"
                      />
                    ))}

                    {points.map((pt) => {
                      if (pt.sec === null) return null;
                      const pct = Math.min(96, Math.max(3, (pt.sec / maxAxisSec) * 100));
                      return (
                        <div
                          key={pt.code}
                          style={{ left: `${pct}%` }}
                          className="absolute top-1.5 -translate-x-1/2"
                          title={`${pt.label}: ${pt.sec}s`}
                        >
                          <span className="px-1.5 py-0.5 rounded bg-ink text-surface text-[10px] font-mono font-bold leading-none whitespace-nowrap">
                            {pt.code}:{pt.sec}s
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`${showTable ? 'block' : 'hidden print:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="py-2 pr-3 font-bold">Team</th>
              <th className="py-2 px-2 font-bold">Student Codes</th>
              <th className="py-2 px-2 font-bold text-right">Roles Covered</th>
              <th className="py-2 px-2 font-bold text-right">Simulated 112</th>
              <th className="py-2 px-2 font-bold text-right">1st Compression</th>
              <th className="py-2 px-2 font-bold text-right">CPR in Range</th>
              <th className="py-2 px-2 font-bold text-right">Max Pause</th>
              <th className="py-2 px-2 font-bold text-right">AED Confirmed</th>
              <th className="py-2 px-2 font-bold text-right">Handover</th>
              <th className="py-2 pl-2 font-bold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-mono tabular-nums">
            {runs.map((r) => {
              const m = r.metrics;
              return (
                <tr key={r.id}>
                  <td className="py-2 pr-3 font-sans font-bold text-ink">{r.teamName}</td>
                  <td className="py-2 px-2 text-ink-muted">
                    {r.teamMembers.map((tm) => tm.studentCode).join(', ')}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m ? `${m.rolesFilled}/${m.rolesTotal} (${m.tRoleCoverage ?? '—'}s)` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m?.tCall112 !== null && m?.tCall112 !== undefined ? `${m.tCall112}s` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m?.tFirstCompression !== null && m?.tFirstCompression !== undefined
                      ? `${m.tFirstCompression}s`
                      : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m ? `${m.cprInRangePct}% (${m.cprMedianBpm} BPM)` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m ? `${m.longestPauseSec}s` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m?.tAedConfirmed !== null && m?.tAedConfirmed !== undefined
                      ? `${m.tAedConfirmed}s`
                      : '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {m?.handoverComplete ? 'Complete (4/4)' : 'Incomplete'}
                  </td>
                  <td className="py-2 pl-2 text-right font-bold text-primary">
                    {r.score !== null ? `${r.score}/100` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

/* ============================================================================
 * 7. CLASS CARD COMPONENT (Teacher Home)
 * ============================================================================ */
export interface ClassCardProps {
  cls: ClassRecord;
  stats?: ClassStatsRecord;
  onOpenClass: () => void;
  onStartDrill: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  cls,
  stats,
  onOpenClass,
  onStartDrill
}) => {
  const nStudents = stats?.studentsParticipatedCount ?? 0;
  const readiness = stats?.readinessScore ?? null;
  const guarded = guardSmallSample(
    readiness,
    readiness !== null ? `${readiness}/100` : '—',
    nStudents,
    5
  );

  const series = stats?.trendSeries ?? [];
  const lastDrillDate = stats?.latestAt
    ? new Date(stats.latestAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'No drills run yet';

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between gap-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-ink">Class {cls.name}</h3>
              <Badge variant="soft">Grade {cls.grade}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Join Code: <span className="font-mono font-bold text-ink">{cls.joinCode}</span> •{' '}
              {cls.studentCount} students on roster
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
              Readiness (Median of 3)
            </span>
            {guarded.suppressed || readiness === null ? (
              <span className="text-xs font-bold text-ink-muted">
                {stats?.drillsCompleted ? 'Not enough data (n < 5)' : 'No baseline yet'}
              </span>
            ) : (
              <span className="text-2xl font-extrabold font-mono text-primary tabular-nums">
                {guarded.displayLabel}
              </span>
            )}
          </div>
        </div>

        {/* Mini Sparkline + Meta */}
        <div className="p-3 rounded-xl bg-base border border-border flex items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Last drill: {lastDrillDate}</span>
            </div>
            <div className="text-ink-muted font-mono">
              {stats?.drillsCompleted ?? 0} drills completed • n={nStudents} trained
            </div>
          </div>

          {series.length >= 2 && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary">
              <TrendingUp className="w-4 h-4" />
              <span>
                {series[0].medianScore} → {series[series.length - 1].medianScore} pts
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Button variant="secondary" size="sm" onClick={onOpenClass}>
          <span>Open Class</span>
        </Button>
        <Button variant="primary" size="sm" onClick={onStartDrill}>
          <Play className="w-4 h-4" />
          <span>Run a Drill</span>
        </Button>
      </div>
    </Card>
  );
};
