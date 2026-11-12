import { cprRateEstimator, CprSample, computeMedian } from '../utils/cprRateEstimator';

export const SCORE_VERSION = 1;

export type DrillStatus =
  | 'draft'
  | 'scheduled'
  | 'ready'
  | 'live'
  | 'ended'
  | 'completed'
  | 'cancelled';

export type RunStatus = 'waiting' | 'live' | 'ended' | 'scored';

export type SquadRoleId =
  | '112_caller'
  | 'cpr_compressor'
  | 'aed_runner'
  | 'crowd_airway';

export type DrillEventType =
  | 'role_claimed'
  | 'call112_confirmed'
  | 'cpr_started'
  | 'cpr_rate_sample'
  | 'cpr_stopped'
  | 'aed_confirmed'
  | 'crowd_controlled'
  | 'handover_generated'
  | 'run_ended';

export interface ScenarioRoleSpec {
  id: SquadRoleId;
  title: string;
  shortLabel: string;
  description: string;
  primaryActionLabel: string;
  eventType: DrillEventType;
  protocolSlug: string;
}

export interface DrillScenarioSpec {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  recommendedTeamSize: { min: number; max: number };
  defaultDurationSec: number;
  protocolSlug: string;
  roles: ScenarioRoleSpec[];
  idealTimelineSec: {
    role_claimed: number;
    call112_confirmed: number;
    cpr_started: number;
    aed_confirmed: number;
    crowd_controlled: number;
    handover_generated: number;
  };
}

export const DRILL_SCENARIOS: Record<string, DrillScenarioSpec> = {
  'cardiac-arrest-unresponsive': {
    id: 'cardiac-arrest-unresponsive',
    title: 'Unresponsive person, suspected cardiac arrest',
    subtitle: 'Campus collapse • 4-role coordinated squad response',
    summary:
      'A person has collapsed in the school corridor and is unresponsive with absent or abnormal breathing. Coordinate your team to simulate calling 112, begin chest compressions at 100–120 BPM, retrieve the AED, clear the crowd, and prepare the paramedic handover docket.',
    recommendedTeamSize: { min: 3, max: 5 },
    defaultDurationSec: 180,
    protocolSlug: 'cpr-adult-cardiac-arrest',
    roles: [
      {
        id: '112_caller',
        title: '112 Caller & Dispatcher Liaison',
        shortLabel: '112 Caller',
        description:
          'Confirm unresponsive state, trigger the simulated 112 emergency call, state campus location clearly, and stay on speaker.',
        primaryActionLabel: 'Simulate 112 Call & Confirm Location',
        eventType: 'call112_confirmed',
        protocolSlug: 'unresponsive-not-breathing-adult'
      },
      {
        id: 'cpr_compressor',
        title: 'Chest Compressor (100–120 BPM)',
        shortLabel: 'CPR Compressor',
        description:
          'Start continuous hands-only chest compressions immediately in the center of the chest at 100–120 BPM with minimal pauses.',
        primaryActionLabel: 'Start CPR Rhythm Coach',
        eventType: 'cpr_started',
        protocolSlug: 'cpr-adult-cardiac-arrest'
      },
      {
        id: 'aed_runner',
        title: 'AED & First-Aid Kit Runner',
        shortLabel: 'AED + Kit Runner',
        description:
          'Locate the nearest campus AED and emergency kit, bring it to the patient, and confirm arrival.',
        primaryActionLabel: 'I have the AED & Kit at scene',
        eventType: 'aed_confirmed',
        protocolSlug: 'aed-automated-external-defibrillator'
      },
      {
        id: 'crowd_airway',
        title: 'Crowd Control & Handover Scribe',
        shortLabel: 'Crowd + Handover',
        description:
          'Keep a 2-meter clear perimeter around the patient, direct someone to the school gate, and generate the paramedic handover summary.',
        primaryActionLabel: 'Confirm Perimeter & Generate Handover',
        eventType: 'crowd_controlled',
        protocolSlug: 'recovery-position-lateral-safety'
      }
    ],
    idealTimelineSec: {
      role_claimed: 15,
      call112_confirmed: 30,
      cpr_started: 30,
      crowd_controlled: 45,
      aed_confirmed: 90,
      handover_generated: 120
    }
  }
};

