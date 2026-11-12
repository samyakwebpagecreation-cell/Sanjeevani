# Sanjeevani School Drill Mode — Firestore Data Model (`DATA_MODEL.md`)

## 1. Safety Boundary & Separation from Real Emergencies
1. **Strict Separation**: Real emergency documents (`squad_sessions/{sessionId}`, `paramedic_dockets/{docketId}`) and school practice drill documents (`schools/{schoolId}/...`) never mix.
2. **Mode Tagging**: Any `squad_sessions/{sessionId}` document without `mode: "drill"` is treated as a real emergency. When `mode: "drill"` is present on a session beacon, `firestore.rules` enforces that `schoolId`, `drillId`, and `runId` are also present, and the UI suppresses `tel:112` calling in favour of a simulated `call112_confirmed` event.

---

## 2. Collection & Subcollection Hierarchy

```text
schools/{schoolId}
  name, city, state, udiseCode?, createdAt, createdBy, isDemo?: boolean
  settings: {
    retentionDays: 365,
    showStudentNames: false,       // default false (anonymous S-01..S-40 codes only)
    shareAnonymisedStats: false,   // explicit opt-in for platformStats/current
    targets: {
      call112FullSec: 30, call112ZeroSec: 120,
      firstCompressionFullSec: 30, firstCompressionZeroSec: 120,
      roleCoverageFullSec: 30, roleCoverageZeroSec: 90,
      aedConfirmedTargetSec: 90,
      cprMinBpm: 100, cprMaxBpm: 120, cprInRangeTargetPct: 70,
      pausePenaltyStartSec: 5, pauseZeroSec: 20,
      instructorConfirmed: false
    }
  }

  members/{uid}
    role: "admin" | "teacher",
    displayName, email, classIds: string[], joinedAt

  invites/{inviteId}
    role: "admin" | "teacher",
    classIds: string[], createdBy, createdAt, expiresAt,
    usedBy: string | null, usedAt?: number | null,
    codeHash: string               // SHA-256 hex digest ONLY (plaintext shown once in UI)

  classes/{classId}
    schoolId, name ("8-B"), grade ("8"), section ("B"),
    teacherUid, teacherName, academicYear ("2025-26"),
    studentCount, joinCode, joinCodeExpiresAt, archived: boolean, isDemo?: boolean

    students/{studentId}
      code: "S-01".."S-40",
      displayName?: string,        // stored ONLY if school.settings.showStudentNames === true
      createdAt, drillsParticipated, rolesPracticed: string[], lastDrillAt, lastCertId?

  drills/{drillId}
    schoolId, classId, className, grade, teacherUid,
    scenarioId: "cardiac-arrest-unresponsive",
    mode: "drill",
    status: "draft" | "scheduled" | "ready" | "live" | "ended" | "completed" | "cancelled",
    scheduledAt, startedAt, endedAt, durationSec, teamCount, notes,
    summary: {
      teamsCount, studentsCount, medianScore, p25Score, p75Score,
      medianTimeToFirstCompression, medianTimeToCall112,
      medianCprInRangePct, medianAedConfirmedSec, roleCoveragePct, handoverCompletePct
    },
    isBaseline?: boolean, isDemo?: boolean

    runs/{runId}
      drillId, classId, schoolId, teamName, runToken, squadSessionId,
      status: "waiting" | "live" | "ended" | "scored",
      startedAt, endedAt,
      teamMembers: [{ anonUid, studentCode, roleId, joinedAt }],
      metrics: {
        tRoleCoverage, tCall112, tFirstCompression, tAedConfirmed,
        tCrowdControlled, tHandoverGenerated,
        cprMedianBpm, cprInRangePct, longestPauseSec, cprSource,
        rolesFilled, rolesTotal, handoverComplete, handoverFieldsCompleted,
        needsReview, reviewReasons
      },
      score: number,
      scoreVersion: 1,
      scoreBreakdown: { ... }

      events/{eventId}             // Append-only, immutable
        type: "role_claimed" | "call112_confirmed" | "cpr_started" | "cpr_rate_sample"
            | "cpr_stopped" | "aed_confirmed" | "crowd_controlled"
            | "handover_generated" | "run_ended",
        actorUid, studentCode, roleId?, clientAt, receivedAt, payload?

  classStats/{classId}
    updatedAt, drillsCompleted, studentsParticipatedCount,
    readinessScore,                // MEDIAN of last 3 completed drills
    baselineDrillId, baselineScore, baselineAt, baselineStudentsCount,
    latestDrillId, latestScore, latestAt, latestStudentsCount,
    trendSeries: [...]

  schoolStats/current
    updatedAt, classesActive, classesTotal, drillsThisTerm,
    studentsTrainedThisTerm, studentsTotal,
    readinessScore,                // MEDIAN of active class readiness scores
    byGrade: { [grade]: { readiness, drills, studentsCount } },
    baselineSummary: { ... }, latestSummary: { ... },
    monthlyByClass: { [classId]: [{ month, drills, medianScore }] }

  termReports/{termId}
    schoolId, schoolName, termLabel, generatedAt, generatedBy,
    statsSnapshot, classRows

certificates/{certId}              // Top-level public get-only verification collection
  certId, schoolId, schoolName, classId, className, grade,
  drillId, drillDateIso, scenarioTitle, rolePracticed,
  issuedAt, issuedBy, revoked: boolean

platformStats/current              // Restricted to request.auth.token.platform == true
  updatedAt, schoolsCount, classesCount, drillsCount, studentsTrainedCount,
  runsFlaggedCount, totalRunsCount, accelerometerRunsCount, tapFallbackRunsCount,
  baselineMedians, latestMedians, scoreDistributionByDrillOrder
```

---

## 3. Composite Indexes (`firestore.indexes.json`)
- `drills`: `(classId ASC, status ASC, endedAt DESC)`
- `drills`: `(schoolId ASC, status ASC, endedAt DESC)`
- `events`: `(runId ASC, clientAt ASC)`
- `classes`: `(schoolId ASC, grade ASC)`
