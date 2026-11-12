import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import {
  DEFAULT_PROGRAM_TARGETS,
  DRILL_SCENARIOS,
  DrillEventRecord,
  DrillEventType,
  DrillStatus,
  ProgramTargets,
  RunMetrics,
  RunStatus,
  ScoreBreakdown,
  SquadRoleId,
  SCORE_VERSION,
  computeReadinessMedianOfLast3,
  computeRunMetricsAndScore,
  getNextPracticeRecommendation,
  isDrillExpiredForRetentionPurge
} from './drillEngine';
import { computeMedian, generateSyntheticCprSamples } from '../utils/cprRateEstimator';

export type SchoolRole = 'admin' | 'teacher' | 'student';
export type SchoolVerificationStatus = 'unverified' | 'pending' | 'verified';

export interface SchoolSettings {
  retentionDays: number; // default 90 (DPDP data minimisation default)
  showStudentNames: boolean; // default false
  shareAnonymisedStats: boolean; // default false (explicit opt-in)
  allowStudentAccounts: boolean; // default false (optional teacher-invite-only student accounts)
  targets: ProgramTargets;
}

export interface SchoolRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  udiseCode?: string;
  officialEmailDomain?: string;
  verificationStatus: SchoolVerificationStatus;
  verifiedAt?: number | null;
  createdAt: number;
  createdBy: string;
  isDemo?: boolean;
  settings: SchoolSettings;
}

export interface SchoolMemberRecord {
  uid: string;
  role: SchoolRole;
  displayName: string;
  email: string;
  classIds: string[];
  joinedAt: number;
}

export interface SchoolInviteRecord {
  id: string;
  schoolId?: string;
  role: SchoolRole;
  classIds: string[];
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy: string | null;
  usedAt?: number | null;
  revoked?: boolean;
  revokedAt?: number | null;
  failedAttempts?: number;
  lockedUntil?: number | null;
  codeHash: string; // HMAC-SHA256 digest
  codeHmac?: string;
}

export interface SchoolJoinRequestRecord {
  uid: string;
  schoolId: string;
  displayName: string;
  email: string;
  requestedRole: 'teacher' | 'student';
  targetClassId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface OnboardingDraftRecord {
  uid: string;
  intendedRole: 'teacher' | 'school_admin' | 'student';
  draftSchoolName?: string;
  draftCity?: string;
  draftState?: string;
  draftUdise?: string;
  draftInviteCode?: string;
  updatedAt: number;
}

export interface UserMembershipRecord {
  uid: string;
  schoolId: string;
  schoolName: string;
  role: SchoolRole;
  joinedAt: number;
}

export interface ClassRecord {
  id: string;
  schoolId: string;
  name: string; // e.g. "8-B"
  grade: string; // e.g. "8"
  section: string; // e.g. "B"
  teacherUid: string;
  teacherName: string;
  academicYear: string;
  studentCount: number;
  joinCode: string; // 10-char unambiguous code e.g. "K7M9-P4X2-W8" (plus legacy demo alias)
  joinCodeExpiresAt: number;
  archived: boolean;
  isDemo?: boolean;
}

export interface StudentRosterRecord {
  id: string;
  classId: string;
  code: string; // e.g. "S-01" .. "S-40"
  displayName?: string; // stored only if school.settings.showStudentNames === true
  assignedAnonUid?: string | null;
  createdAt: number;
  drillsParticipated: number;
  rolesPracticed: SquadRoleId[];
  lastDrillAt: number | null;
  lastDrillId?: string | null;
  lastCertId?: string | null;
}

export interface RunTeamMember {
  anonUid: string;
  studentCode: string;
  roleId?: SquadRoleId;
  joinedAt: number;
  lastSyncAt?: number;
}

export interface DrillRunRecord {
  id: string;
  drillId: string;
  classId: string;
  schoolId: string;
  teamName: string; // "Team 1", "Team 2"
  runToken: string; // e.g. "8B-T1" or "K7M9-P4X2-T1"
  squadSessionId: string;
  status: RunStatus;
  startedAt: number | null;
  endedAt: number | null;
  teamMembers: RunTeamMember[];
  slotBindings?: Record<string, string>; // studentCode -> anonUid (teacher-assigned lock, releasable by teacher)
  events: DrillEventRecord[];
  metrics: RunMetrics | null;
  score: number | null;
  scoreVersion: number;
  scoreBreakdown: ScoreBreakdown | null;
  isDemo?: boolean;
}

export interface DrillSummaryStats {
  teamsCount: number;
  studentsCount: number;
  medianScore: number;
  p25Score: number;
  p75Score: number;
  medianTimeToFirstCompression: number | null;
  medianTimeToCall112: number | null;
  medianCprInRangePct: number;
  medianAedConfirmedSec: number | null;
  roleCoveragePct: number;
  handoverCompletePct: number;
}

export interface DrillRecord {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  grade: string;
  teacherUid: string;
  scenarioId: string; // "cardiac-arrest-unresponsive"
  mode: 'drill';
  status: DrillStatus;
  scheduledAt: number;
  startedAt: number | null;
  endedAt: number | null;
  syncGraceEndsAt?: number | null; // endedAt + 15 min for offline event sync
  activeJoinCode?: string; // 10-char XXXX-XXXX-XX active drill join code
  activeJoinCodeHmac?: string;
  scheduledByRole?: 'admin' | 'teacher';
  authorizedByAdminUid?: string | null;
  durationSec: number;
  teamCount: number;
  notes: string; // Teacher notes — no student names allowed
  runs: DrillRunRecord[];
  summary: DrillSummaryStats | null;
  isBaseline?: boolean;
  isDemo?: boolean;
}

export interface ClassTrendPoint {
  drillId: string;
  at: number;
  label: string;
  isBaseline?: boolean;
  studentsCount: number;
  medianScore: number;
  tCall112: number | null;
  tFirstCompression: number | null;
  cprInRangePct: number;
  roleCoveragePct: number;
}

export interface ClassStatsRecord {
  classId: string;
  schoolId: string;
  updatedAt: number;
  drillsCompleted: number;
  studentsParticipatedCount: number;
  readinessScore: number | null; // median of last 3 completed drills
  baselineDrillId: string | null;
  baselineScore: number | null;
  baselineAt: number | null;
  baselineStudentsCount: number;
  latestDrillId: string | null;
  latestScore: number | null;
  latestAt: number | null;
  latestStudentsCount: number;
  trendSeries: ClassTrendPoint[];
}

export interface SchoolStatsRecord {
  schoolId: string;
  updatedAt: number;
  classesActive: number;
  classesTotal: number;
  drillsThisTerm: number;
  studentsTrainedThisTerm: number;
  studentsTotal: number;
  readinessScore: number | null; // median of class readiness scores
  byGrade: Record<
    string,
    {
      readiness: number | null;
      drills: number;
      studentsCount: number;
    }
  >;
  baselineSummary: {
    medianScore: number | null;
    tFirstCompression: number | null;
    tCall112: number | null;
    cprInRangePct: number | null;
    nDrills: number;
    nStudents: number;
  };
  latestSummary: {
    medianScore: number | null;
    tFirstCompression: number | null;
    tCall112: number | null;
    cprInRangePct: number | null;
    nDrills: number;
    nStudents: number;
  };
  monthlyByClass: Record<
    string,
    Array<{
      month: string; // e.g. "2026-01"
      drills: number;
      medianScore: number | null;
    }>
  >;
}

export interface TermReportSnapshot {
  id: string; // e.g. "2025-26-T2"
  schoolId: string;
  schoolName: string;
  termLabel: string;
  generatedAt: number;
  generatedBy: string;
  isDemo?: boolean;
  statsSnapshot: SchoolStatsRecord;
  classRows: Array<{
    classId: string;
    className: string;
    grade: string;
    teacherName: string;
    drillsCompleted: number;
    studentsTrained: number;
    studentCount: number;
    baselineScore: number | null;
    latestScore: number | null;
    readinessScore: number | null;
  }>;
}

export interface CertificateRecord {
  certId: string; // Unguessable ID e.g. "CERT-9F3A-78C2-41E0"
  schoolId: string;
  schoolName: string;
  classId: string;
  className: string;
  grade: string;
  drillId: string;
  drillDateIso: string;
  scenarioTitle: string;
  studentCode: string; // Stored only in private roster/PDF, NOT exposed on public /verify/:certId
  studentDisplayName?: string;
  rolePracticed: string;
  issuedAt: number;
  issuedBy: string;
  revoked: boolean;
  revokedAt?: number | null;
  isDemo?: boolean;
}

export interface PlatformStatsRecord {
  updatedAt: number;
  schoolsCount: number;
  classesCount: number;
  drillsCount: number;
  studentsTrainedCount: number;
  runsFlaggedCount: number;
  totalRunsCount: number;
  accelerometerRunsCount: number;
  tapFallbackRunsCount: number;
  baselineMedians: {
    score: number | null;
    tCall112: number | null;
    tFirstCompression: number | null;
    cprInRangePct: number | null;
    roleCoveragePct: number | null;
    nDrills: number;
    nStudents: number;
  };
  latestMedians: {
    score: number | null;
    tCall112: number | null;
    tFirstCompression: number | null;
    cprInRangePct: number | null;
    roleCoveragePct: number | null;
    nDrills: number;
    nStudents: number;
  };
  scoreDistributionByDrillOrder: Array<{
    drillNumberLabel: string; // "Drill 1 (Baseline)", "Drill 2", "Drill 3+"
    nDrills: number;
    nStudents: number;
    p25: number;
    median: number;
    p75: number;
  }>;
}

export const PILOT_EVIDENCE_CAVEAT =
  'Results come from practice drills in school conditions with a small sample; they are not clinical outcomes.';

const STORAGE_KEY = 'sanjeevani_drill_platform_state_v2_real';
const OFFLINE_QUEUE_KEY = 'sanjeevani_offline_drill_events_v1';
const DEFAULT_HMAC_PEPPER = 'sanjeevani-school-invite-hmac-secret-v2';

export interface OfflineQueuedDrillEvent {
  drillId: string;
  runId: string;
  event: DrillEventRecord;
  queuedAt: number;
}

export interface DrillPlatformStore {
  activeSchoolId: string;
  activeRoleView: 'teacher' | 'admin' | 'platform';
  includeDemoInPlatform: boolean;
  schools: Record<string, SchoolRecord>;
  members: Record<string, SchoolMemberRecord[]>; // keyed by schoolId (schools/{schoolId}/members/{uid})
  invites: Record<string, SchoolInviteRecord[]>; // keyed by schoolId (schools/{schoolId}/invites/{inviteId})
  joinRequests?: Record<string, SchoolJoinRequestRecord[]>; // keyed by schoolId (schools/{schoolId}/joinRequests/{uid})
  onboardingDrafts?: Record<string, OnboardingDraftRecord>; // keyed by uid (onboardingDrafts/{uid})
  userMemberships?: Record<string, UserMembershipRecord[]>; // keyed by uid (users/{uid}/memberships/{schoolId})
  userCreatedSchoolsCount?: Record<string, number>; // keyed by uid (capped at <= 2 unverified schools)
  codeRateLimits?: Record<string, { failedAttempts: number; windowStart: number; lockedUntil: number | null }>;
  classes: Record<string, ClassRecord>; // keyed by classId
  rosters: Record<string, StudentRosterRecord[]>; // keyed by classId
  drills: Record<string, DrillRecord>; // keyed by drillId
  classStats: Record<string, ClassStatsRecord>; // keyed by classId
  schoolStats: Record<string, SchoolStatsRecord>; // keyed by schoolId
  termReports: Record<string, TermReportSnapshot[]>; // keyed by schoolId
  certificates: Record<string, CertificateRecord>; // keyed by certId
}

/**
 * Computes HMAC-SHA256 hex digest using Web Crypto API (or deterministic keyed fallback in sync contexts).
 */
export async function hmacSha256Hex(
  text: string,
  secret: string = DEFAULT_HMAC_PEPPER
): Promise<string> {
  const normalized = text.trim().toUpperCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(normalized));
      return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback below
    }
  }
  return syncDeterministicHmac(normalized, secret);
}

export async function sha256Hex(text: string): Promise<string> {
  return hmacSha256Hex(text, DEFAULT_HMAC_PEPPER);
}

export function syncDeterministicHmac(
  text: string,
  secret: string = DEFAULT_HMAC_PEPPER
): string {
  return syncDeterministicHash(`${secret}::${text.trim().toUpperCase()}`);
}