export interface ProgramTargets {
  /** Program targets (NOT clinical standards). Marked for confirmation by a certified first-aid instructor. */
  call112FullSec: number; // default 30s
  call112ZeroSec: number; // default 120s
  firstCompressionFullSec: number; // default 30s
  firstCompressionZeroSec: number; // default 120s
  roleCoverageFullSec: number; // default 30s
  roleCoverageZeroSec: number; // default 90s
  aedConfirmedTargetSec: number; // default 90s
  cprMinBpm: number; // default 100
  cprMaxBpm: number; // default 120
  cprInRangeTargetPct: number; // default 70
  pausePenaltyStartSec: number; // default 5s
  pauseZeroSec: number; // default 20s
  instructorConfirmed: boolean;
}

export const DEFAULT_PROGRAM_TARGETS: ProgramTargets = {
  call112FullSec: 30,
  call112ZeroSec: 120,
  firstCompressionFullSec: 30,
  firstCompressionZeroSec: 120,
  roleCoverageFullSec: 30,
  roleCoverageZeroSec: 90,
  aedConfirmedTargetSec: 90,
  cprMinBpm: 100,
  cprMaxBpm: 120,
  cprInRangeTargetPct: 70,
  pausePenaltyStartSec: 5,
  pauseZeroSec: 20,
  instructorConfirmed: false
};

export interface DrillEventRecord {
  id: string;
  type: DrillEventType;
  actorUid: string;
  studentCode: string;
  roleId?: SquadRoleId;
  /** Client-recorded timestamp in ms using server-offset clock */
  clientAt: number;
  /** Server-received timestamp in ms */
  receivedAt: number;
  payload?: {
    bpm?: number;
    inRangePct?: number;
    longestPauseSec?: number;
    source?: 'accelerometer' | 'tap';
    samples?: CprSample[];
    handoverFields?: {
      incidentType?: boolean;
      t0Recorded?: boolean;
      actionsSummary?: boolean;
      cprSummary?: boolean;
    };
    note?: string;
  };
}

export interface ScoreSubItem {
  points: number;
  maxPoints: number;
  rawMetricLabel: string;
  ruleExplanation: string;
}

export interface ScoreBreakdown {
  scoreVersion: number;
  total: number;
  call112: ScoreSubItem;
  firstCompression: ScoreSubItem;
  cprRateQuality: ScoreSubItem;
  roleCoverage: ScoreSubItem;
  handoverCompleteness: ScoreSubItem;
}

export interface RunMetrics {
  tRoleCoverage: number | null;
  tCall112: number | null;
  tFirstCompression: number | null;
  tAedConfirmed: number | null;
  tCrowdControlled: number | null;
  tHandoverGenerated: number | null;
  cprMedianBpm: number;
  cprInRangePct: number;
  longestPauseSec: number;
  cprSource: 'accelerometer' | 'tap';
  rolesFilled: number;
  rolesTotal: number;
  handoverComplete: boolean;
  handoverFieldsCompleted: number;
  needsReview: boolean;
  reviewReasons: string[];
}

export interface TimingValidationResult {
  valid: boolean;
  needsReview: boolean;
  reason?: string;
}

/**
 * Validates event timestamps against run start/end and offline sync drift rules:
 * - clientAt must be >= runStartAtMs - 1000ms
 * - clientAt must be <= runEndAtMs + 5000ms (if runEndAtMs is known)
 * - |receivedAt - clientAt| must be <= 10 minutes (600,000ms) for offline sync tolerance
 */
