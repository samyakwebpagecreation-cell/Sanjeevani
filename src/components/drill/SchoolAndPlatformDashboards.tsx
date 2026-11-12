import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Plus,
  Printer,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react';
import { Badge, Button, Card } from '../common/DesignSystem';
import {
  PILOT_EVIDENCE_CAVEAT,
  SchoolRole,
  SchoolVerificationStatus,
  TermReportSnapshot,
  drillService
} from '../../services/drillService';
import { guardSmallSample } from '../../services/drillEngine';
import { Play } from 'lucide-react';

function downloadCsvString(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadParentPrivacyNoticeText(schoolName: string) {
  const notice = [
    `SANJEEVANI SCHOOL READINESS — PARENT & GUARDIAN PRIVACY NOTICE (DPDP ACT ALIGNED)`,
    `School: ${schoolName}`,
    `Date: ${new Date().toLocaleDateString('en-IN')}`,
    ``,
    `1. PURPOSE OF PRACTICE DRILLS`,
    `Students participate in classroom-supervised first-aid & cardiac arrest response practice drills.`,
    `All 112 calls in Drill Mode are strictly simulated on-screen and never dial emergency dispatch.`,
    ``,
    `2. DEFAULT QUICK-JOIN MODE (PSEUDONYMOUS STUDENT CODES)`,
    `By default, students join active classroom practice drills using a session code and a teacher-assigned`,
    `roster slot (S-01..S-40). No student email address, phone number, or parent email address is collected`,
    `by the quick-join device. Any paper or local mapping between S-01..S-40 and student names is held`,
    `exclusively by the school teacher as school-managed personal data.`,
    ``,
    `3. RETENTION & RIGHT TO ERASURE`,
    `Raw practice drill event logs are automatically purged after 90 days by default while preserving`,
    `de-identified class readiness medians. School administrators can delete all school data at any time.`
  ].join('\n');
  const blob = new Blob([notice], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sanjeevani-parent-privacy-notice.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ============================================================================
 * 1. SCHOOL DASHBOARD & FROZEN TERM REPORT (/school & /school/reports/:termId)
 * ============================================================================ */
export interface SchoolDashboardScreenProps {
  termId?: string | null;
  onNavigate: (path: string) => void;
}

export const SchoolDashboardScreen: React.FC<SchoolDashboardScreenProps> = ({
  termId,
  onNavigate
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const [confirmDeleteSchool, setConfirmDeleteSchool] = useState(false);

  const store = drillService.getStore();
  const school = drillService.getActiveSchool();

  if (!school) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">No Active School Registered</h1>
        <p className="text-sm text-ink-muted">
          Please sign in, verify your email, and register or link your school to access the School Readiness Dashboard.
        </p>
      </div>
    );
  }

  const stats = store.schoolStats[school.id];
  const schoolClasses = Object.values(store.classes).filter(
    (c) => c.schoolId === school.id && !c.archived
  );
  const reports = store.termReports[school.id] ?? [];
  const activeReport: TermReportSnapshot | null = termId
    ? reports.find((r) => r.id === termId) ?? reports[0] ?? null
    : null;

  const nTrained = stats?.studentsTrainedThisTerm ?? 0;
  const readinessGuard = guardSmallSample(
    stats?.readinessScore ?? null,
    stats?.readinessScore !== null && stats?.readinessScore !== undefined
      ? `${stats.readinessScore}/100`
      : '—',
    nTrained,
    5
  );

  const handleGenerateTermReport = () => {
    const snap = drillService.createFrozenTermReport(
      school.id,
      `Academic Year 2025–26 • Snapshot ${new Date().toLocaleDateString('en-IN')}`
    );
    if (snap) {
      onNavigate(`/school/reports/${snap.id}`);
    }
  };

  // If viewing a specific frozen Term Report (/school/reports/:termId)
  if (activeReport) {
    const snap = activeReport.statsSnapshot;
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/school')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Live School Dashboard</span>
          </button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            <span>Print Frozen Term Report (A4)</span>
          </Button>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Frozen Term Readiness Report • ID: {activeReport.id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
                {activeReport.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                {activeReport.termLabel} • Generated{' '}
                {new Date(activeReport.generatedAt).toLocaleDateString('en-IN')}{' '}
                by {activeReport.generatedBy}
              </p>
            </div>
            {activeReport.isDemo && (
              <Badge variant="alert">DEMO DATA SNAPSHOT</Badge>
            )}
          </div>

          {/* Mandatory Caveat */}
          <div className="p-4 rounded-xl bg-primary-soft/50 border border-primary/30 text-xs sm:text-sm font-semibold text-ink">
            <strong>Evidence Caveat:</strong> {PILOT_EVIDENCE_CAVEAT}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums">
            <div className="p-4 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                School Readiness (Median)
              </span>
              <span className="text-3xl font-extrabold text-primary">
                {snap.readinessScore !== null ? `${snap.readinessScore}/100` : '—'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                Classes &amp; Drills
              </span>
              <span className="text-2xl font-extrabold text-ink">
                {snap.classesActive}/{snap.classesTotal} classes • {snap.drillsThisTerm} drills
              </span>
            </div>
            <div className="p-4 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                Students Trained
              </span>
              <span className="text-2xl font-extrabold text-ink">
                {snap.studentsTrainedThisTerm}/{snap.studentsTotal} (n={snap.studentsTrainedThisTerm})
              </span>
            </div>
          </div>

          {/* Class Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="py-2.5 pr-3 font-bold">Class</th>
                  <th className="py-2.5 px-3 font-bold">Grade</th>
                  <th className="py-2.5 px-3 font-bold">Teacher</th>
                  <th className="py-2.5 px-3 font-bold text-right">Drills Run</th>
                  <th className="py-2.5 px-3 font-bold text-right">Students (n)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Baseline Score</th>
                  <th className="py-2.5 px-3 font-bold text-right">Latest Score</th>
                  <th className="py-2.5 pl-3 font-bold text-right">Readiness (Median of 3)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-mono tabular-nums">
                {activeReport.classRows.map((row) => (
                  <tr key={row.classId}>
                    <td className="py-2.5 pr-3 font-sans font-bold text-ink">
                      Class {row.className}
                    </td>
                    <td className="py-2.5 px-3 font-sans">Grade {row.grade}</td>
                    <td className="py-2.5 px-3 font-sans text-ink-muted">
                      {row.teacherName}
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.drillsCompleted}</td>
                    <td className="py-2.5 px-3 text-right">
                      {row.studentsTrained}/{row.studentCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.baselineScore !== null ? `${row.baselineScore}/100` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.latestScore !== null ? `${row.latestScore}/100` : '—'}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold text-primary">
                      {row.studentsTrained < 5
                        ? 'Not enough data (n<5)'
                        : row.readinessScore !== null
                        ? `${row.readinessScore}/100`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              School Readiness Dashboard
            </span>
            {school.isDemo && <Badge variant="neutral">DEMO SCHOOL</Badge>}
            {school.verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary-soft border border-primary/30 text-primary text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Verified School (Listed in Directory)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FEF3C7] border border-amber-500/40 text-[#B45309] text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {school.verificationStatus === 'pending'
                    ? 'Verification Pending — Invite-Only (Hidden from Directory)'
                    : 'Unverified School — Invite-Only (Hidden from Directory)'}
                </span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            {school.name}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            {school.city}, {school.state} • UDISE:{' '}
            <span className="font-mono">{school.udiseCode || 'N/A'}</span> • Region: asia-south1 (Mumbai)
          </p>
        </div>

        <div className="print:hidden flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => onNavigate('/school/members')}
          >
            <Users className="w-4 h-4" />
            <span>Members, Invites &amp; Join Queue</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <Settings className="w-4 h-4" />
            <span>School Settings</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateTermReport}
          >
            <Printer className="w-4 h-4" />
            <span>Print Term Report</span>
          </Button>
        </div>
      </div>

      {/* School Verification Status & Single-Class Practice Drill Facilitation Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 space-y-2.5 border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              School Verification Lifecycle (unverified → pending → verified)
            </span>
            {school.verificationStatus === 'unverified' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  drillService.setSchoolVerificationStatus(school.id, 'pending')
                }
              >
                <span>Request Institutional Verification</span>
              </Button>
            )}
            {school.verificationStatus === 'pending' && (
              <Badge variant="soft">Pending Institutional Review</Badge>
            )}
            {school.verificationStatus === 'verified' && (
              <Badge variant="soft">Verified Institutional Domain</Badge>
            )}
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            A verified email address proves inbox ownership only — never school legitimacy. Unverified and pending schools remain strictly <strong>invite-only</strong> and never appear in directory search until verified via official school email domain or institutional check.
          </p>
        </Card>

        <Card className="p-4 sm:p-5 space-y-2.5 border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Principal Single-Class Practice Drill Facilitator
              </span>
              <span className="text-xs text-ink-muted">
                Launch or co-facilitate a single-class Practice Drill (simultaneous whole-school drills are disabled in v1).
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {schoolClasses.map((cls) => (
              <Button
                key={cls.id}
                variant="secondary"
                size="sm"
                onClick={() => {
                  const created = drillService.createDrill({
                    classId: cls.id,
                    teamCount: 4
                  });
                  drillService.startLiveDrill(created.id);
                  onNavigate(`/teach/drills/${created.id}/live`);
                }}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Practice Drill: Class {cls.name}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* School Settings Drawer */}
      {showSettings && (
        <Card className="p-5 sm:p-6 border-2 border-primary/40 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-ink">
                School Governance, Program Targets &amp; DPDP Child-Privacy Settings
              </h2>
              <p className="text-xs text-ink-muted">
                Default targets are marked as program targets to be confirmed by a certified first-aid instructor.
              </p>
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => downloadParentPrivacyNoticeText(school.name)}
            >
              <Download className="w-4 h-4" />
              <span>Download Parent Privacy Notice (.txt)</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="p-4 rounded-xl bg-base border border-border flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={school.settings.shareAnonymisedStats}
                onChange={(e) =>
                  drillService.updateSchoolSettings(school.id, {
                    shareAnonymisedStats: e.target.checked
                  })
                }
                className="w-4 h-4 mt-1 accent-primary"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-ink block">
                  Opt-in to Anonymised Pilot Evidence (shareAnonymisedStats)
                </span>
                <span className="text-ink-muted">
                  Shares only aggregate school medians with Sanjeevani&apos;s `/platform` evidence view.
                </span>
              </div>
            </label>

            <label className="p-4 rounded-xl bg-base border border-border flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={school.settings.showStudentNames}
                onChange={(e) =>
                  drillService.updateSchoolSettings(school.id, {
                    showStudentNames: e.target.checked
                  })
                }
                className="w-4 h-4 mt-1 accent-primary"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-ink block">
                  Pseudonymous Student Codes Only (Show Names: OFF)
                </span>
                <span className="text-ink-muted">
                  No student email/phone collected on quick-join devices; teacher-held roster mapping is school-managed personal data.
                </span>
              </div>
            </label>

            <label className="p-4 rounded-xl bg-base border border-border flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(school.settings.allowStudentAccounts)}
                onChange={(e) =>
                  drillService.updateSchoolSettings(school.id, {
                    allowStudentAccounts: e.target.checked
                  })
                }
                className="w-4 h-4 mt-1 accent-primary"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-ink block">
                  Allow Teacher-Invited Student Accounts (Default: OFF)
                </span>
                <span className="text-ink-muted">
                  Quick Class Code Join is always the default. When enabled, teachers can issue student invites (no parent email field).
                </span>
              </div>
            </label>

            <label className="p-4 rounded-xl bg-base border border-border flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={school.settings.targets.instructorConfirmed}
                onChange={(e) =>
                  drillService.updateSchoolSettings(school.id, {
                    targets: {
                      ...school.settings.targets,
                      instructorConfirmed: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 mt-1 accent-primary"
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-ink block">
                  Certified First-Aid Instructor Confirmed Targets
                </span>
                <span className="text-ink-muted">
                  Simulated 112 ≤{school.settings.targets.call112FullSec}s • 1st Compression ≤{school.settings.targets.firstCompressionFullSec}s • CPR {school.settings.targets.cprMinBpm}–{school.settings.targets.cprMaxBpm} BPM.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <span>
                Raw drill event retention (DPDP default <strong>90 days</strong>):
              </span>
              <select
                aria-label="Raw Drill Event Retention Days"
                value={school.settings.retentionDays}
                onChange={(e) =>
                  drillService.updateSchoolSettings(school.id, {
                    retentionDays: Number(e.target.value)
                  })
                }
                className="px-2.5 py-1 rounded-lg border border-border bg-base text-xs font-bold text-ink"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days (Recommended Default)</option>
                <option value={180}>180 days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {!confirmDeleteSchool ? (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setConfirmDeleteSchool(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete School Data</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="alert"
                    size="sm"
                    onClick={() => {
                      drillService.deleteSchoolCascade(school.id);
                      setConfirmDeleteSchool(false);
                    }}
                  >
                    <span>Confirm Cascade Delete</span>
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setConfirmDeleteSchool(false)}
                  >
                    <span>Cancel</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 3 Headline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono tabular-nums">
        <Card className="p-5 sm:p-6 space-y-2">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted block">
            1. School Readiness (Median of Classes)
          </span>
          {readinessGuard.suppressed ? (
            <span className="text-lg font-sans font-bold text-ink-muted block">
              Not enough data yet (n &lt; 5)
            </span>
          ) : (
            <span className="text-4xl font-extrabold text-primary block">
              {readinessGuard.displayLabel}
            </span>
          )}
          <p className="text-xs font-sans text-ink-muted">
            Median across {stats?.classesActive ?? 0} active classes (n={nTrained} students trained)
          </p>
        </Card>

        <Card className="p-5 sm:p-6 space-y-2">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted block">
            2. Participation This Term
          </span>
          <span className="text-3xl font-extrabold text-ink block">
            {stats?.classesActive ?? 0}/{stats?.classesTotal ?? 0} Classes •{' '}
            {stats?.drillsThisTerm ?? 0} Drills
          </span>
          <p className="text-xs font-sans text-ink-muted">
            <strong>
              {stats?.studentsTrainedThisTerm ?? 0}/{stats?.studentsTotal ?? 0}
            </strong>{' '}
            students participated in at least one timed practice drill
          </p>
        </Card>

        <Card className="p-5 sm:p-6 space-y-2">
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-ink-muted block">
            3. Baseline → Latest Improvement
          </span>
          <span className="text-3xl font-extrabold text-primary block">
            {stats?.baselineSummary.medianScore ?? '—'} →{' '}
            {stats?.latestSummary.medianScore ?? '—'} pts
          </span>
          <p className="text-xs font-sans text-ink-muted">
            1st Compression:{' '}
            <strong className="font-mono">
              {stats?.baselineSummary.tFirstCompression ?? '—'}s →{' '}
              {stats?.latestSummary.tFirstCompression ?? '—'}s
            </strong>{' '}
            (n={stats?.latestSummary.nDrills ?? 0} classes)
          </p>
        </Card>
      </div>

      {/* Readiness by Grade + Class × Month Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Readiness by Grade
            </h2>
            <p className="text-xs text-ink-muted">
              Horizontal bar comparison of median Readiness Score by grade level.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(stats?.byGrade ?? {}).map(([grade, gStat]) => {
              const gGuard = guardSmallSample(
                gStat.readiness,
                `${gStat.readiness ?? 0}/100`,
                gStat.studentsCount,
                5
              );
              const pct = gGuard.suppressed
                ? 0
                : Math.min(100, Math.max(0, gStat.readiness ?? 0));
              return (
                <div key={grade} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-ink">
                      Grade {grade} ({gStat.drills} drills • n={gStat.studentsCount} students)
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {gGuard.displayLabel}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-base border border-border overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Class × Practice Cadence Matrix
            </h2>
            <p className="text-xs text-ink-muted">
              Baseline vs latest score and monthly drill completion across classes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="py-2 pr-3 font-bold">Class</th>
                  <th className="py-2 px-2 font-bold text-right">Drills</th>
                  <th className="py-2 px-2 font-bold text-right">Baseline</th>
                  <th className="py-2 px-2 font-bold text-right">Latest</th>
                  <th className="py-2 pl-2 font-bold text-right">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-mono tabular-nums">
                {schoolClasses.map((c) => {
                  const cs = store.classStats[c.id];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onNavigate(`/teach/classes/${c.id}`)}
                      className="hover:bg-base cursor-pointer"
                    >
                      <td className="py-2.5 pr-3 font-sans font-bold text-ink">
                        Class {c.name} (Grade {c.grade})
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {cs?.drillsCompleted ?? 0}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {cs?.baselineScore ?? '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {cs?.latestScore ?? '—'}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-bold text-primary">
                        {cs?.readinessScore ?? '—'}/100
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Honest Evidence Summary Card + Frozen Term Reports List */}
      <Card className="p-5 sm:p-6 space-y-4 bg-primary-soft/35 border-primary/25">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              School Evidence Summary (Baseline vs Latest)
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">
              Measured Campus Drill Progression (n={stats?.latestSummary.nStudents ?? 0} students)
            </h2>
          </div>

          {reports.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate(`/school/reports/${reports[0].id}`)}
            >
              <Printer className="w-4 h-4" />
              <span>View Frozen Term Report ({reports[0].id})</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-surface border border-border">
            <span className="font-sans font-bold text-ink-muted block">
              Simulated 112 Call Median
            </span>
            <span className="text-xl font-extrabold text-ink">
              {stats?.baselineSummary.tCall112 ?? '—'}s →{' '}
              {stats?.latestSummary.tCall112 ?? '—'}s
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface border border-border">
            <span className="font-sans font-bold text-ink-muted block">
              Time to First Compression Median
            </span>
            <span className="text-xl font-extrabold text-ink">
              {stats?.baselineSummary.tFirstCompression ?? '—'}s →{' '}
              {stats?.latestSummary.tFirstCompression ?? '—'}s
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface border border-border">
            <span className="font-sans font-bold text-ink-muted block">
              CPR Rate in 100–120 BPM Median
            </span>
            <span className="text-xl font-extrabold text-primary">
              {stats?.baselineSummary.cprInRangePct ?? '—'}% →{' '}
              {stats?.latestSummary.cprInRangePct ?? '—'}%
            </span>
          </div>
        </div>

        <p className="text-xs text-ink-muted font-medium">
          <strong>Mandatory Caveat:</strong> {PILOT_EVIDENCE_CAVEAT}
        </p>
      </Card>
    </div>
  );
};

/* ============================================================================
 * 2. MEMBER & INVITE MANAGEMENT (/school/members)
 * Admin-only screen:
 * - List members, change role, assign classes, remove with reassignment
 * - Generate single-use hashed invite code (shown ONCE in plaintext)
 * - Last-admin guardrail (cannot remove or demote the last admin)
 * ============================================================================ */
export interface SchoolMembersScreenProps {
  onNavigate: (path: string) => void;
}

export const SchoolMembersScreen: React.FC<SchoolMembersScreenProps> = ({
  onNavigate
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const store = drillService.getStore();
  const school = drillService.getActiveSchool();
  const schoolId = school?.id || '';
  const members = store.members[schoolId] ?? [];
  const invites = store.invites[schoolId] ?? [];
  const joinRequests = store.joinRequests?.[schoolId] ?? [];
  const classes = Object.values(store.classes).filter(
    (c) => c.schoolId === schoolId && !c.archived
  );

  // Invite creation state
  const [inviteRole, setInviteRole] = useState<SchoolRole>('teacher');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    classes[0] ? [classes[0].id] : []
  );
  const [generatedPlaintextCode, setGeneratedPlaintextCode] = useState<
    string | null
  >(null);

  // Invite redemption state
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemNameInput, setRedeemNameInput] = useState('');
  const [redeemEmailInput, setRedeemEmailInput] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  // Remove member modal state
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [reassignUid, setReassignUid] = useState<string>('');

  const handleGenerateInvite = async () => {
    const { plaintextCode } = await drillService.createSingleUseInvite({
      schoolId,
      role: inviteRole,
      classIds: selectedClassIds,
      expiresInDays: 7
    });
    setGeneratedPlaintextCode(plaintextCode);
    setRedeemCodeInput(plaintextCode);
    setFeedbackBanner({
      type: 'ok',
      text: '10-character single-use invite generated (XXXX-XXXX-XX). Copy the plaintext code now — only its HMAC-SHA256 digest is stored.'
    });
  };

  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await drillService.redeemInviteCode({
      schoolId,
      plaintextCode: redeemCodeInput,
      uid: `teacher-${Date.now().toString(36)}`,
      displayName: redeemNameInput,
      email: redeemEmailInput
    });
    if (res.ok) {
      setFeedbackBanner({
        type: 'ok',
        text: `Invite redeemed! Added ${res.member?.displayName} (${res.member?.role}) to ${school?.name}.`
      });
      setGeneratedPlaintextCode(null);
    } else {
      setFeedbackBanner({
        type: 'error',
        text: res.error || 'Could not redeem invite.'
      });
    }
  };

  const handleRoleToggle = (uid: string, currentRole: SchoolRole) => {
    const nextRole: SchoolRole = currentRole === 'admin' ? 'teacher' : 'admin';
    const res = drillService.updateMemberRoleOrClasses({
      schoolId,
      uid,
      newRole: nextRole
    });
    if (!res.ok) {
      setFeedbackBanner({
        type: 'error',
        text: res.error || 'Role update blocked.'
      });
    } else {
      setFeedbackBanner({
        type: 'ok',
        text: `Updated member role to ${nextRole}.`
      });
    }
  };

  const handleConfirmRemove = (uid: string) => {
    const res = drillService.removeSchoolMember({
      schoolId,
      uid,
      reassignToTeacherUid: reassignUid || undefined,
      archiveClasses: !reassignUid
    });
    setRemovingUid(null);
    if (!res.ok) {
      setFeedbackBanner({
        type: 'error',
        text: res.error || 'Cannot remove member.'
      });
    } else {
      setFeedbackBanner({
        type: 'ok',
        text: 'Member removed and class assignments updated.'
      });
    }
  };

  const adminReviewerUid =
    members.find((m) => m.role === 'admin')?.uid || 'admin-meera';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('/school')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to School Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">
            School Members, Join Requests &amp; 10-Char HMAC Invites
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Server-granted membership control for {school?.name}. Enforces the last-admin guardrail, HMAC-SHA256 single-use invite codes, and admin-only teacher approvals.
          </p>
        </div>
        <Badge variant="soft">Server-Granted Roles Only</Badge>
      </div>

      {feedbackBanner && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'error'
              ? 'bg-alert/10 border-alert/30 text-alert'
              : 'bg-primary-soft border-primary/30 text-ink'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Directory Join Requests Queue (schools/{schoolId}/joinRequests/{uid}) */}
      <Card className="p-5 sm:p-6 space-y-4 border-2 border-primary/35">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Directory Join Requests (`schools/{schoolId}/joinRequests/{'{uid}'}`)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-ink">
              Pending Approval Queue ({joinRequests.filter((r) => r.status === 'pending').length})
            </h2>
            <p className="text-xs text-ink-muted">
              <strong>Scoped Approval Guardrail:</strong> Teacher join requests can be approved <strong>only by a School Admin (Principal)</strong>. Student join requests can be approved by a Teacher into their own classes or by an Admin.
            </p>
          </div>
        </div>

        {joinRequests.length === 0 ? (
          <p className="text-xs text-ink-muted py-3">
            No join requests submitted for this school yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="py-2 pr-3 font-bold">Applicant</th>
                  <th className="py-2 px-3 font-bold">Requested Role</th>
                  <th className="py-2 px-3 font-bold">Target Class</th>
                  <th className="py-2 px-3 font-bold">Status</th>
                  <th className="py-2 pl-3 font-bold text-right">Admin / Scoped Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {joinRequests.map((jr) => {
                  const targetCls = jr.targetClassId
                    ? store.classes[jr.targetClassId]
                    : classes[0];
                  return (
                    <tr key={jr.uid}>
                      <td className="py-2.5 pr-3">
                        <span className="font-bold text-ink block">{jr.displayName}</span>
                        <span className="font-mono text-xs text-ink-muted">{jr.email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-base border border-border font-mono text-xs uppercase font-bold">
                          {jr.requestedRole}
                        </span>
                        {jr.requestedRole === 'teacher' && (
                          <span className="block text-[11px] text-primary font-semibold mt-0.5">
                            Principal/Admin Approval Only
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs">
                        {targetCls ? `Class ${targetCls.name}` : 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            jr.status === 'approved'
                              ? 'bg-primary-soft text-primary'
                              : jr.status === 'rejected'
                              ? 'bg-alert/10 text-alert'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {jr.status}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        {jr.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                const res = drillService.reviewSchoolJoinRequest({
                                  schoolId,
                                  targetUid: jr.uid,
                                  reviewerUid: adminReviewerUid,
                                  reviewerRole: 'admin',
                                  decision: 'approved',
                                  assignClassIds: targetCls ? [targetCls.id] : []
                                });
                                if (!res.ok) {
                                  setFeedbackBanner({
                                    type: 'error',
                                    text: res.error || 'Approval failed.'
                                  });
                                } else {
                                  setFeedbackBanner({
                                    type: 'ok',
                                    text: `Approved ${jr.displayName} as ${jr.requestedRole}.`
                                  });
                                }
                              }}
                            >
                              <span>Approve ({jr.requestedRole})</span>
                            </Button>
                            <Button
                              variant="neutral"
                              size="sm"
                              onClick={() => {
                                drillService.reviewSchoolJoinRequest({
                                  schoolId,
                                  targetUid: jr.uid,
                                  reviewerUid: adminReviewerUid,
                                  reviewerRole: 'admin',
                                  decision: 'rejected'
                                });
                              }}
                            >
                              <span>Reject</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-muted font-mono">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Generator + Invite Redemption Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <KeyRound className="w-4 h-4" />
            <span>1. Generate 10-Char HMAC Single-Use Invite</span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Generates a 7-day 10-character unambiguous code (<code className="font-mono">XXXX-XXXX-XX</code>, ~50 bits entropy). Only <code className="font-mono">HMAC-SHA256(code, SERVER_INVITE_SECRET)</code> is stored; the plaintext code is shown once below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Role Scope to Grant
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as SchoolRole)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
              >
                <option value="teacher">Teacher (Class &amp; Practice Drill Lead)</option>
                <option value="admin">School Admin (Principal / Governance)</option>
                {school?.settings.allowStudentAccounts && (
                  <option value="student">Student (Optional Verified Account)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Pre-Assign Class
              </label>
              <select
                value={selectedClassIds[0] || ''}
                onChange={(e) =>
                  setSelectedClassIds(e.target.value ? [e.target.value] : [])
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name} (Grade {c.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="primary" size="sm" onClick={handleGenerateInvite}>
            <UserPlus className="w-4 h-4" />
            <span>Generate 10-Char Invite Code</span>
          </Button>

          {generatedPlaintextCode && (
            <div className="p-4 rounded-xl bg-primary-soft border-2 border-primary/40 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Shown Once — Copy Plaintext 10-Char Invite Code Now:
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-base font-extrabold text-ink">
                <span>{generatedPlaintextCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedPlaintextCode);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-sans font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <UserCheck className="w-4 h-4" />
            <span>2. Redeem Invite Code (`/api/drill-auth/redeem-invite`)</span>
          </div>
          <form onSubmit={handleRedeemInvite} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                10-Character Single-Use Invite Code
              </label>
              <input
                type="text"
                value={redeemCodeInput}
                onChange={(e) => setRedeemCodeInput(e.target.value)}
                placeholder="Enter 10-char invite code (XXXX-XXXX-XX)"
                required
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base font-mono text-sm text-ink uppercase"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                  Educator / Applicant Name
                </label>
                <input
                  type="text"
                  value={redeemNameInput}
                  onChange={(e) => setRedeemNameInput(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                  Verified Email
                </label>
                <input
                  type="email"
                  value={redeemEmailInput}
                  onChange={(e) => setRedeemEmailInput(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm text-ink"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              <span>Verify HMAC-SHA256 &amp; Redeem Invite</span>
            </Button>
          </form>
        </Card>
      </div>

      {/* Active School Members Table */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-ink">
          Active School Members (`schools/{schoolId}/members/{'{uid}'}`) ({members.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2.5 pr-3 font-bold">Name &amp; Email</th>
                <th className="py-2.5 px-3 font-bold">Server-Granted Role</th>
                <th className="py-2.5 px-3 font-bold">Assigned Classes</th>
                <th className="py-2.5 pl-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {members.map((m) => (
                <tr key={m.uid}>
                  <td className="py-3 pr-3">
                    <span className="font-bold text-ink block">
                      {m.displayName}
                    </span>
                    <span className="text-xs text-ink-muted font-mono">
                      {m.email}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                        m.role === 'admin'
                          ? 'bg-primary text-white'
                          : 'bg-base border border-border text-ink'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {m.classIds.map((cid) => {
                        const cls = store.classes[cid];
                        return (
                          <span
                            key={cid}
                            className="px-2 py-0.5 rounded bg-base border border-border text-xs font-mono"
                          >
                            {cls ? `Class ${cls.name}` : cid}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleToggle(m.uid, m.role)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-base hover:bg-primary-soft text-xs font-bold text-ink cursor-pointer"
                      >
                        {m.role === 'admin' ? 'Demote to Teacher' : 'Promote to Admin'}
                      </button>

                      {removingUid === m.uid ? (
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={reassignUid}
                            onChange={(e) => setReassignUid(e.target.value)}
                            className="px-2 py-1 rounded border border-border bg-base text-xs"
                          >
                            <option value="">Archive their classes</option>
                            {members
                              .filter((other) => other.uid !== m.uid)
                              .map((other) => (
                                <option key={other.uid} value={other.uid}>
                                  Reassign to {other.displayName}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleConfirmRemove(m.uid)}
                            className="px-2.5 py-1 rounded bg-alert text-white text-xs font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemovingUid(null)}
                            className="px-2 py-1 rounded border border-border text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRemovingUid(m.uid)}
                          className="px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-alert text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hashed Invites Log */}
      <Card className="p-5 sm:p-6 space-y-3">
        <h3 className="text-base font-bold text-ink">
          Single-Use Invite Audit Log (HMAC-SHA256 `codeHmac` Only)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2 pr-3 font-bold">Invite ID</th>
                <th className="py-2 px-3 font-bold">Role Scope</th>
                <th className="py-2 px-3 font-bold">HMAC-SHA256 Digest</th>
                <th className="py-2 px-3 font-bold">Expires</th>
                <th className="py-2 pl-3 font-bold text-right">Status / Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 pr-3 font-bold text-ink">{inv.id}</td>
                  <td className="py-2 px-3 uppercase">{inv.role}</td>
                  <td className="py-2 px-3 text-ink-muted">
                    {(inv.codeHmac || inv.codeHash).slice(0, 20)}…
                  </td>
                  <td className="py-2 px-3">
                    {new Date(inv.expiresAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-2 pl-3 text-right font-sans font-bold">
                    {inv.usedBy ? (
                      <span className="text-ink-muted">
                        Redeemed by {inv.usedBy}
                      </span>
                    ) : inv.revoked ? (
                      <span className="text-alert">Revoked</span>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-primary">Unused</span>
                        <button
                          type="button"
                          onClick={() =>
                            drillService.revokeInvite(schoolId, inv.id)
                          }
                          className="px-2 py-0.5 rounded border border-border bg-base hover:bg-alert/10 hover:text-alert text-[11px] font-bold cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ============================================================================
 * 3. PLATFORM PILOT DASHBOARD (/platform)
 * Sanjeevani team only (`platform: true` role claim):
 * - Reads `platformStats/current` only (only schools with shareAnonymisedStats === true)
 * - Excludes `isDemo: true` by default with an explicit toggle + prominent banner
 * - Suppresses any metric where n < 5
 * - Exports Pilot Evidence CSV + printable 1-page summary carrying the exact caveat:
 *   "Results come from practice drills in school conditions with a small sample;
 *    they are not clinical outcomes."
 * ============================================================================ */
export const PlatformPilotDashboardScreen: React.FC = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const pStats = drillService.computePlatformStats(false);
  const nStudents = pStats.studentsTrainedCount;
  const suppressed = nStudents < 5;

  const flaggedPct =
    pStats.totalRunsCount > 0
      ? Math.round((pStats.runsFlaggedCount / pStats.totalRunsCount) * 100)
      : 0;
  const accelPct =
    pStats.totalRunsCount > 0
      ? Math.round(
          (pStats.accelerometerRunsCount / pStats.totalRunsCount) * 100
        )
      : 0;
  const tapPct =
    pStats.totalRunsCount > 0 ? 100 - accelPct : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block">
            Sanjeevani Pilot Evaluation • Aggregated `platformStats/current` Only
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Platform Pilot Evidence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Includes only registered schools with `settings.shareAnonymisedStats === true`. Never accesses raw school, class, or student documents.
          </p>
        </div>

        <div className="print:hidden flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCsvString(
                drillService.exportPilotEvidenceCsv(false),
                'sanjeevani-pilot-evidence.csv'
              )
            }
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Pilot Evidence (CSV)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            <span>Print 1-Page Evidence Summary</span>
          </Button>
        </div>
      </div>

      {/* Mandatory Pilot Evidence Caveat Banner */}
      <Card className="p-4 sm:p-5 bg-primary-soft/50 border-primary/35">
        <p className="text-sm font-bold text-ink">{PILOT_EVIDENCE_CAVEAT}</p>
      </Card>

      {/* Top Sample Size Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Opted-In Schools (n)
          </span>
          <span className="text-3xl font-extrabold text-ink">
            {pStats.schoolsCount}
          </span>
        </Card>
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Participating Classes (n)
          </span>
          <span className="text-3xl font-extrabold text-ink">
            {pStats.classesCount}
          </span>
        </Card>
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Completed Drills (n)
          </span>
          <span className="text-3xl font-extrabold text-ink">
            {pStats.drillsCount}
          </span>
        </Card>
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Students Trained (n)
          </span>
          <span className="text-3xl font-extrabold text-primary">
            {pStats.studentsTrainedCount}
          </span>
        </Card>
      </div>

      {/* Baseline vs Latest Medians Table */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Baseline vs Latest Follow-Up Medians Across Opted-In Schools
            </h2>
            <p className="text-xs text-ink-muted">
              Baseline sample: n={pStats.baselineMedians.nDrills} drills (n={pStats.baselineMedians.nStudents} students) • Latest sample: n={pStats.latestMedians.nDrills} drills (n={pStats.latestMedians.nStudents} students)
            </p>
          </div>
        </div>

        {suppressed ? (
          <div className="p-6 rounded-xl bg-base border border-border text-center space-y-1">
            <p className="text-base font-bold text-ink">
              Not enough data yet (n={nStudents} &lt; 5 students minimum)
            </p>
            <p className="text-xs text-ink-muted">
              Group statistics are automatically suppressed whenever fewer than 5 students have completed drills in opted-in registered schools.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="py-2.5 pr-3 font-bold">Metric</th>
                  <th className="py-2.5 px-3 font-bold text-right">
                    Baseline Median (n={pStats.baselineMedians.nStudents})
                  </th>
                  <th className="py-2.5 px-3 font-bold text-right">
                    Latest Median (n={pStats.latestMedians.nStudents})
                  </th>
                  <th className="py-2.5 pl-3 font-bold text-right">
                    Observed Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-mono tabular-nums">
                <tr>
                  <td className="py-3 pr-3 font-sans font-bold text-ink">
                    Overall Readiness Score (0–100, v1)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {pStats.baselineMedians.score ?? '—'}/100
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-primary">
                    {pStats.latestMedians.score ?? '—'}/100
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-primary">
                    {pStats.baselineMedians.score !== null &&
                    pStats.latestMedians.score !== null
                      ? `+${
                          pStats.latestMedians.score -
                          pStats.baselineMedians.score
                        } pts`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-sans font-bold text-ink">
                    Time to Simulated 112 Call (sec)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {pStats.baselineMedians.tCall112 ?? '—'}s
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-primary">
                    {pStats.latestMedians.tCall112 ?? '—'}s
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-primary">
                    {pStats.baselineMedians.tCall112 !== null &&
                    pStats.latestMedians.tCall112 !== null
                      ? `${(
                          pStats.latestMedians.tCall112 -
                          pStats.baselineMedians.tCall112
                        ).toFixed(1)}s`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-sans font-bold text-ink">
                    Time to First Chest Compression (sec)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {pStats.baselineMedians.tFirstCompression ?? '—'}s
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-primary">
                    {pStats.latestMedians.tFirstCompression ?? '—'}s
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-primary">
                    {pStats.baselineMedians.tFirstCompression !== null &&
                    pStats.latestMedians.tFirstCompression !== null
                      ? `${(
                          pStats.latestMedians.tFirstCompression -
                          pStats.baselineMedians.tFirstCompression
                        ).toFixed(1)}s`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-sans font-bold text-ink">
                    CPR Compressions in 100–120 BPM (%)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {pStats.baselineMedians.cprInRangePct ?? '—'}%
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-primary">
                    {pStats.latestMedians.cprInRangePct ?? '—'}%
                  </td>
                  <td className="py-3 pl-3 text-right font-bold text-primary">
                    {pStats.baselineMedians.cprInRangePct !== null &&
                    pStats.latestMedians.cprInRangePct !== null
                      ? `+${
                          pStats.latestMedians.cprInRangePct -
                          pStats.baselineMedians.cprInRangePct
                        }%`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Score Distribution by Drill Number + Data Quality Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Score Distribution Across Drill #1, Drill #2, Drill #3+
            </h2>
            <p className="text-xs text-ink-muted">
              Median and interquartile range (p25–p75) by practice iteration.
            </p>
          </div>

          <div className="space-y-3 font-mono tabular-nums text-xs sm:text-sm">
            {pStats.scoreDistributionByDrillOrder.map((bucket) => (
              <div
                key={bucket.drillNumberLabel}
                className="p-3.5 rounded-xl bg-base border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-ink">
                    {bucket.drillNumberLabel} (n={bucket.nDrills} drills, {bucket.nStudents} students)
                  </span>
                  <span className="font-extrabold text-primary">
                    Median: {bucket.nStudents >= 5 ? `${bucket.median}/100` : 'n<5'}
                  </span>
                </div>
                {bucket.nStudents >= 5 && (
                  <div className="text-xs text-ink-muted">
                    Interquartile Range (p25–p75): <strong>{bucket.p25}</strong> –{' '}
                    <strong>{bucket.p75}</strong> pts
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Telemetry &amp; Sensor Data Quality Panel
            </h2>
            <p className="text-xs text-ink-muted">
              Audits timestamp sanity checks (`needsReview`) and CPR rhythm input source across {pStats.totalRunsCount} team runs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono tabular-nums">
            <div className="p-3.5 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                Flagged needsReview
              </span>
              <span className="text-2xl font-extrabold text-ink">
                {flaggedPct}%
              </span>
              <span className="text-xs text-ink-muted block">
                ({pStats.runsFlaggedCount}/{pStats.totalRunsCount} runs)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                Accelerometer Sensor
              </span>
              <span className="text-2xl font-extrabold text-primary">
                {accelPct}%
              </span>
              <span className="text-xs text-ink-muted block">
                ({pStats.accelerometerRunsCount} runs)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-base border border-border">
              <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
                Tap-Along Fallback
              </span>
              <span className="text-2xl font-extrabold text-ink">
                {tapPct}%
              </span>
              <span className="text-xs text-ink-muted block">
                ({pStats.tapFallbackRunsCount} runs)
              </span>
            </div>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Runs are flagged <code className="font-mono">needsReview: true</code> whenever an event timestamp precedes drill start (<code className="font-mono">t0</code>), occurs &gt;5s after drill end, or syncs &gt;10 minutes after client timestamp.
          </p>
        </Card>
      </div>
    </div>
  );
};