export function syncDeterministicHash(text: string): string {
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57 ^ text.length;
  for (let i = 0, ch; i < text.length; i++) {
    ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Generates a unified 10-character unambiguous code formatted as `XXXX-XXXX-XX`
 * (~50 bits of entropy from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
 */
export function generateFormattedCode10(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };
  return `${seg(4)}-${seg(4)}-${seg(2)}`;
}

export function generateUnguessableId(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };
  return `${prefix}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

function computePercentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return Math.round(sorted[lo]);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

/**
 * Generates a realistic scored run from synthetic timings so demo drills and
 * end-to-end tests go through the exact same `computeRunMetricsAndScore` pipeline.
 */
function buildScoredDemoRun(params: {
  runId: string;
  drillId: string;
  classId: string;
  schoolId: string;
  teamIndex: number;
  classCodePrefix: string;
  startedAtMs: number;
  durationSec: number;
  studentCodes: string[];
  tRoleClaimedSec: number;
  tCall112Sec: number;
  tCprStartSec: number;
  tCrowdSec: number;
  tAedSec: number;
  tHandoverSec: number | null;
  cprPattern: 'steady_110' | 'slow_80' | 'irregular' | 'long_pause_9s';
  targets: ProgramTargets;
  isDemo?: boolean;
}): DrillRunRecord {
  const {
    runId,
    drillId,
    classId,
    schoolId,
    teamIndex,
    classCodePrefix,
    startedAtMs,
    durationSec,
    studentCodes,
    tRoleClaimedSec,
    tCall112Sec,
    tCprStartSec,
    tCrowdSec,
    tAedSec,
    tHandoverSec,
    cprPattern,
    targets,
    isDemo
  } = params;

  const endedAtMs = startedAtMs + durationSec * 1000;
  const roles: SquadRoleId[] = [
    '112_caller',
    'cpr_compressor',
    'aed_runner',
    'crowd_airway'
  ];

  const teamMembers: RunTeamMember[] = studentCodes.map((code, idx) => ({
    anonUid: `anon-${classId}-${code}`,
    studentCode: code,
    roleId: roles[idx % roles.length],
    joinedAt: startedAtMs + (idx + 1) * 2000
  }));

  const events: DrillEventRecord[] = [];
  roles.forEach((roleId, i) => {
    const claimAt = startedAtMs + Math.round(((tRoleClaimedSec * (i + 1)) / 4) * 1000);
    events.push({
      id: `${runId}-ev-role-${i}`,
      type: 'role_claimed',
      actorUid: teamMembers[i % teamMembers.length].anonUid,
      studentCode: teamMembers[i % teamMembers.length].studentCode,
      roleId,
      clientAt: claimAt,
      receivedAt: claimAt + 120
    });
  });

  events.push({
    id: `${runId}-ev-112`,
    type: 'call112_confirmed',
    actorUid: teamMembers[0].anonUid,
    studentCode: teamMembers[0].studentCode,
    roleId: '112_caller',
    clientAt: startedAtMs + tCall112Sec * 1000,
    receivedAt: startedAtMs + tCall112Sec * 1000 + 150,
    payload: { note: 'Practice: 112 call simulated' }
  });

  events.push({
    id: `${runId}-ev-cpr-start`,
    type: 'cpr_started',
    actorUid: teamMembers[1 % teamMembers.length].anonUid,
    studentCode: teamMembers[1 % teamMembers.length].studentCode,
    roleId: 'cpr_compressor',
    clientAt: startedAtMs + tCprStartSec * 1000,
    receivedAt: startedAtMs + tCprStartSec * 1000 + 150
  });

  const cprSamples = generateSyntheticCprSamples(cprPattern, 20).map((s) => ({
    ...s,
    tMs: startedAtMs + tCprStartSec * 1000 + s.tMs
  }));

  events.push({
    id: `${runId}-ev-cpr-sample`,
    type: 'cpr_rate_sample',
    actorUid: teamMembers[1 % teamMembers.length].anonUid,
    studentCode: teamMembers[1 % teamMembers.length].studentCode,
    roleId: 'cpr_compressor',
    clientAt: startedAtMs + (tCprStartSec + 20) * 1000,
    receivedAt: startedAtMs + (tCprStartSec + 20) * 1000 + 180,
    payload: {
      samples: cprSamples,
      source: cprPattern === 'irregular' ? 'tap' : 'accelerometer'
    }
  });

  events.push({
    id: `${runId}-ev-crowd`,
    type: 'crowd_controlled',
    actorUid: teamMembers[3 % teamMembers.length].anonUid,
    studentCode: teamMembers[3 % teamMembers.length].studentCode,
    roleId: 'crowd_airway',
    clientAt: startedAtMs + tCrowdSec * 1000,
    receivedAt: startedAtMs + tCrowdSec * 1000 + 140
  });

  events.push({
    id: `${runId}-ev-aed`,
    type: 'aed_confirmed',
    actorUid: teamMembers[2 % teamMembers.length].anonUid,
    studentCode: teamMembers[2 % teamMembers.length].studentCode,
    roleId: 'aed_runner',
    clientAt: startedAtMs + tAedSec * 1000,
    receivedAt: startedAtMs + tAedSec * 1000 + 140
  });

  if (tHandoverSec !== null) {
    events.push({
      id: `${runId}-ev-handover`,
      type: 'handover_generated',
      actorUid: teamMembers[3 % teamMembers.length].anonUid,
      studentCode: teamMembers[3 % teamMembers.length].studentCode,
      roleId: 'crowd_airway',
      clientAt: startedAtMs + tHandoverSec * 1000,
      receivedAt: startedAtMs + tHandoverSec * 1000 + 160,
      payload: {
        handoverFields: {
          incidentType: true,
          t0Recorded: true,
          actionsSummary: true,
          cprSummary: true
        }
      }
    });
  }

  events.push({
    id: `${runId}-ev-end`,
    type: 'run_ended',
    actorUid: 'teacher-demo-1',
    studentCode: 'TEACHER',
    clientAt: endedAtMs,
    receivedAt: endedAtMs + 90
  });

  const { metrics, score, scoreBreakdown } = computeRunMetricsAndScore(
    events,
    startedAtMs,
    endedAtMs,
    targets,
    4
  );

  return {
    id: runId,
    drillId,
    classId,
    schoolId,
    teamName: `Team ${teamIndex}`,
    runToken: `${classCodePrefix}-T${teamIndex}`,
    squadSessionId: `SQUAD-DRILL-${runId.toUpperCase()}`,
    status: 'scored',
    startedAt: startedAtMs,
    endedAt: endedAtMs,
    teamMembers,
    events,
    metrics,
    score,
    scoreVersion: SCORE_VERSION,
    scoreBreakdown,
    isDemo
  };
}

/**
 * Pure aggregation function computing `DrillSummaryStats` across all scored runs in a drill.
 */
export function computeDrillSummaryFromRuns(runs: DrillRunRecord[]): DrillSummaryStats {
  const scoredRuns = runs.filter((r) => r.status === 'scored' && r.metrics && r.score !== null);
  const scores = scoredRuns.map((r) => r.score as number);
  const tComp = scoredRuns
    .map((r) => r.metrics?.tFirstCompression)
    .filter((v): v is number => typeof v === 'number');
  const t112 = scoredRuns
    .map((r) => r.metrics?.tCall112)
    .filter((v): v is number => typeof v === 'number');
  const cprPcts = scoredRuns.map((r) => r.metrics?.cprInRangePct ?? 0);
  const tAeds = scoredRuns
    .map((r) => r.metrics?.tAedConfirmed)
    .filter((v): v is number => typeof v === 'number');
  const roleCoverages: number[] = scoredRuns.map((r) =>
    r.metrics ? Math.round((r.metrics.rolesFilled / Math.max(1, r.metrics.rolesTotal)) * 100) : 0
  );
  const handovers: number[] = scoredRuns.map((r) => (r.metrics?.handoverComplete ? 100 : 0));

  const uniqueStudents = new Set<string>();
  for (const r of runs) {
    for (const m of r.teamMembers) {
      uniqueStudents.add(m.studentCode);
    }
  }

  return {
    teamsCount: runs.length,
    studentsCount: uniqueStudents.size,
    medianScore: scores.length ? Math.round(computeMedian(scores)) : 0,
    p25Score: computePercentile(scores, 0.25),
    p75Score: computePercentile(scores, 0.75),
    medianTimeToFirstCompression: tComp.length
      ? Math.round(computeMedian(tComp) * 10) / 10
      : null,
    medianTimeToCall112: t112.length ? Math.round(computeMedian(t112) * 10) / 10 : null,
    medianCprInRangePct: cprPcts.length ? Math.round(computeMedian(cprPcts)) : 0,
    medianAedConfirmedSec: tAeds.length ? Math.round(computeMedian(tAeds) * 10) / 10 : null,
    roleCoveragePct: roleCoverages.length ? Math.round(computeMedian(roleCoverages)) : 0,
    handoverCompletePct: handovers.length
      ? Math.round(handovers.reduce((a, b) => a + b, 0) / handovers.length)
      : 0
  };
}

/**
 * Recomputes `classStats/{classId}`, `schoolStats/current`, and `platformStats/current`
 * deterministically from the current store state.
 */
export function recomputeAllAggregates(store: DrillPlatformStore): void {
  const newClassStats: Record<string, ClassStatsRecord> = {};

  for (const cls of Object.values(store.classes)) {
    const completedDrills = Object.values(store.drills)
      .filter(
        (d) =>
          d.classId === cls.id &&
          d.status === 'completed' &&
          d.summary !== null
      )
      .sort((a, b) => (a.endedAt ?? a.scheduledAt) - (b.endedAt ?? b.scheduledAt));

    const uniqueStudents = new Set<string>();
    const trendSeries: ClassTrendPoint[] = [];

    completedDrills.forEach((d, idx) => {
      for (const r of d.runs) {
        for (const tm of r.teamMembers) {
          uniqueStudents.add(tm.studentCode);
        }
      }
      const s = d.summary!;
      trendSeries.push({
        drillId: d.id,
        at: d.endedAt ?? d.scheduledAt,
        label: idx === 0 ? 'Drill 1 (Baseline)' : `Drill ${idx + 1}`,
        isBaseline: idx === 0,
        studentsCount: s.studentsCount,
        medianScore: s.medianScore,
        tCall112: s.medianTimeToCall112,
        tFirstCompression: s.medianTimeToFirstCompression,
        cprInRangePct: s.medianCprInRangePct,
        roleCoveragePct: s.roleCoveragePct
      });
    });

    const readinessScore = computeReadinessMedianOfLast3(
      completedDrills.map((d) => d.summary!.medianScore)
    );
    const baseline = completedDrills[0] ?? null;
    const latest = completedDrills[completedDrills.length - 1] ?? null;

    newClassStats[cls.id] = {
      classId: cls.id,
      schoolId: cls.schoolId,
      updatedAt: Date.now(),
      drillsCompleted: completedDrills.length,
      studentsParticipatedCount: uniqueStudents.size,
      readinessScore,
      baselineDrillId: baseline?.id ?? null,
      baselineScore: baseline?.summary?.medianScore ?? null,
      baselineAt: baseline ? baseline.endedAt ?? baseline.scheduledAt : null,
      baselineStudentsCount: baseline?.summary?.studentsCount ?? 0,
      latestDrillId: latest?.id ?? null,
      latestScore: latest?.summary?.medianScore ?? null,
      latestAt: latest ? latest.endedAt ?? latest.scheduledAt : null,
      latestStudentsCount: latest?.summary?.studentsCount ?? 0,
      trendSeries
    };
  }

  store.classStats = newClassStats;

  // Recompute per-school stats
  const newSchoolStats: Record<string, SchoolStatsRecord> = {};
  for (const school of Object.values(store.schools)) {
    const schoolClasses = Object.values(store.classes).filter(
      (c) => c.schoolId === school.id && !c.archived
    );
    const schoolDrills = Object.values(store.drills)
      .filter(
        (d) =>
          d.schoolId === school.id &&
          d.status === 'completed' &&
          d.summary !== null
      )
      .sort((a, b) => (a.endedAt ?? a.scheduledAt) - (b.endedAt ?? b.scheduledAt));

    const classReadinessValues = schoolClasses
      .map((c) => newClassStats[c.id]?.readinessScore)
      .filter((v): v is number => typeof v === 'number');

    const classesActive = schoolClasses.filter(
      (c) => (newClassStats[c.id]?.drillsCompleted ?? 0) > 0
    ).length;

    const studentsTotal = schoolClasses.reduce((acc, c) => acc + c.studentCount, 0);
    const studentsTrainedThisTerm = schoolClasses.reduce(
      (acc, c) => acc + (newClassStats[c.id]?.studentsParticipatedCount ?? 0),
      0
    );

    // By grade breakdown
    const grades = Array.from(new Set(schoolClasses.map((c) => c.grade))).sort();
    const byGrade: SchoolStatsRecord['byGrade'] = {};
    for (const g of grades) {
      const gClasses = schoolClasses.filter((c) => c.grade === g);
      const gReadiness = gClasses
        .map((c) => newClassStats[c.id]?.readinessScore)
        .filter((v): v is number => typeof v === 'number');
      const gDrills = gClasses.reduce(
        (acc, c) => acc + (newClassStats[c.id]?.drillsCompleted ?? 0),
        0
      );
      const gStudents = gClasses.reduce(
        (acc, c) => acc + (newClassStats[c.id]?.studentsParticipatedCount ?? 0),
        0
      );
      byGrade[g] = {
        readiness: gReadiness.length ? Math.round(computeMedian(gReadiness)) : null,
        drills: gDrills,
        studentsCount: gStudents
      };
    }

    // Baseline vs latest across classes in this school
    const baselineDrills = schoolClasses
      .map((c) => {
        const bId = newClassStats[c.id]?.baselineDrillId;
        return bId ? store.drills[bId] : null;
      })
      .filter((d): d is DrillRecord => Boolean(d && d.summary));

    const latestDrills = schoolClasses
      .map((c) => {
        const lId = newClassStats[c.id]?.latestDrillId;
        return lId ? store.drills[lId] : null;
      })
      .filter((d): d is DrillRecord => Boolean(d && d.summary));

    const summarizeDrillGroup = (group: DrillRecord[]) => {
      if (!group.length) {
        return {
          medianScore: null,
          tFirstCompression: null,
          tCall112: null,
          cprInRangePct: null,
          nDrills: 0,
          nStudents: 0
        };
      }
      const scores = group.map((d) => d.summary!.medianScore);
      const tComps = group
        .map((d) => d.summary!.medianTimeToFirstCompression)
        .filter((v): v is number => typeof v === 'number');
      const t112s = group
        .map((d) => d.summary!.medianTimeToCall112)
        .filter((v): v is number => typeof v === 'number');
      const cprs = group.map((d) => d.summary!.medianCprInRangePct);
      const nStudents = group.reduce((acc, d) => acc + d.summary!.studentsCount, 0);
      return {
        medianScore: Math.round(computeMedian(scores)),
        tFirstCompression: tComps.length
          ? Math.round(computeMedian(tComps) * 10) / 10
          : null,
        tCall112: t112s.length ? Math.round(computeMedian(t112s) * 10) / 10 : null,
        cprInRangePct: Math.round(computeMedian(cprs)),
        nDrills: group.length,
        nStudents
      };
    };

    // Monthly heatmap per class
    const monthlyByClass: SchoolStatsRecord['monthlyByClass'] = {};
    for (const c of schoolClasses) {
      const cDrills = schoolDrills.filter((d) => d.classId === c.id);
      const monthMap = new Map<string, number[]>();
      for (const d of cDrills) {
        const dt = new Date(d.endedAt ?? d.scheduledAt);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const list = monthMap.get(key) ?? [];
        list.push(d.summary!.medianScore);
        monthMap.set(key, list);
      }
      monthlyByClass[c.id] = Array.from(monthMap.entries()).map(([month, scs]) => ({
        month,
        drills: scs.length,
        medianScore: Math.round(computeMedian(scs))
      }));
    }

    newSchoolStats[school.id] = {
      schoolId: school.id,
      updatedAt: Date.now(),
      classesActive,
      classesTotal: schoolClasses.length,
      drillsThisTerm: schoolDrills.length,
      studentsTrainedThisTerm,
      studentsTotal,
      readinessScore: classReadinessValues.length
        ? Math.round(computeMedian(classReadinessValues))
        : null,
      byGrade,
      baselineSummary: summarizeDrillGroup(baselineDrills),
      latestSummary: summarizeDrillGroup(latestDrills),
      monthlyByClass
    };
  }

  store.schoolStats = newSchoolStats;
}

/**
 * Builds the default DEMO school ("Sarvodaya Vidyalaya, Bengaluru (DEMO)", `isDemo: true`)
 * with 3 classes (8-A, 8-B, 9-A), 16 students per class (4 teams of 4), and 6 completed drills
 * demonstrating honest baseline -> practice -> follow-up progression.
 * Also seeds a second verified school ("Kendriya Vidyalaya No. 1, Mysuru") for directory search testing.
 */
export function buildDemoSchoolSeed(): DrillPlatformStore {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const schoolId = 'school-demo-sarvodaya';
  const secondSchoolId = 'school-verified-mysuru';

  const demoSchool: SchoolRecord = {
    id: schoolId,
    name: 'Sarvodaya Vidyalaya, Bengaluru (DEMO)',
    city: 'Bengaluru',
    state: 'Karnataka',
    udiseCode: '29200104801',
    officialEmailDomain: 'sarvodaya.edu.in',
    verificationStatus: 'verified',
    verifiedAt: now - 58 * dayMs,
    createdAt: now - 60 * dayMs,
    createdBy: 'admin-demo-1',
    isDemo: true,
    settings: {
      retentionDays: 90,
      showStudentNames: false,
      shareAnonymisedStats: true,
      allowStudentAccounts: false,
      targets: { ...DEFAULT_PROGRAM_TARGETS }
    }
  };

  const secondVerifiedSchool: SchoolRecord = {
    id: secondSchoolId,
    name: 'Kendriya Vidyalaya No. 1, Mysuru',
    city: 'Mysuru',
    state: 'Karnataka',
    udiseCode: '29260201904',
    officialEmailDomain: 'kvmysuru.edu.in',
    verificationStatus: 'verified',
    verifiedAt: now - 30 * dayMs,
    createdAt: now - 45 * dayMs,
    createdBy: 'admin-mysuru-1',
    isDemo: true,
    settings: {
      retentionDays: 90,
      showStudentNames: false,
      shareAnonymisedStats: true,
      allowStudentAccounts: false,
      targets: { ...DEFAULT_PROGRAM_TARGETS }
    }
  };

  const members: SchoolMemberRecord[] = [
    {
      uid: 'admin-demo-1',
      role: 'admin',
      displayName: 'Dr. Kavitha Rao (Principal & Safety Lead)',
      email: 'principal.demo@sarvodaya.edu.in',
      classIds: ['class-8a', 'class-8b', 'class-9a'],
      joinedAt: now - 60 * dayMs
    },
    {
      uid: 'teacher-demo-1',
      role: 'teacher',
      displayName: 'Aarav Menon (Physical Education & First-Aid Lead)',
      email: 'aarav.menon.demo@sarvodaya.edu.in',
      classIds: ['class-8a', 'class-8b'],
      joinedAt: now - 58 * dayMs
    },
    {
      uid: 'teacher-demo-2',
      role: 'teacher',
      displayName: 'Meera Nair (Grade 9 Science Teacher)',
      email: 'meera.nair.demo@sarvodaya.edu.in',
      classIds: ['class-9a'],
      joinedAt: now - 55 * dayMs
    }
  ];

  const invites: SchoolInviteRecord[] = [
    {
      id: 'inv-demo-10char',
      schoolId,
      role: 'teacher',
      classIds: ['class-8b'],
      createdBy: 'admin-demo-1',
      createdAt: now - 2 * dayMs,
      expiresAt: now + 5 * dayMs,
      usedBy: null,
      revoked: false,
      failedAttempts: 0,
      lockedUntil: null,
      codeHash: syncDeterministicHmac('K7M9-P4X2-W8'),
      codeHmac: syncDeterministicHmac('K7M9-P4X2-W8')
    },
    {
      id: 'inv-demo-1',
      schoolId,
      role: 'teacher',
      classIds: ['class-8b'],
      createdBy: 'admin-demo-1',
      createdAt: now - 3 * dayMs,
      expiresAt: now + 4 * dayMs,
      usedBy: null,
      revoked: false,
      failedAttempts: 0,
      lockedUntil: null,
      codeHash: syncDeterministicHash('SNJV-TEACH-8B26'),
      codeHmac: syncDeterministicHmac('SNJV-TEACH-8B26')
    }
  ];

  const joinRequests: Record<string, SchoolJoinRequestRecord[]> = {
    [schoolId]: [
      {
        uid: 'req-teacher-demo-3',
        schoolId,
        displayName: 'Rohan Kulkarni (Grade 8 Social Studies)',
        email: 'rohan.kulkarni@sarvodaya.edu.in',
        requestedRole: 'teacher',
        targetClassId: 'class-8b',
        status: 'pending',
        createdAt: now - 6 * 3600 * 1000
      }
    ]
  };

  const classes: Record<string, ClassRecord> = {
    'class-8b': {
      id: 'class-8b',
      schoolId,
      name: '8-B',
      grade: '8',
      section: 'B',
      teacherUid: 'teacher-demo-1',
      teacherName: 'Aarav Menon',
      academicYear: '2025-26',
      studentCount: 16,
      joinCode: '8B-4821',
      joinCodeExpiresAt: now + 7 * dayMs,
      archived: false,
      isDemo: true
    },
    'class-8a': {
      id: 'class-8a',
      schoolId,
      name: '8-A',
      grade: '8',
      section: 'A',
      teacherUid: 'teacher-demo-1',
      teacherName: 'Aarav Menon',
      academicYear: '2025-26',
      studentCount: 16,
      joinCode: '8A-3190',
      joinCodeExpiresAt: now + 7 * dayMs,
      archived: false,
      isDemo: true
    },
    'class-9a': {
      id: 'class-9a',
      schoolId,
      name: '9-A',
      grade: '9',
      section: 'A',
      teacherUid: 'teacher-demo-2',
      teacherName: 'Meera Nair',
      academicYear: '2025-26',
      studentCount: 16,
      joinCode: '9A-7742',
      joinCodeExpiresAt: now + 7 * dayMs,
      archived: false,
      isDemo: true
    }
  };

  const rosters: Record<string, StudentRosterRecord[]> = {};
  for (const cls of Object.values(classes)) {
    const list: StudentRosterRecord[] = [];
    for (let i = 1; i <= 16; i++) {
      const code = `S-${String(i).padStart(2, '0')}`;
      list.push({
        id: `${cls.id}-${code}`,
        classId: cls.id,
        code,
        assignedAnonUid: null,
        createdAt: now - 50 * dayMs,
        drillsParticipated: cls.id === 'class-8b' ? 3 : cls.id === 'class-8a' ? 2 : 1,
        rolesPracticed:
          i % 4 === 1
            ? ['112_caller', 'cpr_compressor']
            : i % 4 === 2
            ? ['cpr_compressor', 'aed_runner']
            : i % 4 === 3
            ? ['aed_runner', 'crowd_airway']
            : ['crowd_airway', '112_caller'],
        lastDrillAt: now - 4 * dayMs,
        lastDrillId:
          cls.id === 'class-8b'
            ? 'drill-8b-3'
            : cls.id === 'class-8a'
            ? 'drill-8a-2'
            : 'drill-9a-1'
      });
    }
    rosters[cls.id] = list;
  }

  const targets = demoSchool.settings.targets;

  const createDemoDrill = (cfg: {
    id: string;
    classId: string;
    className: string;
    grade: string;
    teacherUid: string;
    daysAgo: number;
    isBaseline?: boolean;
    notes: string;
    teamConfigs: Array<{
      tRole: number;
      t112: number;
      tCpr: number;
      tCrowd: number;
      tAed: number;
      tHandover: number | null;
      pattern: 'steady_110' | 'slow_80' | 'irregular' | 'long_pause_9s';
    }>;
  }): DrillRecord => {
    const startedAt = now - cfg.daysAgo * dayMs;
    const durationSec = 150;
    const endedAt = startedAt + durationSec * 1000;
    const runs: DrillRunRecord[] = cfg.teamConfigs.map((tc, idx) => {
      const teamNum = idx + 1;
      const codes = [
        `S-${String((teamNum - 1) * 4 + 1).padStart(2, '0')}`,
        `S-${String((teamNum - 1) * 4 + 2).padStart(2, '0')}`,
        `S-${String((teamNum - 1) * 4 + 3).padStart(2, '0')}`,
        `S-${String((teamNum - 1) * 4 + 4).padStart(2, '0')}`
      ];
      return buildScoredDemoRun({
        runId: `${cfg.id}-run-${teamNum}`,
        drillId: cfg.id,
        classId: cfg.classId,
        schoolId,
        teamIndex: teamNum,
        classCodePrefix: cfg.className.replace('-', ''),
        startedAtMs: startedAt,
        durationSec,
        studentCodes: codes,
        tRoleClaimedSec: tc.tRole,
        tCall112Sec: tc.t112,
        tCprStartSec: tc.tCpr,
        tCrowdSec: tc.tCrowd,
        tAedSec: tc.tAed,
        tHandoverSec: tc.tHandover,
        cprPattern: tc.pattern,
        targets,
        isDemo: true
      });
    });

    return {
      id: cfg.id,
      schoolId,
      classId: cfg.classId,
      className: cfg.className,
      grade: cfg.grade,
      teacherUid: cfg.teacherUid,
      scenarioId: 'cardiac-arrest-unresponsive',
      mode: 'drill',
      status: 'completed',
      scheduledAt: startedAt - 600000,
      startedAt,
      endedAt,
      syncGraceEndsAt: endedAt + 15 * 60 * 1000,
      scheduledByRole: 'teacher',
      durationSec,
      teamCount: runs.length,
      notes: cfg.notes,
      runs,
      summary: computeDrillSummaryFromRuns(runs),
      isBaseline: cfg.isBaseline,
      isDemo: true
    };
  };

  // 6 completed drills across 3 classes showing baseline -> follow-up progression
  const drills: Record<string, DrillRecord> = {
    'drill-8b-1': createDemoDrill({
      id: 'drill-8b-1',
      classId: 'class-8b',
      className: '8-B',
      grade: '8',
      teacherUid: 'teacher-demo-1',
      daysAgo: 42,
      isBaseline: true,
      notes:
        'Baseline unannounced corridor practice. Teams hesitated before starting chest compressions while waiting for the AED runner.',
      teamConfigs: [
        { tRole: 42, t112: 58, tCpr: 68, tCrowd: 75, tAed: 112, tHandover: null, pattern: 'slow_80' },
        { tRole: 38, t112: 52, tCpr: 62, tCrowd: 70, tAed: 105, tHandover: 140, pattern: 'long_pause_9s' },
        { tRole: 46, t112: 64, tCpr: 74, tCrowd: 82, tAed: 118, tHandover: null, pattern: 'irregular' },
        { tRole: 36, t112: 49, tCpr: 59, tCrowd: 68, tAed: 98, tHandover: 138, pattern: 'slow_80' }
      ]
    }),
    'drill-8b-2': createDemoDrill({
      id: 'drill-8b-2',
      classId: 'class-8b',
      className: '8-B',
      grade: '8',
      teacherUid: 'teacher-demo-1',
      daysAgo: 21,
      notes:
        'Second drill after reviewing Adult CPR protocol. Compressions started much earlier; Team 2 and Team 3 maintained steady CPR cadence.',
      teamConfigs: [
        { tRole: 26, t112: 34, tCpr: 38, tCrowd: 46, tAed: 88, tHandover: 122, pattern: 'steady_110' },
        { tRole: 24, t112: 29, tCpr: 33, tCrowd: 42, tAed: 82, tHandover: 115, pattern: 'steady_110' },
        { tRole: 29, t112: 37, tCpr: 41, tCrowd: 50, tAed: 92, tHandover: 128, pattern: 'long_pause_9s' },
        { tRole: 25, t112: 32, tCpr: 35, tCrowd: 44, tAed: 85, tHandover: 118, pattern: 'steady_110' }
      ]
    }),
    'drill-8b-3': createDemoDrill({
      id: 'drill-8b-3',
      classId: 'class-8b',
      className: '8-B',
      grade: '8',
      teacherUid: 'teacher-demo-1',
      daysAgo: 4,
      notes:
        'Follow-up evaluation drill. All four teams claimed roles within 22s, simulated 112 under 28s, and completed handover dockets.',
      teamConfigs: [
        { tRole: 18, t112: 22, tCpr: 25, tCrowd: 34, tAed: 74, tHandover: 104, pattern: 'steady_110' },
        { tRole: 16, t112: 20, tCpr: 23, tCrowd: 31, tAed: 70, tHandover: 98, pattern: 'steady_110' },
        { tRole: 21, t112: 26, tCpr: 28, tCrowd: 38, tAed: 79, tHandover: 110, pattern: 'steady_110' },
        { tRole: 19, t112: 24, tCpr: 26, tCrowd: 35, tAed: 76, tHandover: 106, pattern: 'steady_110' }
      ]
    }),
    'drill-8a-1': createDemoDrill({
      id: 'drill-8a-1',
      classId: 'class-8a',
      className: '8-A',
      grade: '8',
      teacherUid: 'teacher-demo-1',
      daysAgo: 35,
      isBaseline: true,
      notes:
        'Baseline practice for 8-A. Good 112 calling speed, but chest compressions had pauses during compressor switch.',
      teamConfigs: [
        { tRole: 40, t112: 50, tCpr: 64, tCrowd: 72, tAed: 108, tHandover: null, pattern: 'long_pause_9s' },
        { tRole: 37, t112: 46, tCpr: 58, tCrowd: 66, tAed: 102, tHandover: 135, pattern: 'slow_80' },
        { tRole: 44, t112: 55, tCpr: 69, tCrowd: 78, tAed: 115, tHandover: null, pattern: 'irregular' },
        { tRole: 39, t112: 48, tCpr: 60, tCrowd: 70, tAed: 104, tHandover: 136, pattern: 'long_pause_9s' }
      ]
    }),
    'drill-8a-2': createDemoDrill({
      id: 'drill-8a-2',
      classId: 'class-8a',
      className: '8-A',
      grade: '8',
      teacherUid: 'teacher-demo-1',
      daysAgo: 9,
      notes:
        'Follow-up drill for 8-A after metronome rhythm practice. Time to first compression dropped from 62s to 29s.',
      teamConfigs: [
        { tRole: 22, t112: 27, tCpr: 29, tCrowd: 39, tAed: 80, tHandover: 112, pattern: 'steady_110' },
        { tRole: 20, t112: 25, tCpr: 27, tCrowd: 36, tAed: 76, tHandover: 108, pattern: 'steady_110' },
        { tRole: 24, t112: 30, tCpr: 32, tCrowd: 42, tAed: 84, tHandover: 116, pattern: 'steady_110' },
        { tRole: 21, t112: 26, tCpr: 28, tCrowd: 38, tAed: 78, tHandover: 110, pattern: 'steady_110' }
      ]
    }),
    'drill-9a-1': createDemoDrill({
      id: 'drill-9a-1',
      classId: 'class-9a',
      className: '9-A',
      grade: '9',
      teacherUid: 'teacher-demo-2',
      daysAgo: 18,
      isBaseline: true,
      notes:
        'Initial baseline drill for Grade 9-A. Scheduled follow-up drill next week to practise sub-30s compression start.',
      teamConfigs: [
        { tRole: 35, t112: 44, tCpr: 54, tCrowd: 62, tAed: 96, tHandover: 132, pattern: 'long_pause_9s' },
        { tRole: 32, t112: 40, tCpr: 50, tCrowd: 58, tAed: 92, tHandover: 128, pattern: 'slow_80' },
        { tRole: 38, t112: 48, tCpr: 58, tCrowd: 66, tAed: 100, tHandover: null, pattern: 'irregular' },
        { tRole: 34, t112: 42, tCpr: 52, tCrowd: 60, tAed: 94, tHandover: 130, pattern: 'long_pause_9s' }
      ]
    })
  };

  // Sample verifiable certificate for Demo Class 8-B
  const sampleCertId = 'CERT-8B26-DEMO-0101';
  const certificates: Record<string, CertificateRecord> = {
    [sampleCertId]: {
      certId: sampleCertId,
      schoolId,
      schoolName: demoSchool.name,
      classId: 'class-8b',
      className: '8-B',
      grade: '8',
      drillId: 'drill-8b-3',
      drillDateIso: new Date(now - 4 * dayMs).toISOString(),
      scenarioTitle: DRILL_SCENARIOS['cardiac-arrest-unresponsive'].title,
      studentCode: 'S-01',
      rolePracticed: '112 Caller & Dispatcher Liaison',
      issuedAt: now - 3 * dayMs,
      issuedBy: 'teacher-demo-1',
      revoked: false,
      isDemo: true
    }
  };
  rosters['class-8b'][0].lastCertId = sampleCertId;

  const store: DrillPlatformStore = {
    activeSchoolId: schoolId,
    activeRoleView: 'teacher',
    includeDemoInPlatform: true,
    schools: {
      [schoolId]: demoSchool,
      [secondSchoolId]: secondVerifiedSchool
    },
    members: {
      [schoolId]: members,
      [secondSchoolId]: [
        {
          uid: 'admin-mysuru-1',
          role: 'admin',
          displayName: 'Principal S. Venkatesh',
          email: 'principal@kvmysuru.edu.in',
          classIds: [],
          joinedAt: now - 45 * dayMs
        }
      ]
    },
    invites: { [schoolId]: invites, [secondSchoolId]: [] },
    joinRequests,
    onboardingDrafts: {},
    userMemberships: {
      'admin-demo-1': [
        {
          uid: 'admin-demo-1',
          schoolId,
          schoolName: demoSchool.name,
          role: 'admin',
          joinedAt: now - 60 * dayMs
        }
      ],
      'teacher-demo-1': [
        {
          uid: 'teacher-demo-1',
          schoolId,
          schoolName: demoSchool.name,
          role: 'teacher',
          joinedAt: now - 58 * dayMs
        }
      ]
    },
    userCreatedSchoolsCount: {},
    codeRateLimits: {},
    classes,
    rosters,
    drills,
    classStats: {},
    schoolStats: {},
    termReports: {},
    certificates
  };

  recomputeAllAggregates(store);

  // Create a frozen Term Report snapshot for the demo school
  const termReport: TermReportSnapshot = {
    id: '2025-26-T2',
    schoolId,
    schoolName: demoSchool.name,
    termLabel: 'Academic Year 2025–26 • Term 2',
    generatedAt: now - 2 * dayMs,
    generatedBy: 'Dr. Kavitha Rao (Principal)',
    isDemo: true,
    statsSnapshot: JSON.parse(JSON.stringify(store.schoolStats[schoolId])),
    classRows: Object.values(classes).map((c) => {
      const st = store.classStats[c.id];
      return {
        classId: c.id,
        className: c.name,
        grade: c.grade,
        teacherName: c.teacherName,
        drillsCompleted: st?.drillsCompleted ?? 0,
        studentsTrained: st?.studentsParticipatedCount ?? 0,
        studentCount: c.studentCount,
        baselineScore: st?.baselineScore ?? null,
        latestScore: st?.latestScore ?? null,
        readinessScore: st?.readinessScore ?? null
      };
    })
  };
  store.termReports[schoolId] = [termReport];

  return store;
}

export function buildEmptyDrillStore(): DrillPlatformStore {
  return {
    activeSchoolId: '',
    activeRoleView: 'teacher',
    includeDemoInPlatform: false,
    schools: {},
    members: {},
    invites: {},
    joinRequests: {},
    onboardingDrafts: {},
    userMemberships: {},
    userCreatedSchoolsCount: {},
    codeRateLimits: {},
    classes: {},
    rosters: {},
    drills: {},
    classStats: {},
    schoolStats: {},
    termReports: {},
    certificates: {}
  };
}

class DrillService {
  private store: DrillPlatformStore;
  private listeners = new Set<() => void>();

  constructor() {
    this.store = this.loadStore();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushOfflineDrillEvents();
      });
    }
  }

  private loadStore(): DrillPlatformStore {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DrillPlatformStore;
          if (parsed && parsed.schools && parsed.classes && parsed.drills) {
            for (const [sid, s] of Object.entries(parsed.schools)) {
              if (s.isDemo) {
                delete parsed.schools[sid];
                delete parsed.members[sid];
                delete parsed.invites[sid];
                continue;
              }
              if (!s.verificationStatus) {
                s.verificationStatus = 'unverified';
              }
              if (typeof s.settings.allowStudentAccounts !== 'boolean') {
                s.settings.allowStudentAccounts = false;
              }
              if (!s.settings.retentionDays) {
                s.settings.retentionDays = 90;
              }
            }
            for (const [cid, c] of Object.entries(parsed.classes)) {
              if (c.isDemo) {
                delete parsed.classes[cid];
                delete parsed.rosters[cid];
              }
            }
            for (const [did, d] of Object.entries(parsed.drills)) {
              if (d.isDemo) {
                delete parsed.drills[did];
              }
            }
            for (const [certId, cert] of Object.entries(parsed.certificates || {})) {
              if (cert.isDemo) {
                delete parsed.certificates[certId];
              }
            }
            parsed.joinRequests = parsed.joinRequests ?? {};
            parsed.onboardingDrafts = parsed.onboardingDrafts ?? {};
            parsed.userMemberships = parsed.userMemberships ?? {};
            parsed.userCreatedSchoolsCount = parsed.userCreatedSchoolsCount ?? {};
            parsed.codeRateLimits = parsed.codeRateLimits ?? {};
            recomputeAllAggregates(parsed);
            return parsed;
          }
        }
      }
    } catch {
      // ignore storage errors
    }
    const empty = buildEmptyDrillStore();
    this.saveStore(empty);
    return empty;
  }

  public async hydrateFromFirestore(uid: string): Promise<void> {
    if (!uid) return;
    try {
      // 1. Load user's persisted platform state snapshot if available
      const stateSnap = await getDoc(doc(db, 'drillPlatformStates', uid));
      if (stateSnap.exists()) {
        const remote = stateSnap.data() as Partial<DrillPlatformStore>;
        if (remote.schools) {
          for (const [k, v] of Object.entries(remote.schools)) {
            if (!v.isDemo) this.store.schools[k] = v;
          }
        }
        if (remote.members) {
          this.store.members = { ...this.store.members, ...remote.members };
        }
        if (remote.invites) {
          this.store.invites = { ...this.store.invites, ...remote.invites };
        }
        if (remote.joinRequests) {
          this.store.joinRequests = { ...(this.store.joinRequests ?? {}), ...remote.joinRequests };
        }
        if (remote.userMemberships) {
          this.store.userMemberships = {
            ...(this.store.userMemberships ?? {}),
            ...remote.userMemberships
          };
        }
        if (remote.classes) {
          for (const [k, v] of Object.entries(remote.classes)) {
            if (!v.isDemo) this.store.classes[k] = v;
          }
        }
        if (remote.rosters) {
          this.store.rosters = { ...this.store.rosters, ...remote.rosters };
        }
        if (remote.drills) {
          for (const [k, v] of Object.entries(remote.drills)) {
            if (!v.isDemo) this.store.drills[k] = v;
          }
        }
        if (remote.termReports) {
          this.store.termReports = { ...this.store.termReports, ...remote.termReports };
        }
        if (remote.certificates) {
          for (const [k, v] of Object.entries(remote.certificates)) {
            if (!v.isDemo) this.store.certificates[k] = v;
          }
        }
        if (remote.activeSchoolId && this.store.schools[remote.activeSchoolId]) {
          this.store.activeSchoolId = remote.activeSchoolId;
        }
      }

      // 2. Also load shared schools collection from Firestore
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      schoolsSnap.forEach((docSnap) => {
        const s = docSnap.data() as SchoolRecord;
        if (s && s.id && !s.isDemo) {
          this.store.schools[s.id] = s;
        }
      });

      const userMems = this.getUserMemberships(uid);
      if (userMems.length > 0 && !this.store.schools[this.store.activeSchoolId]) {
        this.store.activeSchoolId = userMems[0].schoolId;
      }

      recomputeAllAggregates(this.store);
      this.saveStore(this.store, false);
    } catch {
      // Offline or Firestore rules restricted; local persistence remains active
    }
  }

  private saveStore(nextStore = this.store, syncRemote = true): void {
    this.store = nextStore;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      }
    } catch {
      // ignore quota errors
    }
    if (syncRemote && typeof window !== 'undefined' && auth.currentUser && !auth.currentUser.isAnonymous) {
      const uid = auth.currentUser.uid;
      try {
        setDoc(doc(db, 'drillPlatformStates', uid), JSON.parse(JSON.stringify(this.store))).catch(
          () => {}
        );
      } catch {}
    }
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStore(): DrillPlatformStore {
    return this.store;
  }

  public getActiveSchool(): SchoolRecord | null {
    return (
      this.store.schools[this.store.activeSchoolId] ??
      Object.values(this.store.schools)[0] ??
      null
    );
  }

  public setActiveSchool(schoolId: string): void {
    if (this.store.schools[schoolId]) {
      this.store.activeSchoolId = schoolId;
      this.saveStore();
    }
  }

  public setActiveRoleView(role: 'teacher' | 'admin' | 'platform'): void {
    this.store.activeRoleView = role;
    this.saveStore();
  }

  public setIncludeDemoInPlatform(includeDemo: boolean): void {
    this.store.includeDemoInPlatform = includeDemo;
    this.saveStore();
  }

  /**
   * Classroom-safe rate limiter keyed by target code (NEVER per-IP so 40 students on school Wi-Fi aren't blocked).
   * Max 5 failed attempts per code per 60 seconds -> 60-second code lockout.
   */
  public checkCodeRateLimit(codeKey: string): { allowed: boolean; retryAfterSec?: number } {
    this.store.codeRateLimits = this.store.codeRateLimits ?? {};
    const key = codeKey.trim().toUpperCase();
    const entry = this.store.codeRateLimits[key];
    const now = Date.now();
    if (!entry) return { allowed: true };
    if (entry.lockedUntil && entry.lockedUntil > now) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000)
      };
    }
    if (now - entry.windowStart > 60000) {
      entry.failedAttempts = 0;
      entry.windowStart = now;
      entry.lockedUntil = null;
    }
    return { allowed: true };
  }

  public recordCodeFailedAttempt(codeKey: string): void {
    this.store.codeRateLimits = this.store.codeRateLimits ?? {};
    const key = codeKey.trim().toUpperCase();
    const now = Date.now();
    const existing = this.store.codeRateLimits[key];
    if (!existing || now - existing.windowStart > 60000) {
      this.store.codeRateLimits[key] = {
        failedAttempts: 1,
        windowStart: now,
        lockedUntil: null
      };
    } else {
      existing.failedAttempts += 1;
      if (existing.failedAttempts >= 5) {
        existing.lockedUntil = now + 60000;
      }
    }
    this.saveStore();
  }

  /**
   * Saves a user's onboarding intent draft (`onboardingDrafts/{uid}`).
   * Strictly an onboarding UX convenience — grants zero permissions.
   */
  public saveOnboardingDraft(
    uid: string,
    patch: Partial<Omit<OnboardingDraftRecord, 'uid' | 'updatedAt'>>
  ): OnboardingDraftRecord {
    this.store.onboardingDrafts = this.store.onboardingDrafts ?? {};
    const existing = this.store.onboardingDrafts[uid] ?? {
      uid,
      intendedRole: 'teacher',
      updatedAt: Date.now()
    };
    const updated: OnboardingDraftRecord = {
      ...existing,
      ...patch,
      uid,
      updatedAt: Date.now()
    };
    this.store.onboardingDrafts[uid] = updated;
    this.saveStore();
    try {
      setDoc(doc(db, 'onboardingDrafts', uid), updated).catch(() => {});
    } catch {}
    return updated;
  }

  public getOnboardingDraft(uid: string): OnboardingDraftRecord | null {
    return this.store.onboardingDrafts?.[uid] ?? null;
  }

  /**
   * Returns all schools a user belongs to (`users/{uid}/memberships/{schoolId}` + `schools/{id}/members/{uid}`).
   */
  public getUserMemberships(uid: string): UserMembershipRecord[] {
    const out: UserMembershipRecord[] = [];
    const seen = new Set<string>();
    for (const [schoolId, memberList] of Object.entries(this.store.members)) {
      const m = memberList.find((item) => item.uid === uid);
      if (m && this.store.schools[schoolId]) {
        seen.add(schoolId);
        out.push({
          uid,
          schoolId,
          schoolName: this.store.schools[schoolId].name,
          role: m.role,
          joinedAt: m.joinedAt
        });
      }
    }
    const extra = this.store.userMemberships?.[uid] ?? [];
    for (const item of extra) {
      if (!seen.has(item.schoolId) && this.store.schools[item.schoolId]) {
        out.push(item);
      }
    }
    return out;
  }

  public getMemberRecordForUser(
    schoolId: string,
    uid: string | undefined | null
  ): SchoolMemberRecord | null {
    if (!uid) return null;
    const list = this.store.members[schoolId] ?? [];
    return list.find((m) => m.uid === uid) ?? null;
  }

  /**
   * Registers a new school ONLY after email verification (`emailVerified === true`).
   * Enforces per-UID cap of <= 2 created schools so an unverified account cannot flood the system.
   * Starts with `verificationStatus: 'unverified'` (invite-only, hidden from public directory search).
   * Grants `role: 'admin'` in `schools/{schoolId}/members/{uid}` and `users/{uid}/memberships/{schoolId}`.
   */
  public registerSchoolAfterVerification(params: {
    uid: string;
    emailVerified: boolean;
    displayName: string;
    email: string;
    name: string;
    city: string;
    state: string;
    udiseCode?: string;
    officialEmailDomain?: string;
  }): { ok: boolean; error?: string; school?: SchoolRecord } {
    if (!params.emailVerified) {
      return {
        ok: false,
        error: 'Email verification is required before registering a school.'
      };
    }
    const cleanName = params.name.trim();
    const cleanCity = params.city.trim();
    const cleanState = params.state.trim();
    if (!cleanName || !cleanCity || !cleanState) {
      return {
        ok: false,
        error: 'School name, city, and state are required.'
      };
    }

    this.store.userCreatedSchoolsCount = this.store.userCreatedSchoolsCount ?? {};
    const createdByUser = Object.values(this.store.schools).filter(
      (s) => !s.isDemo && s.createdBy === params.uid
    ).length;
    const recordedCount = Math.max(
      createdByUser,
      this.store.userCreatedSchoolsCount[params.uid] ?? 0
    );
    if (recordedCount >= 2) {
      return {
        ok: false,
        error:
          'Account limit reached: A single educator account can register at most 2 unverified schools.'
      };
    }

    const now = Date.now();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 24);
    const schoolId = `school-${slug || 'campus'}-${now.toString(36).slice(-4)}`;

    const newSchool: SchoolRecord = {
      id: schoolId,
      name: cleanName,
      city: cleanCity,
      state: cleanState,
      udiseCode: params.udiseCode?.trim() || undefined,
      officialEmailDomain: params.officialEmailDomain?.trim() || undefined,
      verificationStatus: 'unverified',
      verifiedAt: null,
      createdAt: now,
      createdBy: params.uid,
      isDemo: false,
      settings: {
        retentionDays: 90,
        showStudentNames: false,
        shareAnonymisedStats: false,
        allowStudentAccounts: false,
        targets: { ...DEFAULT_PROGRAM_TARGETS }
      }
    };

    const adminMember: SchoolMemberRecord = {
      uid: params.uid,
      role: 'admin',
      displayName: params.displayName || 'Principal / School Safety Lead',
      email: params.email,
      classIds: [],
      joinedAt: now
    };

    this.store.schools[schoolId] = newSchool;
    this.store.members[schoolId] = [adminMember];
    this.store.invites[schoolId] = [];
    this.store.termReports[schoolId] = [];
    this.store.joinRequests = this.store.joinRequests ?? {};
    this.store.joinRequests[schoolId] = [];
    this.store.userCreatedSchoolsCount[params.uid] = recordedCount + 1;

    this.store.userMemberships = this.store.userMemberships ?? {};
    const userMems = this.store.userMemberships[params.uid] ?? [];
    userMems.push({
      uid: params.uid,
      schoolId,
      schoolName: newSchool.name,
      role: 'admin',
      joinedAt: now
    });
    this.store.userMemberships[params.uid] = userMems;

    this.store.activeSchoolId = schoolId;
    this.store.activeRoleView = 'admin';
    recomputeAllAggregates(this.store);
    this.saveStore();

    try {
      setDoc(doc(db, 'schools', schoolId), newSchool).catch(() => {});
      setDoc(doc(db, 'schools', schoolId, 'members', params.uid), adminMember).catch(() => {});
      setDoc(doc(db, 'users', params.uid, 'memberships', schoolId), {
        uid: params.uid,
        schoolId,
        schoolName: newSchool.name,
        role: 'admin',
        joinedAt: now
      }).catch(() => {});
    } catch {}

    return { ok: true, school: newSchool };
  }

  /**
   * Updates a school's verification lifecycle (`unverified` -> `pending` -> `verified`).
   */
  public setSchoolVerificationStatus(
    schoolId: string,
    status: SchoolVerificationStatus
  ): SchoolRecord | null {
    const school = this.store.schools[schoolId];
    if (!school) return null;
    school.verificationStatus = status;
    school.verifiedAt = status === 'verified' ? Date.now() : null;
    this.saveStore();
    return school;
  }

  /**
   * Server-equivalent directory search gated to signed-in, email-verified users.
   * Queries ONLY `verificationStatus === 'verified'` schools and returns strictly `{ id, name, city, state }`.
   * Unverified and pending schools are invite-only and never appear in search results.
   */
  public searchVerifiedSchools(params: {
    query: string;
    emailVerified: boolean;
  }): {
    ok: boolean;
    error?: string;
    results: Array<{ id: string; name: string; city: string; state: string }>;
  } {
    if (!params.emailVerified) {
      return {
        ok: false,
        error: 'Verified email required to search the verified school directory.',
        results: []
      };
    }
    const q = params.query.trim().toLowerCase();
    const verifiedSchools = Object.values(this.store.schools).filter(
      (s) => s.verificationStatus === 'verified'
    );
    const filtered = q
      ? verifiedSchools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.state.toLowerCase().includes(q)
        )
      : verifiedSchools;

    return {
      ok: true,
      results: filtered.slice(0, 15).map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        state: s.state
      }))
    };
  }

  /**
   * Submits a join request under `schools/{schoolId}/joinRequests/{uid}` after finding a verified school via directory search.
   */
  public submitSchoolJoinRequest(params: {
    schoolId: string;
    uid: string;
    displayName: string;
    email: string;
    requestedRole: 'teacher' | 'student';
    targetClassId?: string;
  }): { ok: boolean; error?: string; request?: SchoolJoinRequestRecord } {
    const school = this.store.schools[params.schoolId];
    if (!school) {
      return { ok: false, error: 'School not found.' };
    }
    if (
      params.requestedRole === 'student' &&
      !school.settings.allowStudentAccounts
    ) {
      return {
        ok: false,
        error:
          'This school uses anonymous Quick Class Code Join for students and has disabled optional student accounts.'
      };
    }

    this.store.joinRequests = this.store.joinRequests ?? {};
    const list = this.store.joinRequests[params.schoolId] ?? [];
    const existingIdx = list.findIndex((r) => r.uid === params.uid);
    const req: SchoolJoinRequestRecord = {
      uid: params.uid,
      schoolId: params.schoolId,
      displayName: params.displayName || 'Educator Applicant',
      email: params.email,
      requestedRole: params.requestedRole,
      targetClassId: params.targetClassId,
      status: 'pending',
      createdAt: Date.now()
    };
    if (existingIdx >= 0) {
      list[existingIdx] = req;
    } else {
      list.unshift(req);
    }
    this.store.joinRequests[params.schoolId] = list;
    this.saveStore();

    try {
      setDoc(
        doc(db, 'schools', params.schoolId, 'joinRequests', params.uid),
        req
      ).catch(() => {});
    } catch {}

    return { ok: true, request: req };
  }

  /**
   * Approves or rejects a join request (`schools/{schoolId}/joinRequests/{targetUid}`), enforcing scoped authorization:
   * - Teacher join requests (`requestedRole === 'teacher'`) can be approved ONLY by a school `admin` (Principal).
   * - Student join requests (`requestedRole === 'student'`) can be approved by a `teacher` ONLY for their own assigned class (`class.teacherUid === reviewerUid`), or by a school `admin`.
   */
  public reviewSchoolJoinRequest(params: {
    schoolId: string;
    targetUid: string;
    reviewerUid: string;
    reviewerRole: 'admin' | 'teacher';
    decision: 'approved' | 'rejected';
    assignClassIds?: string[];
  }): { ok: boolean; error?: string; request?: SchoolJoinRequestRecord } {
    this.store.joinRequests = this.store.joinRequests ?? {};
    const list = this.store.joinRequests[params.schoolId] ?? [];
    const req = list.find((r) => r.uid === params.targetUid);
    if (!req) {
      return { ok: false, error: 'Join request not found.' };
    }

    // Scoped authorization check
    if (req.requestedRole === 'teacher' && params.reviewerRole !== 'admin') {
      return {
        ok: false,
        error:
          'Only a School Admin (Principal) can approve teacher join requests. Teachers cannot approve other teachers.'
      };
    }

    if (req.requestedRole === 'student' && params.reviewerRole === 'teacher') {
      const targetCls = req.targetClassId
        ? this.store.classes[req.targetClassId]
        : null;
      if (!targetCls || targetCls.teacherUid !== params.reviewerUid) {
        return {
          ok: false,
          error:
            'Teachers can only approve student join requests into their own assigned classes.'
        };
      }
    }

    req.status = params.decision;
    req.reviewedBy = params.reviewerUid;
    req.reviewedAt = Date.now();

    if (params.decision === 'approved') {
      const members = this.store.members[params.schoolId] ?? [];
      const classIds =
        params.assignClassIds ??
        (req.targetClassId ? [req.targetClassId] : []);
      const existing = members.find((m) => m.uid === req.uid);
      if (existing) {
        existing.role = req.requestedRole;
        existing.classIds = Array.from(new Set([...existing.classIds, ...classIds]));
      } else {
        members.push({
          uid: req.uid,
          role: req.requestedRole,
          displayName: req.displayName,
          email: req.email,
          classIds,
          joinedAt: Date.now()
        });
      }
      this.store.members[params.schoolId] = members;

      const schoolName =
        this.store.schools[params.schoolId]?.name || 'Sanjeevani School';
      this.store.userMemberships = this.store.userMemberships ?? {};
      const uMems = this.store.userMemberships[req.uid] ?? [];
      if (!uMems.some((m) => m.schoolId === params.schoolId)) {
        uMems.push({
          uid: req.uid,
          schoolId: params.schoolId,
          schoolName,
          role: req.requestedRole,
          joinedAt: Date.now()
        });
      }
      this.store.userMemberships[req.uid] = uMems;
    }

    this.saveStore();
    return { ok: true, request: req };
  }

  /**
   * Resets any residual demo data so the store contains strictly real schools and classes.
   */
  public resetOrSeedDemoSchool(): void {
    this.removeDemoData();
  }

  /**
   * Removes any `isDemo: true` records so only real registered schools remain.
   */
  public removeDemoData(): void {
    const next: DrillPlatformStore = {
      ...this.store,
      schools: {},
      members: {},
      invites: {},
      joinRequests: {},
      classes: {},
      rosters: {},
      drills: {},
      classStats: {},
      schoolStats: {},
      termReports: {},
      certificates: {}
    };

    for (const [id, s] of Object.entries(this.store.schools)) {
      if (!s.isDemo) {
        next.schools[id] = s;
        next.members[id] = this.store.members[id] ?? [];
        next.invites[id] = this.store.invites[id] ?? [];
        next.joinRequests![id] = this.store.joinRequests?.[id] ?? [];
        next.termReports[id] = (this.store.termReports[id] ?? []).filter(
          (t) => !t.isDemo
        );
      }
    }
    for (const [id, c] of Object.entries(this.store.classes)) {
      if (!c.isDemo) {
        next.classes[id] = c;
        next.rosters[id] = this.store.rosters[id] ?? [];
      }
    }
    for (const [id, d] of Object.entries(this.store.drills)) {
      if (!d.isDemo) {
        next.drills[id] = d;
      }
    }
    for (const [id, cert] of Object.entries(this.store.certificates)) {
      if (!cert.isDemo) {
        next.certificates[id] = cert;
      }
    }

    next.activeSchoolId = Object.keys(next.schools)[0] || '';
    recomputeAllAggregates(next);
    this.saveStore(next);
  }

  /**
   * Creates a new class with default S-01..S-N pseudonymous student codes and a 10-character unambiguous join code (`XXXX-XXXX-XX`).
   */
  public createClass(params: {
    name: string;
    grade: string;
    section: string;
    academicYear?: string;
    studentCount: number;
    teacherName?: string;
    teacherUid?: string;
  }): ClassRecord {
    const school = this.getActiveSchool();
    if (!school) {
      throw new Error('Please sign in and register or join a school before creating a class.');
    }
    const schoolId = school.id;
    const id = `class-${params.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()
      .toString(36)
      .slice(-4)}`;
    const joinCode = generateFormattedCode10();

    const cls: ClassRecord = {
      id,
      schoolId,
      name: params.name.trim(),
      grade: params.grade.trim(),
      section: params.section.trim().toUpperCase(),
      teacherUid: params.teacherUid || auth.currentUser?.uid || school.createdBy,
      teacherName:
        params.teacherName ||
        auth.currentUser?.displayName ||
        auth.currentUser?.email?.split('@')[0] ||
        'Class Teacher',
      academicYear: params.academicYear || '2025-26',
      studentCount: Math.max(4, Math.min(60, params.studentCount)),
      joinCode,
      joinCodeExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      archived: false,
      isDemo: false
    };

    const roster: StudentRosterRecord[] = [];
    for (let i = 1; i <= cls.studentCount; i++) {
      const code = `S-${String(i).padStart(2, '0')}`;
      roster.push({
        id: `${id}-${code}`,
        classId: id,
        code,
        assignedAnonUid: null,
        createdAt: Date.now(),
        drillsParticipated: 0,
        rolesPracticed: [],
        lastDrillAt: null
      });
    }

    this.store.classes[id] = cls;
    this.store.rosters[id] = roster;
    recomputeAllAggregates(this.store);
    this.saveStore();

    try {
      setDoc(doc(db, 'schools', schoolId, 'classes', id), cls).catch(() => {});
    } catch {}

    return cls;
  }

  public rotateClassJoinCode(classId: string): string {
    const cls = this.store.classes[classId];
    if (!cls) return '';
    cls.joinCode = generateFormattedCode10();
    cls.joinCodeExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    this.saveStore();
    return cls.joinCode;
  }

  /**
   * Starts or schedules a new Practice Drill for a single class with `teamCount` teams (3-5 students per team).
   * Writes squad_sessions with `mode: "drill"` so real-emergency sessions and drill sessions never mix.
   * Generates a 10-character `activeJoinCode` (`XXXX-XXXX-XX`) and HMAC digest.
   */
  public createDrill(params: {
    classId: string;
    scenarioId?: string;
    teamCount?: number;
    durationSec?: number;
    scheduledByRole?: 'admin' | 'teacher';
    authorizedByAdminUid?: string | null;
  }): DrillRecord {
    const cls = this.store.classes[params.classId];
    if (!cls) {
      throw new Error('Class not found');
    }
    const scenarioId = 'cardiac-arrest-unresponsive'; // Locked to single validated Adult Cardiac Arrest scenario in v1
    const scenario = DRILL_SCENARIOS[scenarioId];
    const teamCount = Math.max(
      1,
      Math.min(10, params.teamCount ?? Math.ceil(cls.studentCount / 4))
    );
    const durationSec = params.durationSec ?? scenario.defaultDurationSec;
    const drillId = `drill-${cls.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()
      .toString(36)
      .slice(-5)}`;
    const activeJoinCode = generateFormattedCode10();
    const activeJoinCodeHmac = syncDeterministicHmac(activeJoinCode);

    const runs: DrillRunRecord[] = [];
    for (let i = 1; i <= teamCount; i++) {
      const runId = `${drillId}-run-${i}`;
      const runToken = `${activeJoinCode.slice(0, 9)}-T${i}`;
      const squadSessionId = `SQUAD-DRILL-${runToken}`;

      runs.push({
        id: runId,
        drillId,
        classId: cls.id,
        schoolId: cls.schoolId,
        teamName: `Team ${i}`,
        runToken,
        squadSessionId,
        status: 'waiting',
        startedAt: null,
        endedAt: null,
        teamMembers: [],
        slotBindings: {},
        events: [],
        metrics: null,
        score: null,
        scoreVersion: SCORE_VERSION,
        scoreBreakdown: null,
        isDemo: cls.isDemo
      });

      // Mirror into squad_sessions with explicit `mode: "drill"` safety invariant when running in authenticated browser session
      try {
        if (typeof window !== 'undefined' && auth.currentUser) {
          setDoc(doc(db, 'squad_sessions', squadSessionId), {
            id: squadSessionId,
            mode: 'drill',
            schoolId: cls.schoolId,
            drillId,
            runId,
            createdAt: Date.now(),
            status: 'waiting'
          }).catch(() => {});
        }
      } catch {}
    }

    const existingCompleted = Object.values(this.store.drills).filter(
      (d) => d.classId === cls.id && d.status === 'completed'
    );

    const drill: DrillRecord = {
      id: drillId,
      schoolId: cls.schoolId,
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      teacherUid: cls.teacherUid,
      scenarioId,
      mode: 'drill',
      status: 'ready',
      scheduledAt: Date.now(),
      startedAt: null,
      endedAt: null,
      syncGraceEndsAt: null,
      activeJoinCode,
      activeJoinCodeHmac,
      scheduledByRole: params.scheduledByRole ?? 'teacher',
      authorizedByAdminUid: params.authorizedByAdminUid ?? null,
      durationSec,
      teamCount,
      notes: '',
      runs,
      summary: null,
      isBaseline: existingCompleted.length === 0,
      isDemo: cls.isDemo
    };

    this.store.drills[drillId] = drill;
    this.saveStore();
    return drill;
  }

  public startLiveDrill(drillId: string): DrillRecord | null {
    const drill = this.store.drills[drillId];
    if (!drill) return null;
    const now = Date.now();
    drill.status = 'live';
    drill.startedAt = now;
    if (!drill.activeJoinCode) {
      drill.activeJoinCode = generateFormattedCode10();
      drill.activeJoinCodeHmac = syncDeterministicHmac(drill.activeJoinCode);
    }
    for (const run of drill.runs) {
      run.status = 'live';
      run.startedAt = now;
      run.slotBindings = run.slotBindings ?? {};
    }
    this.saveStore();
    return drill;
  }

  /**
   * Teacher action: Releases a locked student roster slot (`S-01`..`S-N`) mid-drill so a student whose
   * phone refreshed or lost anonymous storage can re-join their assigned slot immediately.
   */
  public releaseStudentSlot(params: {
    drillId: string;
    runId?: string;
    studentCode: string;
  }): boolean {
    const drill = this.store.drills[params.drillId];
    if (!drill) return false;
    const cleanSlot = params.studentCode.trim().toUpperCase();
    let released = false;

    for (const run of drill.runs) {
      if (params.runId && run.id !== params.runId) continue;
      if (run.slotBindings && run.slotBindings[cleanSlot]) {
        delete run.slotBindings[cleanSlot];
        released = true;
      }
      const memberIdx = run.teamMembers.findIndex(
        (m) => m.studentCode.toUpperCase() === cleanSlot
      );
      if (memberIdx >= 0) {
        run.teamMembers.splice(memberIdx, 1);
        released = true;
      }
    }

    const roster = this.store.rosters[drill.classId] ?? [];
    const rosterStudent = roster.find((s) => s.code.toUpperCase() === cleanSlot);
    if (rosterStudent) {
      rosterStudent.assignedAnonUid = null;
    }

    if (released) {
      this.saveStore();
    }
    return released;
  }

  /**
   * Student anonymous join by `runToken`, `activeJoinCode`, or `classCode`.
   * Enforces:
   * 1. Classroom-safe per-code rate limiting (max 5 failed attempts/min per code).
   * 2. Teacher-assigned slot binding (`slotBindings[studentCode] = anonUid`) so one student cannot overwrite another's slot unless released by the teacher.
   */
  public async joinDrillRunAsStudent(params: {
    runTokenOrId: string;
    studentCode: string;
    roleId?: SquadRoleId;
    forceAnonUid?: string;
  }): Promise<{
    drill: DrillRecord;
    run: DrillRunRecord;
    anonUid: string;
    slotLockedError?: string;
  } | null> {
    const rateCheck = this.checkCodeRateLimit(params.runTokenOrId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Too many failed attempts for this code. Locked for ${rateCheck.retryAfterSec}s.`
      );
    }

    let anonUid =
      params.forceAnonUid ||
      auth.currentUser?.uid ||
      `anon-local-${params.studentCode}`;
    if (typeof window !== 'undefined' && !auth.currentUser && !params.forceAnonUid) {
      try {
        const cred = await signInAnonymously(auth);
        anonUid = cred.user.uid;
      } catch {
        // Fallback deterministic anonymous UID when offline
        const cachedUidKey = `sanjeevani_anon_uid_${params.studentCode}`;
        const existingCached = localStorage.getItem(cachedUidKey);
        if (existingCached) {
          anonUid = existingCached;
        } else {
          anonUid = `anon-offline-${params.studentCode}-${Date.now().toString(36)}`;
          try {
            localStorage.setItem(cachedUidKey, anonUid);
          } catch {}
        }
      }
    }

    const found = this.findRunByTokenOrId(params.runTokenOrId);
    if (!found) {
      this.recordCodeFailedAttempt(params.runTokenOrId);
      return null;
    }
    const { drill, run } = found;
    const cleanSlot = params.studentCode.trim().toUpperCase();

    run.slotBindings = run.slotBindings ?? {};
    // Check across all runs in this drill whether `cleanSlot` is already bound to a different anonUid
    for (const r of drill.runs) {
      const boundUid = r.slotBindings?.[cleanSlot];
      if (boundUid && boundUid !== anonUid) {
        return {
          drill,
          run: r,
          anonUid,
          slotLockedError: `Roster slot ${cleanSlot} is currently bound to another active session in ${r.teamName}. Ask your teacher to click "Release Slot" if your phone refreshed.`
        };
      }
    }

    run.slotBindings[cleanSlot] = anonUid;
    const roster = this.store.rosters[drill.classId] ?? [];
    const rosterEntry = roster.find((s) => s.code.toUpperCase() === cleanSlot);
    if (rosterEntry) {
      rosterEntry.assignedAnonUid = anonUid;
    }

    const existingMember = run.teamMembers.find(
      (m) => m.studentCode.toUpperCase() === cleanSlot
    );
    if (existingMember) {
      existingMember.anonUid = anonUid;
      existingMember.lastSyncAt = Date.now();
      if (params.roleId) existingMember.roleId = params.roleId;
    } else {
      run.teamMembers.push({
        anonUid,
        studentCode: cleanSlot,
        roleId: params.roleId,
        joinedAt: Date.now(),
        lastSyncAt: Date.now()
      });
    }

    if (params.roleId) {
      this.recordDrillEvent({
        drillId: drill.id,
        runId: run.id,
        type: 'role_claimed',
        actorUid: anonUid,
        studentCode: cleanSlot,
        roleId: params.roleId
      });
    } else {
      this.saveStore();
    }

    return { drill, run, anonUid };
  }

  public findRunByTokenOrId(
    tokenOrId: string
  ): { drill: DrillRecord; run: DrillRunRecord } | null {
    const clean = tokenOrId.trim().toUpperCase();
    for (const drill of Object.values(this.store.drills)) {
      if (drill.activeJoinCode?.toUpperCase() === clean && drill.runs.length > 0) {
        return { drill, run: drill.runs[0] };
      }
      for (const run of drill.runs) {
        if (
          run.id.toUpperCase() === clean ||
          run.runToken.toUpperCase() === clean
        ) {
          return { drill, run };
        }
      }
    }
    return null;
  }

  public findClassByJoinCodeOrId(codeOrId: string): ClassRecord | null {
    const clean = codeOrId.trim().toUpperCase();
    // Also check if `clean` matches an active drill's `activeJoinCode`
    for (const drill of Object.values(this.store.drills)) {
      if (drill.activeJoinCode?.toUpperCase() === clean) {
        return this.store.classes[drill.classId] ?? null;
      }
    }
    for (const cls of Object.values(this.store.classes)) {
      if (
        cls.id.toUpperCase() === clean ||
        cls.joinCode.toUpperCase() === clean ||
        cls.name.toUpperCase() === clean
      ) {
        return cls;
      }
    }
    return null;
  }

  /**
   * Returns the number of drill events currently queued in local offline storage (`sanjeevani_offline_drill_events_v1`).
   */
  public getOfflineQueueCount(): number {
    try {
      if (typeof localStorage === 'undefined') return 0;
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return 0;
      const list = JSON.parse(raw) as OfflineQueuedDrillEvent[];
      return Array.isArray(list) ? list.length : 0;
    } catch {
      return 0;
    }
  }

  private enqueueOfflineDrillEvent(item: OfflineQueuedDrillEvent): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const list: OfflineQueuedDrillEvent[] = raw ? JSON.parse(raw) : [];
      list.push(item);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
    } catch {}
  }

  /**
   * Flushes any locally queued offline drill events when connectivity returns (within the 15-minute sync grace window).
   */
  public flushOfflineDrillEvents(): number {
    try {
      if (typeof localStorage === 'undefined') return 0;
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return 0;
      const list: OfflineQueuedDrillEvent[] = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return 0;

      let flushed = 0;
      const now = Date.now();
      for (const item of list) {
        const drill = this.store.drills[item.drillId];
        if (!drill) continue;
        const withinGrace =
          drill.status === 'live' ||
          drill.status === 'ready' ||
          !drill.syncGraceEndsAt ||
          now <= drill.syncGraceEndsAt;
        if (!withinGrace) continue;

        const run = drill.runs.find((r) => r.id === item.runId);
        if (!run) continue;
        if (!run.events.some((e) => e.id === item.event.id)) {
          run.events.push({ ...item.event, receivedAt: now });
          flushed++;
        }
      }

      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      if (flushed > 0) {
        this.saveStore();
      }
      return flushed;
    } catch {
      return 0;
    }
  }

  /**
   * Appends an immutable event to a drill run (`events/{eventId}`).
   * If `navigator.onLine === false`, also records the event in `sanjeevani_offline_drill_events_v1` so it syncs when back online.
   */
  public recordDrillEvent(params: {
    drillId: string;
    runId: string;
    type: DrillEventType;
    actorUid: string;
    studentCode: string;
    roleId?: SquadRoleId;
    clientAt?: number;
    receivedAt?: number;
    payload?: DrillEventRecord['payload'];
  }): DrillEventRecord | null {
    const drill = this.store.drills[params.drillId];
    if (!drill) return null;
    const run = drill.runs.find((r) => r.id === params.runId);
    if (!run) return null;

    if (!drill.startedAt) {
      drill.startedAt = Date.now();
      drill.status = 'live';
    }
    if (!run.startedAt) {
      run.startedAt = drill.startedAt;
      run.status = 'live';
    }

    const now = Date.now();
    const ev: DrillEventRecord = {
      id: `${run.id}-ev-${run.events.length + 1}-${now.toString(36).slice(-4)}`,
      type: params.type,
      actorUid: params.actorUid,
      studentCode: params.studentCode,
      roleId: params.roleId,
      clientAt: params.clientAt ?? now,
      receivedAt: params.receivedAt ?? now,
      payload: params.payload
    };

    if (params.type === 'role_claimed' && params.roleId) {
      const member = run.teamMembers.find(
        (m) => m.studentCode === params.studentCode
      );
      if (member) {
        member.roleId = params.roleId;
        member.lastSyncAt = now;
      } else {
        run.teamMembers.push({
          anonUid: params.actorUid,
          studentCode: params.studentCode,
          roleId: params.roleId,
          joinedAt: now,
          lastSyncAt: now
        });
      }
    }

    run.events.push(ev);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.enqueueOfflineDrillEvent({
        drillId: drill.id,
        runId: run.id,
        event: ev,
        queuedAt: now
      });
    }

    this.saveStore();
    return ev;
  }

  /**
   * Ends a drill, scores all runs deterministically (`onRunEnded` + `onDrillCompleted`),
   * sets `syncGraceEndsAt` (+15 min for offline phones), updates student participation counters,
   * and recomputes `classStats` & `schoolStats`.
   */
  public endAndScoreDrill(drillId: string): DrillRecord | null {
    const drill = this.store.drills[drillId];
    if (!drill) return null;
    const school = this.store.schools[drill.schoolId];
    const targets = school?.settings.targets ?? DEFAULT_PROGRAM_TARGETS;
    const now = Date.now();
    const startedAt = drill.startedAt ?? now - 60000;
    const maxEventClientAt = drill.runs.reduce((maxT, r) => {
      const runMax = r.events.reduce((m, e) => Math.max(m, e.clientAt), 0);
      return Math.max(maxT, runMax);
    }, now);
    const endedAt = Math.max(now, maxEventClientAt + 1000);
    drill.startedAt = startedAt;
    drill.endedAt = endedAt;
    drill.syncGraceEndsAt = endedAt + 15 * 60 * 1000;
    drill.status = 'completed';

    const roster = this.store.rosters[drill.classId] ?? [];

    for (const run of drill.runs) {
      const rStart = run.startedAt ?? startedAt;
      const rEnd = run.endedAt ?? endedAt;
      run.startedAt = rStart;
      run.endedAt = rEnd;

      if (!run.events.some((e) => e.type === 'run_ended')) {
        run.events.push({
          id: `${run.id}-ev-end`,
          type: 'run_ended',
          actorUid: drill.teacherUid,
          studentCode: 'TEACHER',
          clientAt: rEnd,
          receivedAt: rEnd
        });
      }

      const { metrics, score, scoreBreakdown } = computeRunMetricsAndScore(
        run.events,
        rStart,
        rEnd,
        targets,
        4
      );
      run.metrics = metrics;
      run.score = score;
      run.scoreVersion = SCORE_VERSION;
      run.scoreBreakdown = scoreBreakdown;
      run.status = 'scored';

      // Update student roster participation & roles practiced
      for (const tm of run.teamMembers) {
        const student = roster.find((s) => s.code === tm.studentCode);
        if (student) {
          student.drillsParticipated += 1;
          student.lastDrillAt = now;
          student.lastDrillId = drill.id;
          if (tm.roleId && !student.rolesPracticed.includes(tm.roleId)) {
            student.rolesPracticed.push(tm.roleId);
          }
        }
      }
    }

    drill.summary = computeDrillSummaryFromRuns(drill.runs);
    recomputeAllAggregates(this.store);
    this.saveStore();
    return drill;
  }

  public updateDrillNotes(drillId: string, notes: string): void {
    const drill = this.store.drills[drillId];
    if (!drill) return;
    drill.notes = notes;
    this.saveStore();
  }

  /**
   * Issues verifiable participation certificates (`certificates/{certId}`) for a drill or class.
   */
  public issueCertificatesForDrill(
    drillId: string,
    studentCodeFilter?: string
  ): CertificateRecord[] {
    const drill = this.store.drills[drillId];
    if (!drill) return [];
    const school = this.store.schools[drill.schoolId];
    const scenario =
      DRILL_SCENARIOS[drill.scenarioId] ??
      DRILL_SCENARIOS['cardiac-arrest-unresponsive'];
    const roster = this.store.rosters[drill.classId] ?? [];
    const issued: CertificateRecord[] = [];

    for (const run of drill.runs) {
      for (const tm of run.teamMembers) {
        if (studentCodeFilter && tm.studentCode !== studentCodeFilter) continue;
        const roleSpec = scenario.roles.find((r) => r.id === tm.roleId);
        const certId = generateUnguessableId('CERT');
        const rosterEntry = roster.find((s) => s.code === tm.studentCode);

        const cert: CertificateRecord = {
          certId,
          schoolId: drill.schoolId,
          schoolName: school?.name || 'Sanjeevani Partner School',
          classId: drill.classId,
          className: drill.className,
          grade: drill.grade,
          drillId: drill.id,
          drillDateIso: new Date(drill.endedAt ?? drill.scheduledAt).toISOString(),
          scenarioTitle: scenario.title,
          studentCode: tm.studentCode,
          studentDisplayName:
            school?.settings.showStudentNames && rosterEntry?.displayName
              ? rosterEntry.displayName
              : undefined,
          rolePracticed: roleSpec?.title || 'Coordinated First-Aid Squad Responder',
          issuedAt: Date.now(),
          issuedBy: drill.teacherUid,
          revoked: false,
          isDemo: drill.isDemo
        };

        this.store.certificates[certId] = cert;
        if (rosterEntry) {
          rosterEntry.lastCertId = certId;
        }
        issued.push(cert);
      }
    }

    // If no teamMembers were logged on runs (e.g. class-level issue), issue for roster students who participated
    if (issued.length === 0) {
      for (const st of roster) {
        if (studentCodeFilter && st.code !== studentCodeFilter) continue;
        if (st.drillsParticipated <= 0 && !studentCodeFilter) continue;
        const certId = generateUnguessableId('CERT');
        const roleSpec = scenario.roles.find((r) => r.id === st.rolesPracticed[0]);
        const cert: CertificateRecord = {
          certId,
          schoolId: drill.schoolId,
          schoolName: school?.name || 'Sanjeevani Partner School',
          classId: drill.classId,
          className: drill.className,
          grade: drill.grade,
          drillId: drill.id,
          drillDateIso: new Date(drill.endedAt ?? drill.scheduledAt).toISOString(),
          scenarioTitle: scenario.title,
          studentCode: st.code,
          studentDisplayName:
            school?.settings.showStudentNames && st.displayName
              ? st.displayName
              : undefined,
          rolePracticed: roleSpec?.title || 'Coordinated First-Aid Squad Responder',
          issuedAt: Date.now(),
          issuedBy: drill.teacherUid,
          revoked: false,
          isDemo: drill.isDemo
        };
        this.store.certificates[certId] = cert;
        st.lastCertId = certId;
        issued.push(cert);
      }
    }

    this.saveStore();
    return issued;
  }

  public revokeCertificate(certId: string): boolean {
    const cert = this.store.certificates[certId];
    if (!cert) return false;
    cert.revoked = true;
    cert.revokedAt = Date.now();
    this.saveStore();
    return true;
  }

  public getCertificateById(certId: string): CertificateRecord | null {
    const clean = certId.trim().toUpperCase();
    return this.store.certificates[clean] ?? null;
  }

  /**
   * Generates a single-use 10-character invite code (`XXXX-XXXX-XX`, ~50 bits entropy).
   * Stores only HMAC-SHA256 `codeHash` / `codeHmac` in the database record and returns the plaintext code ONCE.
   */
  public async createSingleUseInvite(params: {
    schoolId: string;
    role: SchoolRole;
    classIds: string[];
    expiresInDays?: number;
  }): Promise<{ invite: SchoolInviteRecord; plaintextCode: string }> {
    const plaintextCode = generateFormattedCode10();
    const codeHash = await hmacSha256Hex(plaintextCode);
    const now = Date.now();
    const invite: SchoolInviteRecord = {
      id: `inv-${now.toString(36)}`,
      schoolId: params.schoolId,
      role: params.role,
      classIds: params.classIds,
      createdBy: auth.currentUser?.uid || 'admin-demo-1',
      createdAt: now,
      expiresAt: now + (params.expiresInDays ?? 7) * 24 * 60 * 60 * 1000,
      usedBy: null,
      revoked: false,
      failedAttempts: 0,
      lockedUntil: null,
      codeHash,
      codeHmac: codeHash
    };
    const list = this.store.invites[params.schoolId] ?? [];
    list.unshift(invite);
    this.store.invites[params.schoolId] = list;
    this.saveStore();
    return { invite, plaintextCode };
  }

  public revokeInvite(schoolId: string, inviteId: string): boolean {
    const list = this.store.invites[schoolId] ?? [];
    const target = list.find((inv) => inv.id === inviteId);
    if (!target) return false;
    target.revoked = true;
    target.revokedAt = Date.now();
    this.saveStore();
    return true;
  }

  /**
   * Redeems a single-use invite code by HMAC-SHA256 digest matching (`codeHmac` / `codeHash`).
   * Enforces per-code rate limiting (max 5 failed attempts/minute -> 60s lockout).
   * Can search across all schools if `schoolId` is omitted or `'any'`.
   */
  public async redeemInviteCode(params: {
    schoolId?: string;
    plaintextCode: string;
    uid: string;
    displayName: string;
    email: string;
    emailVerified?: boolean;
  }): Promise<{
    ok: boolean;
    error?: string;
    member?: SchoolMemberRecord;
    school?: SchoolRecord;
  }> {
    if (params.emailVerified === false) {
      return {
        ok: false,
        error: 'Please verify your email address before redeeming an invite code.'
      };
    }

    const cleanCode = params.plaintextCode.trim().toUpperCase();
    if (!cleanCode) {
      return { ok: false, error: 'Please enter a valid invite code.' };
    }

    const rateCheck = this.checkCodeRateLimit(cleanCode);
    if (!rateCheck.allowed) {
      return {
        ok: false,
        error: `Too many failed attempts for this invite code. Please wait ${rateCheck.retryAfterSec}s.`
      };
    }

    const inputHmac = await hmacSha256Hex(cleanCode);
    const syncHmac = syncDeterministicHmac(cleanCode);
    const legacySyncHash = syncDeterministicHash(cleanCode);

    const candidateSchoolIds =
      params.schoolId && params.schoolId !== 'any'
        ? [params.schoolId, ...Object.keys(this.store.invites).filter((id) => id !== params.schoolId)]
        : Object.keys(this.store.invites);

    let matchedInvite: SchoolInviteRecord | undefined;
    let matchedSchoolId: string | undefined;

    for (const sid of candidateSchoolIds) {
      const list = this.store.invites[sid] ?? [];
      const found = list.find(
        (inv) =>
          inv.codeHash === inputHmac ||
          inv.codeHmac === inputHmac ||
          inv.codeHash === syncHmac ||
          inv.codeHmac === syncHmac ||
          inv.codeHash === legacySyncHash
      );
      if (found) {
        matchedInvite = found;
        matchedSchoolId = sid;
        break;
      }
    }

    if (!matchedInvite || !matchedSchoolId) {
      this.recordCodeFailedAttempt(cleanCode);
      return { ok: false, error: 'Invalid invite code. Check the 10-character code and try again.' };
    }
    if (matchedInvite.revoked) {
      return { ok: false, error: 'This invite code has been revoked by the school administrator.' };
    }
    if (matchedInvite.lockedUntil && matchedInvite.lockedUntil > Date.now()) {
      return { ok: false, error: 'This invite code is temporarily locked due to failed attempts.' };
    }
    if (matchedInvite.usedBy) {
      return { ok: false, error: 'This single-use invite code has already been redeemed.' };
    }
    if (Date.now() > matchedInvite.expiresAt) {
      return { ok: false, error: 'This invite code has expired.' };
    }

    matchedInvite.usedBy = params.uid;
    matchedInvite.usedAt = Date.now();

    const members = this.store.members[matchedSchoolId] ?? [];
    let member = members.find((m) => m.uid === params.uid);
    if (member) {
      member.role = matchedInvite.role;
      member.classIds = Array.from(new Set([...member.classIds, ...matchedInvite.classIds]));
    } else {
      member = {
        uid: params.uid,
        role: matchedInvite.role,
        displayName: params.displayName,
        email: params.email,
        classIds: matchedInvite.classIds,
        joinedAt: Date.now()
      };
      members.push(member);
    }
    this.store.members[matchedSchoolId] = members;

    const school = this.store.schools[matchedSchoolId];
    this.store.userMemberships = this.store.userMemberships ?? {};
    const uMems = this.store.userMemberships[params.uid] ?? [];
    if (!uMems.some((m) => m.schoolId === matchedSchoolId)) {
      uMems.push({
        uid: params.uid,
        schoolId: matchedSchoolId,
        schoolName: school?.name || 'Sanjeevani School',
        role: matchedInvite.role,
        joinedAt: Date.now()
      });
    }
    this.store.userMemberships[params.uid] = uMems;

    this.store.activeSchoolId = matchedSchoolId;
    if (matchedInvite.role === 'admin' || matchedInvite.role === 'teacher') {
      this.store.activeRoleView = matchedInvite.role;
    }
    this.saveStore();
    return { ok: true, member, school };
  }

  /**
   * Updates a member's role or assigned classes, enforcing the Last-Admin Guardrail:
   * A school must always have at least 1 `admin` member.
   */
  public updateMemberRoleOrClasses(params: {
    schoolId: string;
    uid: string;
    newRole?: SchoolRole;
    newClassIds?: string[];
  }): { ok: boolean; error?: string } {
    const members = this.store.members[params.schoolId] ?? [];
    const target = members.find((m) => m.uid === params.uid);
    if (!target) return { ok: false, error: 'Member not found.' };

    if (params.newRole && params.newRole !== 'admin' && target.role === 'admin') {
      const adminCount = members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return {
          ok: false,
          error: 'Cannot demote the last school admin. Promote another member to admin first.'
        };
      }
    }

    if (params.newRole) target.role = params.newRole;
    if (params.newClassIds) target.classIds = params.newClassIds;
    this.saveStore();
    return { ok: true };
  }

  /**
   * Removes a member from the school (`members/{uid}`), enforcing the Last-Admin Guardrail
   * and reassigning or archiving their classes.
   */
  public removeSchoolMember(params: {
    schoolId: string;
    uid: string;
    reassignToTeacherUid?: string;
    archiveClasses?: boolean;
  }): { ok: boolean; error?: string } {
    const members = this.store.members[params.schoolId] ?? [];
    const target = members.find((m) => m.uid === params.uid);
    if (!target) return { ok: false, error: 'Member not found.' };

    if (target.role === 'admin') {
      const adminCount = members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        return {
          ok: false,
          error: 'Cannot remove the last school admin. Assign another admin before removing.'
        };
      }
    }

    const replacement = members.find((m) => m.uid === params.reassignToTeacherUid);
    for (const cls of Object.values(this.store.classes)) {
      if (cls.schoolId === params.schoolId && cls.teacherUid === params.uid) {
        if (params.archiveClasses) {
          cls.archived = true;
        } else if (replacement) {
          cls.teacherUid = replacement.uid;
          cls.teacherName = replacement.displayName;
        }
      }
    }

    this.store.members[params.schoolId] = members.filter((m) => m.uid !== params.uid);
    recomputeAllAggregates(this.store);
    this.saveStore();
    return { ok: true };
  }

  public updateSchoolSettings(
    schoolId: string,
    patch: Partial<SchoolSettings>
  ): SchoolRecord | null {
    const school = this.store.schools[schoolId];
    if (!school) return null;
    school.settings = {
      ...school.settings,
      ...patch,
      targets: patch.targets
        ? { ...school.settings.targets, ...patch.targets }
        : school.settings.targets
    };
    recomputeAllAggregates(this.store);
    this.saveStore();
    return school;
  }

  /**
   * Generates a frozen Term Report snapshot (`termReports/{termId}`) for printing/archiving.
   */
  public createFrozenTermReport(schoolId: string, termLabel: string): TermReportSnapshot | null {
    const school = this.store.schools[schoolId];
    const stats = this.store.schoolStats[schoolId];
    if (!school || !stats) return null;

    const termId = `TERM-${Date.now().toString(36).toUpperCase()}`;
    const schoolClasses = Object.values(this.store.classes).filter(
      (c) => c.schoolId === schoolId && !c.archived
    );

    const snapshot: TermReportSnapshot = {
      id: termId,
      schoolId,
      schoolName: school.name,
      termLabel,
      generatedAt: Date.now(),
      generatedBy: auth.currentUser?.displayName || 'School Administrator',
      isDemo: school.isDemo,
      statsSnapshot: JSON.parse(JSON.stringify(stats)),
      classRows: schoolClasses.map((c) => {
        const st = this.store.classStats[c.id];
        return {
          classId: c.id,
          className: c.name,
          grade: c.grade,
          teacherName: c.teacherName,
          drillsCompleted: st?.drillsCompleted ?? 0,
          studentsTrained: st?.studentsParticipatedCount ?? 0,
          studentCount: c.studentCount,
          baselineScore: st?.baselineScore ?? null,
          latestScore: st?.latestScore ?? null,
          readinessScore: st?.readinessScore ?? null
        };
      })
    };

    const list = this.store.termReports[schoolId] ?? [];
    list.unshift(snapshot);
    this.store.termReports[schoolId] = list;
    this.saveStore();
    return snapshot;
  }

  /**
   * Purges raw runs/events older than `school.settings.retentionDays` (default 90 days) while keeping aggregates.
   */
  public runRetentionPurge(schoolId: string, nowMs = Date.now()): number {
    const school = this.store.schools[schoolId];
    if (!school) return 0;
    let purgedCount = 0;
    for (const [id, drill] of Object.entries(this.store.drills)) {
      if (
        drill.schoolId === schoolId &&
        drill.endedAt &&
        isDrillExpiredForRetentionPurge(drill.endedAt, school.settings.retentionDays, nowMs)
      ) {
        delete this.store.drills[id];
        purgedCount++;
      }
    }
    this.saveStore();
    return purgedCount;
  }

  public deleteClassCascade(classId: string): void {
    delete this.store.classes[classId];
    delete this.store.rosters[classId];
    delete this.store.classStats[classId];
    for (const [id, d] of Object.entries(this.store.drills)) {
      if (d.classId === classId) {
        delete this.store.drills[id];
      }
    }
    recomputeAllAggregates(this.store);
    this.saveStore();
    try {
      deleteDoc(doc(db, 'classes', classId)).catch(() => {});
    } catch {}
  }

  public deleteSchoolCascade(schoolId: string): void {
    delete this.store.schools[schoolId];
    delete this.store.members[schoolId];
    delete this.store.invites[schoolId];
    if (this.store.joinRequests) {
      delete this.store.joinRequests[schoolId];
    }
    delete this.store.schoolStats[schoolId];
    delete this.store.termReports[schoolId];
    for (const [cid, c] of Object.entries(this.store.classes)) {
      if (c.schoolId === schoolId) {
        delete this.store.classes[cid];
        delete this.store.rosters[cid];
        delete this.store.classStats[cid];
      }
    }
    for (const [did, d] of Object.entries(this.store.drills)) {
      if (d.schoolId === schoolId) {
        delete this.store.drills[did];
      }
    }
    this.saveStore();
  }

  /**
   * Computes `platformStats/current` across schools that have opted into
   * `settings.shareAnonymisedStats === true`. Excludes `isDemo: true` by default
   * unless `includeDemo` is toggled on.
   */
  public computePlatformStats(includeDemo = this.store.includeDemoInPlatform): PlatformStatsRecord {
    const eligibleSchools = Object.values(this.store.schools).filter(
      (s) => s.settings.shareAnonymisedStats && (includeDemo || !s.isDemo)
    );
    const schoolIds = new Set(eligibleSchools.map((s) => s.id));
    const eligibleClasses = Object.values(this.store.classes).filter(
      (c) => schoolIds.has(c.schoolId) && !c.archived
    );
    const eligibleDrills = Object.values(this.store.drills)
      .filter(
        (d) =>
          schoolIds.has(d.schoolId) &&
          d.status === 'completed' &&
          d.summary !== null
      )
      .sort((a, b) => (a.endedAt ?? a.scheduledAt) - (b.endedAt ?? b.scheduledAt));

    let totalRunsCount = 0;
    let runsFlaggedCount = 0;
    let accelerometerRunsCount = 0;
    let tapFallbackRunsCount = 0;

    for (const d of eligibleDrills) {
      for (const r of d.runs) {
        totalRunsCount++;
        if (r.metrics?.needsReview) runsFlaggedCount++;
        if (r.metrics?.cprSource === 'accelerometer') accelerometerRunsCount++;
        else tapFallbackRunsCount++;
      }
    }

    const studentsTrainedCount = eligibleClasses.reduce(
      (acc, c) => acc + (this.store.classStats[c.id]?.studentsParticipatedCount ?? 0),
      0
    );

    const baselineDrills: DrillRecord[] = [];
    const latestDrills: DrillRecord[] = [];
    const drillOrderBuckets: Record<string, DrillRecord[]> = {
      'Drill 1 (Baseline)': [],
      'Drill 2': [],
      'Drill 3+': []
    };

    for (const cls of eligibleClasses) {
      const cDrills = eligibleDrills.filter((d) => d.classId === cls.id);
      if (cDrills.length > 0) {
        baselineDrills.push(cDrills[0]);
        latestDrills.push(cDrills[cDrills.length - 1]);
      }
      cDrills.forEach((d, idx) => {
        if (idx === 0) drillOrderBuckets['Drill 1 (Baseline)'].push(d);
        else if (idx === 1) drillOrderBuckets['Drill 2'].push(d);
        else drillOrderBuckets['Drill 3+'].push(d);
      });
    }

    const aggregateGroup = (group: DrillRecord[]) => {
      if (!group.length) {
        return {
          score: null,
          tCall112: null,
          tFirstCompression: null,
          cprInRangePct: null,
          roleCoveragePct: null,
          nDrills: 0,
          nStudents: 0
        };
      }
      const scores = group.map((d) => d.summary!.medianScore);
      const t112s = group
        .map((d) => d.summary!.medianTimeToCall112)
        .filter((v): v is number => typeof v === 'number');
      const tComps = group
        .map((d) => d.summary!.medianTimeToFirstCompression)
        .filter((v): v is number => typeof v === 'number');
      const cprs = group.map((d) => d.summary!.medianCprInRangePct);
      const roles = group.map((d) => d.summary!.roleCoveragePct);
      const nStudents = group.reduce((acc, d) => acc + d.summary!.studentsCount, 0);
      return {
        score: Math.round(computeMedian(scores)),
        tCall112: t112s.length ? Math.round(computeMedian(t112s) * 10) / 10 : null,
        tFirstCompression: tComps.length
          ? Math.round(computeMedian(tComps) * 10) / 10
          : null,
        cprInRangePct: Math.round(computeMedian(cprs)),
        roleCoveragePct: Math.round(computeMedian(roles)),
        nDrills: group.length,
        nStudents
      };
    };

    const scoreDistributionByDrillOrder = Object.entries(drillOrderBuckets).map(
      ([label, list]) => {
        const scores = list.map((d) => d.summary!.medianScore);
        const nStudents = list.reduce((acc, d) => acc + d.summary!.studentsCount, 0);
        return {
          drillNumberLabel: label,
          nDrills: list.length,
          nStudents,
          p25: computePercentile(scores, 0.25),
          median: scores.length ? Math.round(computeMedian(scores)) : 0,
          p75: computePercentile(scores, 0.75)
        };
      }
    );

    return {
      updatedAt: Date.now(),
      schoolsCount: eligibleSchools.length,
      classesCount: eligibleClasses.length,
      drillsCount: eligibleDrills.length,
      studentsTrainedCount,
      runsFlaggedCount,
      totalRunsCount,
      accelerometerRunsCount,
      tapFallbackRunsCount,
      baselineMedians: aggregateGroup(baselineDrills),
      latestMedians: aggregateGroup(latestDrills),
      scoreDistributionByDrillOrder
    };
  }

  /**
   * Exports Class Drill CSV (pseudonymous student codes by default).
   */
  public exportClassDrillsCsv(classId: string): string {
    const cls = this.store.classes[classId];
    const drills = Object.values(this.store.drills)
      .filter((d) => d.classId === classId && d.status === 'completed')
      .sort((a, b) => (a.endedAt ?? a.scheduledAt) - (b.endedAt ?? b.scheduledAt));

    const headers = [
      'school_id',
      'class_name',
      'grade',
      'drill_id',
      'drill_date_iso',
      'is_baseline',
      'is_demo',
      'team_name',
      'student_codes',
      'run_score',
      'score_version',
      't_role_coverage_sec',
      't_call112_sec',
      't_first_compression_sec',
      'cpr_median_bpm',
      'cpr_in_range_pct',
      'longest_pause_sec',
      't_aed_confirmed_sec',
      'handover_complete',
      'needs_review'
    ];

    const rows: string[][] = [headers];
    for (const d of drills) {
      const dateIso = new Date(d.endedAt ?? d.scheduledAt).toISOString();
      for (const r of d.runs) {
        const m = r.metrics;
        rows.push([
          d.schoolId,
          cls?.name || d.className,
          cls?.grade || d.grade,
          d.id,
          dateIso,
          d.isBaseline ? 'true' : 'false',
          d.isDemo ? 'true' : 'false',
          r.teamName,
          r.teamMembers.map((tm) => tm.studentCode).join('|'),
          String(r.score ?? ''),
          String(r.scoreVersion),
          String(m?.tRoleCoverage ?? ''),
          String(m?.tCall112 ?? ''),
          String(m?.tFirstCompression ?? ''),
          String(m?.cprMedianBpm ?? ''),
          String(m?.cprInRangePct ?? ''),
          String(m?.longestPauseSec ?? ''),
          String(m?.tAedConfirmed ?? ''),
          m?.handoverComplete ? 'true' : 'false',
          m?.needsReview ? 'true' : 'false'
        ]);
      }
    }

    return rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
  }

  /**
   * Exports Pilot Evidence CSV carrying the mandatory caveat row at the top.
   */
  public exportPilotEvidenceCsv(includeDemo = this.store.includeDemoInPlatform): string {
    const pStats = this.computePlatformStats(includeDemo);
    const lines: string[] = [
      `"# CAVEAT: ${PILOT_EVIDENCE_CAVEAT}"`,
      `"# Generated At: ${new Date(pStats.updatedAt).toISOString()} | Includes Demo Data: ${
        includeDemo ? 'YES' : 'NO'
      }"`,
      `"metric","baseline_median","latest_median","delta","n_drills_baseline","n_students_baseline","n_drills_latest","n_students_latest"`,
      `"readiness_score_0_100","${pStats.baselineMedians.score ?? ''}","${
        pStats.latestMedians.score ?? ''
      }","${
        pStats.baselineMedians.score !== null && pStats.latestMedians.score !== null
          ? pStats.latestMedians.score - pStats.baselineMedians.score
          : ''
      }","${pStats.baselineMedians.nDrills}","${pStats.baselineMedians.nStudents}","${
        pStats.latestMedians.nDrills
      }","${pStats.latestMedians.nStudents}"`,
      `"time_to_simulated_112_sec","${pStats.baselineMedians.tCall112 ?? ''}","${
        pStats.latestMedians.tCall112 ?? ''
      }","${
        pStats.baselineMedians.tCall112 !== null && pStats.latestMedians.tCall112 !== null
          ? (pStats.latestMedians.tCall112 - pStats.baselineMedians.tCall112).toFixed(1)
          : ''
      }","${pStats.baselineMedians.nDrills}","${pStats.baselineMedians.nStudents}","${
        pStats.latestMedians.nDrills
      }","${pStats.latestMedians.nStudents}"`,
      `"time_to_first_compression_sec","${
        pStats.baselineMedians.tFirstCompression ?? ''
      }","${pStats.latestMedians.tFirstCompression ?? ''}","${
        pStats.baselineMedians.tFirstCompression !== null &&
        pStats.latestMedians.tFirstCompression !== null
          ? (
              pStats.latestMedians.tFirstCompression -
              pStats.baselineMedians.tFirstCompression
            ).toFixed(1)
          : ''
      }","${pStats.baselineMedians.nDrills}","${pStats.baselineMedians.nStudents}","${
        pStats.latestMedians.nDrills
      }","${pStats.latestMedians.nStudents}"`,
      `"cpr_rate_in_range_pct","${pStats.baselineMedians.cprInRangePct ?? ''}","${
        pStats.latestMedians.cprInRangePct ?? ''
      }","${
        pStats.baselineMedians.cprInRangePct !== null &&
        pStats.latestMedians.cprInRangePct !== null
          ? pStats.latestMedians.cprInRangePct - pStats.baselineMedians.cprInRangePct
          : ''
      }","${pStats.baselineMedians.nDrills}","${pStats.baselineMedians.nStudents}","${
        pStats.latestMedians.nDrills
      }","${pStats.latestMedians.nStudents}"`
    ];
    return lines.join('\n');
  }
}

export const drillService = new DrillService();
export { getNextPracticeRecommendation };