export function validateEventTiming(
  event: Pick<DrillEventRecord, 'clientAt' | 'receivedAt' | 'type'>,
  runStartAtMs: number,
  runEndAtMs?: number | null
): TimingValidationResult {
  if (event.clientAt < runStartAtMs - 1000) {
    return {
      valid: false,
      needsReview: true,
      reason: `Event ${event.type} timestamp precedes drill start (t0)`
    };
  }
  if (typeof runEndAtMs === 'number' && event.clientAt > runEndAtMs + 5000) {
    return {
      valid: false,
      needsReview: true,
      reason: `Event ${event.type} timestamp is >5s after drill end`
    };
  }
  const driftMs = Math.abs(event.receivedAt - event.clientAt);
  if (driftMs > 10 * 60 * 1000) {
    return {
      valid: false,
      needsReview: true,
      reason: `Event ${event.type} synced >10 min after client timestamp`
    };
  }
  return { valid: true, needsReview: false };
}

/**
 * Linear interpolation helper between full-score threshold and zero-score threshold
 * where lower time is better (e.g. <= 30s = full points, >= 120s = 0 points).
 */
export function interpolateTimeScore(
  elapsedSec: number | null,
  fullSec: number,
  zeroSec: number,
  maxPoints: number
): number {
  if (elapsedSec === null || elapsedSec < 0 || !Number.isFinite(elapsedSec)) {
    return 0;
  }
  if (elapsedSec <= fullSec) return maxPoints;
  if (elapsedSec >= zeroSec) return 0;
  const ratio = 1 - (elapsedSec - fullSec) / (zeroSec - fullSec);
  return Math.round(ratio * maxPoints * 10) / 10;
}

/**
 * Deterministic calculation of per-run metrics and Readiness Score v1 (0–100).
 * Every sub-score includes its exact formula & program threshold explanation.
 */
