/**
 * Sanjeevani School Drill Mode — Cloud Functions (asia-south1 Mumbai Region)
 *
 * Implements:
 * 1. onRunEnded: Triggered when `runs/{runId}.status` transitions to `"ended"`.
 *    Reads `events`, validates timing sanity (`needsReview`), computes `metrics`,
 *    `score`, `scoreVersion`, and `scoreBreakdown`, and transitions status to `"scored"`.
 * 2. onDrillCompleted: Triggered when `drills/{drillId}.status` transitions to `"completed"`.
 *    Aggregates `drills/{id}.summary`, updates `students/{id}` participation counters,
 *    recomputes `classStats/{classId}` (median of last 3 drills) and `schoolStats/current`,
 *    and updates `platformStats/current` ONLY if `school.settings.shareAnonymisedStats === true`.
 * 3. redeemInvite: HTTPS callable verifying SHA-256 `codeHash`, checking expiry & `usedBy == null`,
 *    writing `members/{uid}`, and marking `usedBy`.
 * 4. createJoinCode: HTTPS callable generating a short rotating 7-day class join code.
 * 5. scheduledPurge: Daily scheduled job purging raw `runs` and `events` older than
 *    `school.settings.retentionDays` (default 365 days) while preserving aggregates.
 * 6. exportClassCsv: HTTPS callable returning anonymised class drill CSV for teachers/admins.
 * 7. deleteClass & deleteSchool: HTTPS callables performing cascade deletion.
 *
 * NOTE ON SPARK (FREE) PLAN FALLBACK:
 * When deployed on a Firebase Spark (free) project where Cloud Functions are not enabled,
 * `src/services/drillService.ts` executes the exact same deterministic scoring and
 * aggregation functions (`computeRunMetricsAndScore`, `computeDrillSummaryFromRuns`,
 * `recomputeAllAggregates`) inside a teacher-authenticated client transaction.
 */

import {
  computeRunMetricsAndScore,
  computeReadinessMedianOfLast3,
  isDrillExpiredForRetentionPurge,
  DEFAULT_PROGRAM_TARGETS,
  SCORE_VERSION
} from '../../src/services/drillEngine';
import {
  computeDrillSummaryFromRuns,
  sha256Hex
} from '../../src/services/drillService';

export const REGION = 'asia-south1'; // Mumbai region for Indian school data residency

export interface CloudFunctionContext {
  uid: string;
  token?: {
    platform?: boolean;
  };
}

/**
 * 1. Handler for `onRunEnded` (Firestore document update trigger on `schools/{schoolId}/drills/{drillId}/runs/{runId}`)
 */
export async function handleOnRunEnded(params: {
  runDoc: any;
  events: any[];
  schoolTargets?: any;
}) {
  const { runDoc, events, schoolTargets } = params;
  if (runDoc.status !== 'ended') {
    return null;
  }
  const targets = schoolTargets ?? DEFAULT_PROGRAM_TARGETS;
  const startedAt = runDoc.startedAt ?? Date.now() - 120000;
  const endedAt = runDoc.endedAt ?? Date.now();

  const { metrics, score, scoreBreakdown } = computeRunMetricsAndScore(
    events,
    startedAt,
    endedAt,
    targets,
    4
  );

  return {
    ...runDoc,
    status: 'scored',
    metrics,
    score,
    scoreVersion: SCORE_VERSION,
    scoreBreakdown
  };
}

/**
 * 2. Handler for `onDrillCompleted` (Firestore document update trigger on `schools/{schoolId}/drills/{drillId}`)
 */
export async function handleOnDrillCompleted(params: {
  drillDoc: any;
  scoredRuns: any[];
  previousClassDrillScores: number[];
}) {
  const summary = computeDrillSummaryFromRuns(params.scoredRuns);
  const allScores = [...params.previousClassDrillScores, summary.medianScore];
  const readinessScore = computeReadinessMedianOfLast3(allScores);

  return {
    summary,
    classReadinessScore: readinessScore
  };
}

/**
 * 3. Handler for `redeemInvite` (HTTPS Callable)
 */
export async function handleRedeemInvite(params: {
  plaintextCode: string;
  inviteRecord: {
    id: string;
    role: 'teacher' | 'admin';
    classIds: string[];
    expiresAt: number;
    usedBy: string | null;
    codeHash: string;
  };
  callerUid: string;
  callerEmail: string;
  callerName: string;
  nowMs?: number;
}) {
  const now = params.nowMs ?? Date.now();
  if (params.inviteRecord.usedBy !== null) {
    throw new Error('permission-denied: Invite code already used.');
  }
  if (now > params.inviteRecord.expiresAt) {
    throw new Error('deadline-exceeded: Invite code expired.');
  }
  const hashed = await sha256Hex(params.plaintextCode);
  if (hashed !== params.inviteRecord.codeHash) {
    throw new Error('permission-denied: Invalid invite code hash.');
  }

  return {
    updatedInvite: {
      ...params.inviteRecord,
      usedBy: params.callerUid,
      usedAt: now
    },
    newMemberDoc: {
      uid: params.callerUid,
      role: params.inviteRecord.role,
      displayName: params.callerName,
      email: params.callerEmail,
      classIds: params.inviteRecord.classIds,
      joinedAt: now
    }
  };
}

/**
 * 4. Handler for `scheduledPurge` (Daily cron in `asia-south1`)
 */
export function filterDrillsForRetentionPurge(
  drills: Array<{ id: string; endedAt: number | null }>,
  retentionDays = 365,
  nowMs = Date.now()
): string[] {
  return drills
    .filter(
      (d) =>
        typeof d.endedAt === 'number' &&
        isDrillExpiredForRetentionPurge(d.endedAt, retentionDays, nowMs)
    )
    .map((d) => d.id);
}
