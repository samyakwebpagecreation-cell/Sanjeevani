import {
  cprRateEstimator,
  generateSyntheticCprSamples
} from '../src/utils/cprRateEstimator';
import {
  DEFAULT_PROGRAM_TARGETS,
  DrillEventRecord,
  computeReadinessMedianOfLast3,
  computeRunMetricsAndScore,
  getNextPracticeRecommendation,
  guardSmallSample,
  isDrillExpiredForRetentionPurge,
  validateEventTiming
} from '../src/services/drillEngine';
import {
  PILOT_EVIDENCE_CAVEAT,
  buildDemoSchoolSeed,
  drillService
} from '../src/services/drillService';
import {
  REQUIRED_CERTIFICATE_CAVEAT,
  buildCertificatesPdfBytes
} from '../src/utils/certificatePdf';
import * as fs from 'fs';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runAllTests() {
  console.log('=== 1. Testing CPR Rate Estimator on 5 Synthetic Signals ===');
  // 1a. Steady 110 BPM
  const steady110 = cprRateEstimator(generateSyntheticCprSamples('steady_110', 20));
  assert(
    steady110.medianBpm >= 106 && steady110.medianBpm <= 114,
    `Expected steady_110 medianBpm ~110, got ${steady110.medianBpm}`
  );
  assert(
    steady110.inRangePct >= 90,
    `Expected steady_110 inRangePct >= 90%, got ${steady110.inRangePct}%`
  );

  // 1b. Slow 80 BPM
  const slow80 = cprRateEstimator(generateSyntheticCprSamples('slow_80', 20));
  assert(
    slow80.medianBpm >= 76 && slow80.medianBpm <= 84,
    `Expected slow_80 medianBpm ~80, got ${slow80.medianBpm}`
  );
  assert(
    slow80.inRangePct === 0,
    `Expected slow_80 inRangePct === 0%, got ${slow80.inRangePct}%`
  );

  // 1c. Irregular tempo
  const irregular = cprRateEstimator(generateSyntheticCprSamples('irregular', 20));
  assert(
    irregular.inRangePct < 50,
    `Expected irregular inRangePct < 50%, got ${irregular.inRangePct}%`
  );

  // 1d. Long pause (9s)
  const pause9s = cprRateEstimator(generateSyntheticCprSamples('long_pause_9s', 20));
  assert(
    pause9s.longestPauseSec >= 8.5 && pause9s.longestPauseSec <= 10.5,
    `Expected long_pause_9s longestPauseSec ~9s, got ${pause9s.longestPauseSec}s`
  );

  // 1e. Pure noise below prominence threshold
  const noise = cprRateEstimator(generateSyntheticCprSamples('pure_noise', 20));
  assert(
    noise.compressionCount === 0 && noise.medianBpm === 0,
    `Expected pure_noise compressionCount=0, got ${noise.compressionCount}`
  );
  console.log('✓ CPR Rate Estimator passed all 5 synthetic signal tests.');

  console.log('=== 2. Testing Readiness Score v1 Formula & Threshold Edges ===');
  const t0 = 1_700_000_000_000;
  const tEnd = t0 + 150_000;
  const perfectEvents: DrillEventRecord[] = [
    { id: '1', type: 'role_claimed', actorUid: 'u1', studentCode: 'S-01', roleId: '112_caller', clientAt: t0 + 5000, receivedAt: t0 + 5100 },
    { id: '2', type: 'role_claimed', actorUid: 'u2', studentCode: 'S-02', roleId: 'cpr_compressor', clientAt: t0 + 8000, receivedAt: t0 + 8100 },
    { id: '3', type: 'role_claimed', actorUid: 'u3', studentCode: 'S-03', roleId: 'aed_runner', clientAt: t0 + 12000, receivedAt: t0 + 12100 },
    { id: '4', type: 'role_claimed', actorUid: 'u4', studentCode: 'S-04', roleId: 'crowd_airway', clientAt: t0 + 15000, receivedAt: t0 + 15100 },
    { id: '5', type: 'call112_confirmed', actorUid: 'u1', studentCode: 'S-01', roleId: '112_caller', clientAt: t0 + 20000, receivedAt: t0 + 20100 },
    { id: '6', type: 'cpr_started', actorUid: 'u2', studentCode: 'S-02', roleId: 'cpr_compressor', clientAt: t0 + 22000, receivedAt: t0 + 22100 },
    {
      id: '7',
      type: 'cpr_rate_sample',
      actorUid: 'u2',
      studentCode: 'S-02',
      roleId: 'cpr_compressor',
      clientAt: t0 + 50000,
      receivedAt: t0 + 50100,
      payload: { bpm: 110, inRangePct: 100, longestPauseSec: 2, source: 'accelerometer' }
    },
    { id: '8', type: 'aed_confirmed', actorUid: 'u3', studentCode: 'S-03', roleId: 'aed_runner', clientAt: t0 + 70000, receivedAt: t0 + 70100 },
    {
      id: '9',
      type: 'handover_generated',
      actorUid: 'u4',
      studentCode: 'S-04',
      roleId: 'crowd_airway',
      clientAt: t0 + 95000,
      receivedAt: t0 + 95100,
      payload: {
        handoverFields: { incidentType: true, t0Recorded: true, actionsSummary: true, cprSummary: true }
      }
    }
  ];
  const perfectScored = computeRunMetricsAndScore(perfectEvents, t0, tEnd, DEFAULT_PROGRAM_TARGETS, 4);
  assert(perfectScored.score === 100, `Expected perfect run score 100, got ${perfectScored.score}`);
  assert(!perfectScored.metrics.needsReview, 'Expected perfect run needsReview=false');

  // Empty run edge case
  const emptyScored = computeRunMetricsAndScore([], t0, tEnd, DEFAULT_PROGRAM_TARGETS, 4);
  assert(emptyScored.score === 0, `Expected empty run score 0, got ${emptyScored.score}`);

  // Timing sanity check: event before t0, after tEnd+5s, and >10min offline drift
  const beforeT0 = validateEventTiming({ type: 'cpr_started', clientAt: t0 - 5000, receivedAt: t0 }, t0, tEnd);
  assert(beforeT0.needsReview === true, 'Expected event before t0 to flag needsReview');
  const afterEnd = validateEventTiming({ type: 'cpr_started', clientAt: tEnd + 9000, receivedAt: tEnd + 9000 }, t0, tEnd);
  assert(afterEnd.needsReview === true, 'Expected event >5s after tEnd to flag needsReview');
  const lateSync = validateEventTiming(
    { type: 'cpr_started', clientAt: t0 + 10000, receivedAt: t0 + 10000 + 12 * 60 * 1000 },
    t0,
    tEnd
  );
  assert(lateSync.needsReview === true, 'Expected event synced >10min late to flag needsReview');
  console.log('✓ Readiness Score v1, edge cases, and timing sanity validation passed.');

  console.log('=== 3. Testing Median-of-Last-3, Small-Sample Suppression (n<5), Retention & Tips ===');
  assert(computeReadinessMedianOfLast3([40, 72, 88]) === 72, 'Expected median of [40, 72, 88] to be 72');
  assert(computeReadinessMedianOfLast3([30, 40, 80, 90]) === 80, 'Expected median of last 3 [40, 80, 90] to be 80');

  const suppressed4 = guardSmallSample(85, '85/100', 4, 5);
  assert(suppressed4.suppressed === true && suppressed4.value === null, 'Expected n=4 to be suppressed');
  const allowed5 = guardSmallSample(85, '85/100', 5, 5);
  assert(allowed5.suppressed === false && allowed5.value === 85, 'Expected n=5 to be shown');

  assert(
    isDrillExpiredForRetentionPurge(t0, 365, t0 + 366 * 24 * 60 * 60 * 1000) === true,
    'Expected 366-day-old drill to be expired for 365-day retention'
  );
  assert(
    isDrillExpiredForRetentionPurge(t0, 365, t0 + 200 * 24 * 60 * 60 * 1000) === false,
    'Expected 200-day-old drill to be retained'
  );

  const tip = getNextPracticeRecommendation(
    {
      tCall112: 20,
      tFirstCompression: 65,
      cprInRangePct: 80,
      longestPauseSec: 3,
      tAedConfirmed: 70,
      tRoleCoverage: 20,
      handoverComplete: true
    },
    DEFAULT_PROGRAM_TARGETS
  );
  assert(
    tip.protocolSlug === 'cpr-adult-cardiac-arrest',
    `Expected slow first compression to recommend cpr-adult-cardiac-arrest, got ${tip.protocolSlug}`
  );
  console.log('✓ Median-of-last-3, n<5 suppression, retention purge, and rule-based tip lookup passed.');

  console.log('=== 4. Testing End-to-End Drill Simulation, Offline Event Sync, Invites & Certificates ===');
  drillService.resetOrSeedDemoSchool();
  const seededStore = drillService.getStore();
  assert(
    Object.keys(seededStore.classes).length === 3,
    'Expected 3 classes in seeded demo school (8-A, 8-B, 9-A)'
  );
  assert(
    Object.keys(seededStore.drills).length === 6,
    'Expected 6 completed drills in seeded demo school'
  );

  // Verify Class 8-B progression (baseline -> follow-up improvement)
  const stats8B = seededStore.classStats['class-8b'];
  assert(
    stats8B &&
      stats8B.baselineScore !== null &&
      stats8B.latestScore !== null &&
      stats8B.latestScore > stats8B.baselineScore,
    `Expected Class 8-B latestScore (${stats8B?.latestScore}) > baselineScore (${stats8B?.baselineScore})`
  );

  // Create a live drill, simulate 4 students joining (including 1 student syncing events after 30s offline), end & score
  const liveDrill = drillService.createDrill({ classId: 'class-8b', teamCount: 2 });
  drillService.startLiveDrill(liveDrill.id);
  const run1 = liveDrill.runs[0];
  const startMs = liveDrill.startedAt!;

  await drillService.joinDrillRunAsStudent({
    runTokenOrId: run1.runToken,
    studentCode: 'S-01',
    roleId: '112_caller'
  });
  await drillService.joinDrillRunAsStudent({
    runTokenOrId: run1.runToken,
    studentCode: 'S-02',
    roleId: 'cpr_compressor'
  });
  await drillService.joinDrillRunAsStudent({
    runTokenOrId: run1.runToken,
    studentCode: 'S-03',
    roleId: 'aed_runner'
  });
  await drillService.joinDrillRunAsStudent({
    runTokenOrId: run1.runToken,
    studentCode: 'S-04',
    roleId: 'crowd_airway'
  });

  // Simulated 112 call
  drillService.recordDrillEvent({
    drillId: liveDrill.id,
    runId: run1.id,
    type: 'call112_confirmed',
    actorUid: 'anon-S-01',
    studentCode: 'S-01',
    roleId: '112_caller',
    clientAt: startMs + 18000,
    receivedAt: startMs + 18100
  });

  // Student S-02 goes offline for 30s during CPR, then reconnects and syncs
  drillService.recordDrillEvent({
    drillId: liveDrill.id,
    runId: run1.id,
    type: 'cpr_started',
    actorUid: 'anon-S-02',
    studentCode: 'S-02',
    roleId: 'cpr_compressor',
    clientAt: startMs + 22000,
    receivedAt: startMs + 52000 // synced 30s later (well within 10min tolerance)
  });
  drillService.recordDrillEvent({
    drillId: liveDrill.id,
    runId: run1.id,
    type: 'cpr_rate_sample',
    actorUid: 'anon-S-02',
    studentCode: 'S-02',
    roleId: 'cpr_compressor',
    clientAt: startMs + 45000,
    receivedAt: startMs + 52500,
    payload: { bpm: 112, inRangePct: 92, longestPauseSec: 3.0, source: 'accelerometer' }
  });
  drillService.recordDrillEvent({
    drillId: liveDrill.id,
    runId: run1.id,
    type: 'aed_confirmed',
    actorUid: 'anon-S-03',
    studentCode: 'S-03',
    roleId: 'aed_runner',
    clientAt: startMs + 68000,
    receivedAt: startMs + 68100
  });
  drillService.recordDrillEvent({
    drillId: liveDrill.id,
    runId: run1.id,
    type: 'handover_generated',
    actorUid: 'anon-S-04',
    studentCode: 'S-04',
    roleId: 'crowd_airway',
    clientAt: startMs + 85000,
    receivedAt: startMs + 85100,
    payload: {
      handoverFields: { incidentType: true, t0Recorded: true, actionsSummary: true, cprSummary: true }
    }
  });

  const completed = drillService.endAndScoreDrill(liveDrill.id);
  assert(
    completed !== null && completed.status === 'completed' && completed.runs[0].score !== null,
    'Expected live drill to transition to completed and score Team 1'
  );
  assert(
    completed!.runs[0].metrics?.needsReview === false,
    'Expected 30s offline sync event to pass timing sanity check without flagging needsReview'
  );

  // Test Certificate issuance, PDF generation, and revocation
  const issuedCerts = drillService.issueCertificatesForDrill(liveDrill.id);
  assert(issuedCerts.length >= 4, `Expected >=4 certificates issued, got ${issuedCerts.length}`);
  const pdfBytes = buildCertificatesPdfBytes([
    {
      certId: issuedCerts[0].certId,
      schoolName: issuedCerts[0].schoolName,
      className: issuedCerts[0].className,
      grade: issuedCerts[0].grade,
      drillDateIso: issuedCerts[0].drillDateIso,
      scenarioTitle: issuedCerts[0].scenarioTitle,
      studentIdentifier: issuedCerts[0].studentCode,
      rolePracticed: issuedCerts[0].rolePracticed,
      verifyUrl: `https://sanjeevani.app/verify/${issuedCerts[0].certId}`,
      isDemo: true
    }
  ]);
  const pdfText = new TextDecoder().decode(pdfBytes);
  assert(
    pdfText.startsWith('%PDF-1.4') && pdfText.includes(REQUIRED_CERTIFICATE_CAVEAT),
    'Expected generated PDF bytes to be valid PDF-1.4 and contain REQUIRED_CERTIFICATE_CAVEAT'
  );

  drillService.revokeCertificate(issuedCerts[0].certId);
  assert(
    drillService.getCertificateById(issuedCerts[0].certId)?.revoked === true,
    'Expected certificate revocation to persist'
  );

  // Test Single-Use Hashed Invite & Last-Admin Guardrail
  const schoolId = 'school-demo-sarvodaya';
  const { invite, plaintextCode } = await drillService.createSingleUseInvite({
    schoolId,
    role: 'teacher',
    classIds: ['class-8b']
  });
  assert(
    invite.codeHash !== plaintextCode && invite.codeHash.length >= 16,
    'Expected invite record to store only SHA-256 codeHash, never plaintext'
  );
  const redeem1 = await drillService.redeemInviteCode({
    schoolId,
    plaintextCode,
    uid: 'teacher-new-99',
    displayName: 'Test Teacher',
    email: 'test@school.edu.in'
  });
  assert(redeem1.ok === true, 'Expected first invite redemption to succeed');
  const redeem2 = await drillService.redeemInviteCode({
    schoolId,
    plaintextCode,
    uid: 'teacher-new-100',
    displayName: 'Second Teacher',
    email: 'test2@school.edu.in'
  });
  assert(redeem2.ok === false, 'Expected second redemption of single-use invite to be rejected');

  // Last-admin guardrail check
  const demoteLastAdmin = drillService.updateMemberRoleOrClasses({
    schoolId,
    uid: 'admin-demo-1',
    newRole: 'teacher'
  });
  assert(
    demoteLastAdmin.ok === false,
    'Expected demoting the sole admin to be blocked by last-admin guardrail'
  );

  // Pilot Evidence CSV caveat check
  const pilotCsv = drillService.exportPilotEvidenceCsv(true);
  assert(
    pilotCsv.includes(PILOT_EVIDENCE_CAVEAT),
    'Expected Pilot Evidence CSV to include mandatory PILOT_EVIDENCE_CAVEAT'
  );

  // Firestore rules static verification
  const rulesText = fs.readFileSync('firestore.rules', 'utf-8');
  assert(
    rulesText.includes('match /certificates/{certId}') &&
      rulesText.includes('allow get: if true;') &&
      rulesText.includes('allow list: if false;'),
    'Expected firestore.rules to enforce get-only (no list) on /certificates/{certId}'
  );
  assert(
    rulesText.includes('match /platformStats/{docId}') &&
      rulesText.includes('allow get, list: if isPlatformTeam();'),
    'Expected firestore.rules to restrict /platformStats to platform team'
  );
  assert(
    rulesText.includes('match /events/{eventId}') &&
      rulesText.includes('allow update, delete: if false;'),
    'Expected firestore.rules to enforce append-only immutability on /events/{eventId}'
  );

  console.log('✓ End-to-End simulation, offline sync, invites, certificates, and security rules checks passed!');
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