export function computeRunMetricsAndScore(
  events: DrillEventRecord[],
  runStartAtMs: number,
  runEndAtMs: number | null,
  targets: ProgramTargets = DEFAULT_PROGRAM_TARGETS,
  rolesTotal = 4
): { metrics: RunMetrics; score: number; scoreBreakdown: ScoreBreakdown } {
  const sorted = [...events].sort((a, b) => a.clientAt - b.clientAt);
  const reviewReasons: string[] = [];

  for (const ev of sorted) {
    const check = validateEventTiming(ev, runStartAtMs, runEndAtMs);
    if (check.needsReview && check.reason) {
      reviewReasons.push(check.reason);
    }
  }

  const toElapsedSec = (tMs: number) =>
    Math.max(0, Math.round(((tMs - runStartAtMs) / 1000) * 10) / 10);

  // 1. Role coverage tracking
  const claimedRoles = new Set<SquadRoleId>();
  let tRoleCoverage: number | null = null;
  for (const ev of sorted) {
    if (ev.type === 'role_claimed' && ev.roleId) {
      claimedRoles.add(ev.roleId);
      if (claimedRoles.size >= rolesTotal && tRoleCoverage === null) {
        tRoleCoverage = toElapsedSec(ev.clientAt);
      }
    }
  }
  const rolesFilled = Math.min(rolesTotal, claimedRoles.size);

  // 2. Key milestone timestamps
  const call112Ev = sorted.find((e) => e.type === 'call112_confirmed');
  const tCall112 = call112Ev ? toElapsedSec(call112Ev.clientAt) : null;

  const cprStartEv = sorted.find(
    (e) => e.type === 'cpr_started' || e.type === 'cpr_rate_sample'
  );
  const tFirstCompression = cprStartEv ? toElapsedSec(cprStartEv.clientAt) : null;

  const aedEv = sorted.find((e) => e.type === 'aed_confirmed');
  const tAedConfirmed = aedEv ? toElapsedSec(aedEv.clientAt) : null;

  const crowdEv = sorted.find((e) => e.type === 'crowd_controlled');
  const tCrowdControlled = crowdEv ? toElapsedSec(crowdEv.clientAt) : null;

  const handoverEv = sorted.find((e) => e.type === 'handover_generated');
  const tHandoverGenerated = handoverEv ? toElapsedSec(handoverEv.clientAt) : null;

  // 3. CPR rate & pause evaluation
  const cprSampleEvents = sorted.filter((e) => e.type === 'cpr_rate_sample');
  let cprMedianBpm = 0;
  let cprInRangePct = 0;
  let longestPauseSec = 0;
  let cprSource: 'accelerometer' | 'tap' = 'tap';

  const rawSamples: CprSample[] = [];
  for (const ev of cprSampleEvents) {
    if (ev.payload?.samples && ev.payload.samples.length > 0) {
      rawSamples.push(...ev.payload.samples);
    }
  }

  if (rawSamples.length >= 2) {
    const est = cprRateEstimator(rawSamples, {
      minBpm: targets.cprMinBpm,
      maxBpm: targets.cprMaxBpm
    });
    cprMedianBpm = est.medianBpm;
    cprInRangePct = est.inRangePct;
    longestPauseSec = est.longestPauseSec;
    cprSource = est.source;
  } else if (cprSampleEvents.length > 0) {
    const bpms = cprSampleEvents
      .map((e) => e.payload?.bpm)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const inRanges = cprSampleEvents
      .map((e) => e.payload?.inRangePct)
      .filter((v): v is number => typeof v === 'number');
    const pauses = cprSampleEvents
      .map((e) => e.payload?.longestPauseSec)
      .filter((v): v is number => typeof v === 'number');

    cprMedianBpm = bpms.length > 0 ? Math.round(computeMedian(bpms)) : 0;
    cprInRangePct =
      inRanges.length > 0
        ? Math.round(inRanges.reduce((a, b) => a + b, 0) / inRanges.length)
        : bpms.length > 0
        ? Math.round(
            (bpms.filter((b) => b >= targets.cprMinBpm && b <= targets.cprMaxBpm).length /
              bpms.length) *
              100
          )
        : 0;
    longestPauseSec = pauses.length > 0 ? Math.max(...pauses) : 0;
    if (cprSampleEvents.some((e) => e.payload?.source === 'accelerometer')) {
      cprSource = 'accelerometer';
    }
  }

  // 4. Handover completeness (4 required fields: incidentType, t0Recorded, actionsSummary, cprSummary)
  let handoverFieldsCompleted = 0;
  if (handoverEv) {
    const hf = handoverEv.payload?.handoverFields;
    if (hf) {
      if (hf.incidentType) handoverFieldsCompleted++;
      if (hf.t0Recorded) handoverFieldsCompleted++;
      if (hf.actionsSummary) handoverFieldsCompleted++;
      if (hf.cprSummary) handoverFieldsCompleted++;
    } else {
      handoverFieldsCompleted = 4;
    }
  }
  const handoverComplete = handoverFieldsCompleted === 4;

  // =========================================================================
  // Score v1 Formula (0–100)
  // =========================================================================
  // 1) Time to simulated 112 call (20 pts): <=30s = 20, >=120s = 0, linear between
  const call112Pts = interpolateTimeScore(
    tCall112,
    targets.call112FullSec,
    targets.call112ZeroSec,
    20
  );

  // 2) Time to first compression (25 pts): <=30s = 25, >=120s = 0, linear between
  const firstCompPts = interpolateTimeScore(
    tFirstCompression,
    targets.firstCompressionFullSec,
    targets.firstCompressionZeroSec,
    25
  );

  // 3) CPR rate & hands-off quality (25 pts):
  //    15 pts * (cprInRangePct / 100) + 10 pts for pause <= 5s (linearly 0 at >= 20s)
  let cprRatePts = 0;
  let pausePts = 0;
  if (tFirstCompression !== null && (cprSampleEvents.length > 0 || rawSamples.length > 0)) {
    cprRatePts = Math.round((15 * (Math.min(100, Math.max(0, cprInRangePct)) / 100)) * 10) / 10;
    pausePts = interpolateTimeScore(
      longestPauseSec,
      targets.pausePenaltyStartSec,
      targets.pauseZeroSec,
      10
    );
  }
  const cprQualityPts = Math.round((cprRatePts + pausePts) * 10) / 10;

  // 4) Role coverage (15 pts): 15 * (rolesFilled / rolesTotal) if covered <= 30s;
  //    if covered between 30s and 90s, linearly scaled down to 50% of role coverage points.
  const baseCoveragePts = 15 * (rolesFilled / Math.max(1, rolesTotal));
  let roleCoveragePts = baseCoveragePts;
  if (tRoleCoverage !== null && tRoleCoverage > targets.roleCoverageFullSec) {
    const timePenaltyFactor =
      tRoleCoverage >= targets.roleCoverageZeroSec
        ? 0.5
        : 1 -
          0.5 *
            ((tRoleCoverage - targets.roleCoverageFullSec) /
              (targets.roleCoverageZeroSec - targets.roleCoverageFullSec));
    roleCoveragePts = baseCoveragePts * timePenaltyFactor;
  } else if (tRoleCoverage === null && rolesFilled < rolesTotal) {
    roleCoveragePts = baseCoveragePts * 0.75;
  }
  roleCoveragePts = Math.round(roleCoveragePts * 10) / 10;

  // 5) Handover completeness (15 pts): 15 pts if all 4 fields present before run end, proportional otherwise
  const handoverPts = Math.round((15 * (handoverFieldsCompleted / 4)) * 10) / 10;

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(call112Pts + firstCompPts + cprQualityPts + roleCoveragePts + handoverPts)
    )
  );

  const scoreBreakdown: ScoreBreakdown = {
    scoreVersion: SCORE_VERSION,
    total: totalScore,
    call112: {
      points: call112Pts,
      maxPoints: 20,
      rawMetricLabel: tCall112 !== null ? `${tCall112}s` : 'Not confirmed',
      ruleExplanation: `≤${targets.call112FullSec}s = 20 pts, ≥${targets.call112ZeroSec}s = 0 pts (linear program target)`
    },
    firstCompression: {
      points: firstCompPts,
      maxPoints: 25,
      rawMetricLabel: tFirstCompression !== null ? `${tFirstCompression}s` : 'Not started',
      ruleExplanation: `≤${targets.firstCompressionFullSec}s = 25 pts, ≥${targets.firstCompressionZeroSec}s = 0 pts (linear program target)`
    },
    cprRateQuality: {
      points: cprQualityPts,
      maxPoints: 25,
      rawMetricLabel:
        tFirstCompression !== null
          ? `${cprInRangePct}% in ${targets.cprMinBpm}–${targets.cprMaxBpm} BPM (${cprMedianBpm} BPM median, ${longestPauseSec}s max pause)`
          : 'No rhythm samples',
      ruleExplanation: `15 pts × (% in ${targets.cprMinBpm}–${targets.cprMaxBpm} BPM) + 10 pts for max pause ≤${targets.pausePenaltyStartSec}s (0 at ≥${targets.pauseZeroSec}s)`
    },
    roleCoverage: {
      points: roleCoveragePts,
      maxPoints: 15,
      rawMetricLabel:
        tRoleCoverage !== null
          ? `${rolesFilled}/${rolesTotal} roles in ${tRoleCoverage}s`
          : `${rolesFilled}/${rolesTotal} roles claimed`,
      ruleExplanation: `15 pts × (rolesFilled / ${rolesTotal}) when all roles claimed within ≤${targets.roleCoverageFullSec}s`
    },
    handoverCompleteness: {
      points: handoverPts,
      maxPoints: 15,
      rawMetricLabel: `${handoverFieldsCompleted}/4 handover fields`,
      ruleExplanation: `15 pts when incident type, t0, actions & CPR summary are generated before drill end`
    }
  };

  const metrics: RunMetrics = {
    tRoleCoverage,
    tCall112,
    tFirstCompression,
    tAedConfirmed,
    tCrowdControlled,
    tHandoverGenerated,
    cprMedianBpm,
    cprInRangePct,
    longestPauseSec,
    cprSource,
    rolesFilled,
    rolesTotal,
    handoverComplete,
    handoverFieldsCompleted,
    needsReview: reviewReasons.length > 0,
    reviewReasons
  };

  return { metrics, score: totalScore, scoreBreakdown };
}

/**
 * Readiness Score = MEDIAN of the last up to 3 completed drills (never mean).
 */
export function computeReadinessMedianOfLast3(
  completedDrillMedianScores: number[]
): number | null {
  if (!completedDrillMedianScores || completedDrillMedianScores.length === 0) {
    return null;
  }
  const last3 = completedDrillMedianScores.slice(-3);
  return Math.round(computeMedian(last3));
}

export interface SmallSampleGuardResult<T> {
  suppressed: boolean;
  value: T | null;
  displayLabel: string;
  n: number;
}

/**
 * Small-sample suppression rule:
 * Any group statistic with n < 5 students MUST be suppressed and show "Not enough data yet".
 */
export function guardSmallSample<T>(
  value: T,
  formattedValue: string,
  nStudents: number,
  minN = 5
): SmallSampleGuardResult<T> {
  if (nStudents < minN) {
    return {
      suppressed: true,
      value: null,
      displayLabel: 'Not enough data yet (n < 5)',
      n: nStudents
    };
  }
  return {
    suppressed: false,
    value,
    displayLabel: formattedValue,
    n: nStudents
  };
}

export interface PracticeRecommendation {
  weakestKey:
    | 'firstCompression'
    | 'call112'
    | 'cprRateQuality'
    | 'aedConfirmed'
    | 'roleCoverage'
    | 'handoverCompleteness';
  headline: string;
  reason: string;
  actionTip: string;
  protocolSlug: string;
  protocolTitle: string;
}

/**
 * Deterministic rule-based recommendation mapping the weakest metric or role timing
 * directly to a protocol in the Sanjeevani First-Aid Library (no LLM required).
 */
export function getNextPracticeRecommendation(
  metrics: Pick<
    RunMetrics,
    | 'tCall112'
    | 'tFirstCompression'
    | 'cprInRangePct'
    | 'longestPauseSec'
    | 'tAedConfirmed'
    | 'tRoleCoverage'
    | 'handoverComplete'
  >,
  targets: ProgramTargets = DEFAULT_PROGRAM_TARGETS,
  focusRole?: SquadRoleId
): PracticeRecommendation {
  if (
    focusRole === '112_caller' ||
    metrics.tCall112 === null ||
    metrics.tCall112 > targets.call112FullSec + 12
  ) {
    return {
      weakestKey: 'call112',
      headline: 'Practise: Immediate 112 Call & Speakerphone Hand-off',
      reason:
        metrics.tCall112 === null
          ? 'The simulated 112 call was not confirmed during this run.'
          : `Simulated 112 call took ${metrics.tCall112}s (program target ≤${targets.call112FullSec}s).`,
      actionTip:
        'Assign the 112 Caller within the first 10 seconds and put the phone on speaker while chest compressions begin.',
      protocolSlug: 'unresponsive-not-breathing-adult',
      protocolTitle: 'Unresponsive & Not Breathing (Adult)'
    };
  }

  if (
    focusRole === 'cpr_compressor' &&
    (metrics.tFirstCompression === null ||
      metrics.tFirstCompression > targets.firstCompressionFullSec + 10)
  ) {
    return {
      weakestKey: 'firstCompression',
      headline: 'Practise: Starting Chest Compressions Within 30 Seconds',
      reason:
        metrics.tFirstCompression === null
          ? 'Chest compressions were not started during this run.'
          : `First compression started at ${metrics.tFirstCompression}s (program target ≤${targets.firstCompressionFullSec}s).`,
      actionTip:
        'As soon as abnormal or absent breathing is noted, place hands in the center of the chest and begin pushing at 100–120 BPM.',
      protocolSlug: 'cpr-adult-cardiac-arrest',
      protocolTitle: 'Adult CPR — Cardiac Arrest'
    };
  }

  if (
    metrics.tFirstCompression === null ||
    metrics.tFirstCompression > targets.firstCompressionFullSec + 10
  ) {
    return {
      weakestKey: 'firstCompression',
      headline: 'Practise: Starting Chest Compressions Within 30 Seconds',
      reason:
        metrics.tFirstCompression === null
          ? 'Chest compressions were not started during this run.'
          : `Median time to first compression was ${metrics.tFirstCompression}s (program target ≤${targets.firstCompressionFullSec}s).`,
      actionTip:
        'Do not wait for the AED to arrive before starting hands-only CPR. Start compressions immediately while the runner fetches the AED.',
      protocolSlug: 'cpr-adult-cardiac-arrest',
      protocolTitle: 'Adult CPR — Cardiac Arrest'
    };
  }

  if (
    metrics.cprInRangePct < targets.cprInRangeTargetPct ||
    metrics.longestPauseSec > targets.pausePenaltyStartSec + 3
  ) {
    return {
      weakestKey: 'cprRateQuality',
      headline: 'Practise: Keeping 100–120 BPM Tempo & Minimising Pauses',
      reason: `CPR rhythm was ${metrics.cprInRangePct}% in range with a ${metrics.longestPauseSec}s longest pause (program target ≥${targets.cprInRangeTargetPct}% in range, pause ≤${targets.pausePenaltyStartSec}s).`,
      actionTip:
        'Follow the CPR audio metronome pulse and count out loud so the next compressor can switch in under 5 seconds.',
      protocolSlug: 'cpr-adult-cardiac-arrest',
      protocolTitle: 'Adult CPR — Cardiac Arrest'
    };
  }

  if (
    focusRole === 'aed_runner' ||
    metrics.tAedConfirmed === null ||
    metrics.tAedConfirmed > targets.aedConfirmedTargetSec
  ) {
    return {
      weakestKey: 'aedConfirmed',
      headline: 'Practise: Rapid AED Retrieval & Pad Placement',
      reason:
        metrics.tAedConfirmed === null
          ? 'AED arrival was not confirmed before the drill ended.'
          : `AED confirmed at ${metrics.tAedConfirmed}s (program target ≤${targets.aedConfirmedTargetSec}s).`,
      actionTip:
        'Ensure every student knows the exact cabinet location of the campus AED and announces arrival clearly.',
      protocolSlug: 'aed-automated-external-defibrillator',
      protocolTitle: 'Automated External Defibrillator (AED)'
    };
  }

  if (!metrics.handoverComplete || focusRole === 'crowd_airway') {
    return {
      weakestKey: 'handoverCompleteness',
      headline: 'Practise: Crowd Perimeter & Complete Paramedic Handover',
      reason: !metrics.handoverComplete
        ? 'The 4-field paramedic handover summary was incomplete when the drill ended.'
        : 'Practise keeping a clear 2m perimeter and logging t0 + actions for arriving paramedics.',
      actionTip:
        'Have the Crowd & Handover responder generate the handover docket as soon as CPR and AED roles are underway.',
      protocolSlug: 'recovery-position-lateral-safety',
      protocolTitle: 'Recovery Position & Scene Handover'
    };
  }

  return {
    weakestKey: 'roleCoverage',
    headline: 'Practise: Sub-25s Full Squad Role Claiming',
    reason: `All core targets met. Role coverage completed in ${metrics.tRoleCoverage ?? 25}s.`,
    actionTip:
      'Rotate students to a different squad role on the next drill so every student practises both 112 calling and CPR rhythm.',
    protocolSlug: 'cpr-adult-cardiac-arrest',
    protocolTitle: 'Adult CPR — Cardiac Arrest'
  };
}

/**
 * Pure retention helper: returns true if a raw drill/run record has exceeded
 * the school's retention window (default 365 days) and should be purged while keeping aggregates.
 */
export function isDrillExpiredForRetentionPurge(
  endedAtMs: number,
  retentionDays = 365,
  nowMs = Date.now()
): boolean {
  if (!endedAtMs || retentionDays <= 0) return false;
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  return nowMs - endedAtMs > maxAgeMs;
}
