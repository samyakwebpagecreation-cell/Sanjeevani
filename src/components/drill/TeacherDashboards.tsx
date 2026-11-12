import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Play,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Square,
  Trash2,
  Users,
  Zap
} from 'lucide-react';
import { Badge, Button, Card } from '../common/DesignSystem';
import {
  ClassCard,
  ScoreTile,
  TimelineChart,
  TrendChart
} from './SharedDrillComponents';
import {
  ClassRecord,
  DrillRecord,
  drillService
} from '../../services/drillService';
import {
  DEFAULT_PROGRAM_TARGETS,
  DRILL_SCENARIOS,
  getNextPracticeRecommendation,
  guardSmallSample
} from '../../services/drillEngine';
import {
  REQUIRED_CERTIFICATE_CAVEAT,
  downloadCertificatesPdf
} from '../../utils/certificatePdf';
import { generateQRCodeSVG } from '../../utils/qr';

function triggerCsvDownload(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ============================================================================
 * 1. TEACHER HOME (/teach)
 * ============================================================================ */
export interface TeacherHomeScreenProps {
  onNavigate: (path: string) => void;
  onOpenSelfPractice?: () => void;
}

export const TeacherHomeScreen: React.FC<TeacherHomeScreenProps> = ({
  onNavigate,
  onOpenSelfPractice
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const store = drillService.getStore();
  const school = drillService.getActiveSchool();
  const classes = Object.values(store.classes).filter(
    (c) => (!school || c.schoolId === school.id) && !c.archived
  );

  // Create Class form state
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('8-C');
  const [newGrade, setNewGrade] = useState('8');
  const [newSection, setNewSection] = useState('C');
  const [newStudentCount, setNewStudentCount] = useState(16);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const created = drillService.createClass({
      name: newClassName || `${newGrade}-${newSection}`,
      grade: newGrade,
      section: newSection,
      studentCount: newStudentCount
    });
    setShowCreateClass(false);
    onNavigate(`/teach/classes/${created.id}`);
  };

  const handleStartNewDrillForClass = (classId: string) => {
    const drill = drillService.createDrill({ classId, teamCount: 4 });
    drillService.startLiveDrill(drill.id);
    onNavigate(`/teach/drills/${drill.id}/live`);
  };

  // Needs attention: classes with no drill in 14+ days or readiness < 65
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const needsAttentionClasses = classes.filter((c) => {
    const st = store.classStats[c.id];
    if (!st || !st.latestAt) return true;
    if (now - st.latestAt > fourteenDaysMs) return true;
    if (st.readinessScore !== null && st.readinessScore < 65) return true;
    return false;
  });

  // Pending student join requests for this teacher's own classes
  const currentTeacherUid = classes[0]?.teacherUid || '';
  const pendingStudentRequests = school
    ? (store.joinRequests?.[school.id] ?? []).filter(
        (jr) => jr.status === 'pending' && jr.requestedRole === 'student'
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block">
            {school?.name || 'School First-Aid Drill Platform'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Teacher Practice Drill Command &amp; My Classes
          </h1>
          <p className="text-sm text-ink-muted max-w-2xl">
            Run timed multi-role practice emergencies with your classes, track baseline vs follow-up readiness medians, and issue verifiable participation records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenSelfPractice && (
            <Button variant="neutral" size="sm" onClick={onOpenSelfPractice}>
              <span>Individual Practice Arena</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateClass((prev) => !prev)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Class</span>
          </Button>
        </div>
      </div>

      {/* Pending Student Join Requests (Scoped to Teacher's Own Classes) */}
      {school && pendingStudentRequests.length > 0 && (
        <Card className="p-4 sm:p-5 border-2 border-primary/35 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Student Class Join Requests ({pendingStudentRequests.length})
              </span>
              <p className="text-xs text-ink-muted">
                Teachers can approve students into their own assigned classes only. Teacher join requests are restricted to the School Principal (/school/members).
              </p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pendingStudentRequests.map((req) => {
              const targetCls = req.targetClassId ? store.classes[req.targetClassId] : classes[0];
              return (
                <div
                  key={req.uid}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-bold text-ink">{req.displayName}</span>{' '}
                    <span className="font-mono text-xs text-ink-muted">({req.email})</span>
                    <span className="block text-xs text-ink-muted">
                      Requested Class: <strong>Class {targetCls?.name || '8-B'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        drillService.reviewSchoolJoinRequest({
                          schoolId: school.id,
                          targetUid: req.uid,
                          reviewerUid: currentTeacherUid,
                          reviewerRole: 'teacher',
                          decision: 'approved',
                          assignClassIds: targetCls ? [targetCls.id] : []
                        })
                      }
                    >
                      <span>Approve into Class {targetCls?.name || '8-B'}</span>
                    </Button>
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() =>
                        drillService.reviewSchoolJoinRequest({
                          schoolId: school.id,
                          targetUid: req.uid,
                          reviewerUid: currentTeacherUid,
                          reviewerRole: 'teacher',
                          decision: 'rejected'
                        })
                      }
                    >
                      <span>Decline</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Inline Create Class Form */}
      {showCreateClass && (
        <Card className="p-5 sm:p-6 border-2 border-primary/40 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-ink">
              Create New Class Roster (Pseudonymous Student Codes S-01..S-N)
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              No student email or phone is collected on quick-join devices; the teacher-held roster mapping is school-managed personal data (90-day raw event retention default).
            </p>
          </div>
          <form
            onSubmit={handleCreateClass}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Class Label
              </label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Grade
              </label>
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Section
              </label>
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-bold text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-ink-muted mb-1">
                Student Count
              </label>
              <input
                type="number"
                min={4}
                max={60}
                value={newStudentCount}
                onChange={(e) => setNewStudentCount(Number(e.target.value))}
                required
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-border bg-base text-sm font-mono font-bold text-ink"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" fullWidth>
                <span>Save Class</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Needs Attention Strip */}
      {needsAttentionClasses.length > 0 && (
        <Card className="p-4 sm:p-5 bg-amber-500/10 border-amber-500/35 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Needs Attention — Schedule Follow-Up Practice</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {needsAttentionClasses.map((cls) => {
              const st = store.classStats[cls.id];
              const daysSince = st?.latestAt
                ? Math.floor((now - st.latestAt) / (24 * 60 * 60 * 1000))
                : null;
              return (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-sm font-bold text-ink block">
                      Class {cls.name} (Grade {cls.grade})
                    </span>
                    <span className="text-xs text-ink-muted">
                      {daysSince === null
                        ? 'No baseline drill recorded yet'
                        : `Last drill ${daysSince} days ago • Readiness: ${
                            st?.readinessScore ?? '—'
                          }/100`}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartNewDrillForClass(cls.id)}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Drill</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* My Classes Grid */}
      {classes.length === 0 ? (
        <Card className="p-10 text-center space-y-4">
          <Users className="w-10 h-10 text-primary mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-ink">
              Create your first class
            </h2>
            <p className="text-sm text-ink-muted max-w-md mx-auto">
              Classes generate anonymous student roster codes (S-01..S-40) and a QR join code so students can join drills with zero accounts or personal data.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateClass(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Class</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              stats={store.classStats[cls.id]}
              onOpenClass={() => onNavigate(`/teach/classes/${cls.id}`)}
              onStartDrill={() => handleStartNewDrillForClass(cls.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. CLASS DASHBOARD (/teach/classes/:classId)
 * ============================================================================ */
export interface ClassDashboardScreenProps {
  classId: string;
  onNavigate: (path: string) => void;
  onOpenProtocol: (slug: string) => void;
}

export const ClassDashboardScreen: React.FC<ClassDashboardScreenProps> = ({
  classId,
  onNavigate,
  onOpenProtocol
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const [activeTab, setActiveTab] = useState<'drills' | 'students' | 'settings'>(
    'drills'
  );
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [certBanner, setCertBanner] = useState<string | null>(null);

  const store = drillService.getStore();
  const cls: ClassRecord | undefined = store.classes[classId];

  if (!cls) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">Class not found</h1>
        <Button variant="primary" size="sm" onClick={() => onNavigate('/teach')}>
          Back to Teacher Home
        </Button>
      </div>
    );
  }

  const school = store.schools[cls.schoolId];
  const targets = school?.settings.targets ?? DEFAULT_PROGRAM_TARGETS;
  const stats = store.classStats[cls.id];
  const roster = store.rosters[cls.id] ?? [];
  const drills = Object.values(store.drills)
    .filter((d) => d.classId === cls.id)
    .sort(
      (a, b) =>
        (b.endedAt ?? b.scheduledAt) - (a.endedAt ?? a.scheduledAt)
    );

  const completedDrills = drills.filter(
    (d) => d.status === 'completed' && d.summary
  );
  const latestDrill = completedDrills[0] ?? null;
  const baselineDrill =
    completedDrills[completedDrills.length - 1] ?? null;

  const nStudents = stats?.studentsParticipatedCount ?? 0;
  const readinessGuard = guardSmallSample(
    stats?.readinessScore ?? null,
    stats?.readinessScore !== null && stats?.readinessScore !== undefined
      ? `${stats.readinessScore}`
      : '—',
    nStudents,
    5
  );

  // Rule-based "What to practise next" from latest drill medians
  const recommendation = getNextPracticeRecommendation(
    {
      tCall112: latestDrill?.summary?.medianTimeToCall112 ?? null,
      tFirstCompression:
        latestDrill?.summary?.medianTimeToFirstCompression ?? null,
      cprInRangePct: latestDrill?.summary?.medianCprInRangePct ?? 0,
      longestPauseSec: 4,
      tAedConfirmed: latestDrill?.summary?.medianAedConfirmedSec ?? null,
      tRoleCoverage: 24,
      handoverComplete:
        (latestDrill?.summary?.handoverCompletePct ?? 0) >= 75
    },
    targets
  );

  const handleRunNewDrill = () => {
    const created = drillService.createDrill({
      classId: cls.id,
      teamCount: 4
    });
    drillService.startLiveDrill(created.id);
    onNavigate(`/teach/drills/${created.id}/live`);
  };

  const handleExportCsv = () => {
    const csv = drillService.exportClassDrillsCsv(cls.id);
    triggerCsvDownload(csv, `sanjeevani-class-${cls.name}-drills.csv`);
  };

  const handleIssueClassCertificates = () => {
    const targetDrill = latestDrill ?? drills[0];
    if (!targetDrill) return;
    const issued = drillService.issueCertificatesForDrill(targetDrill.id);
    if (issued.length > 0) {
      downloadCertificatesPdf(
        issued.map((c) => ({
          certId: c.certId,
          schoolName: c.schoolName,
          className: c.className,
          grade: c.grade,
          drillDateIso: c.drillDateIso,
          scenarioTitle: c.scenarioTitle,
          studentIdentifier: c.studentDisplayName || c.studentCode,
          rolePracticed: c.rolePracticed,
          verifyUrl: `${window.location.origin}/verify/${c.certId}`,
          isDemo: c.isDemo
        })),
        `sanjeevani-class-${cls.name}-certificates.pdf`
      );
      setCertBanner(
        `Issued & downloaded ${issued.length} participation certificates (${REQUIRED_CERTIFICATE_CAVEAT})`
      );
    }
  };

  const joinUrl = `${
    typeof window !== 'undefined' ? window.location.origin : ''
  }/join/${cls.joinCode}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb + Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate('/teach')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Teacher Home</span>
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Class {cls.name} • Grade {cls.grade} • {cls.studentCount} students
            </h1>
            <Badge variant="soft">
              Join Code: <span className="font-mono font-bold">{cls.joinCode}</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Teacher: {cls.teacherName} • Academic Year {cls.academicYear} • Program targets marked for instructor confirmation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setShowQrModal((prev) => !prev)}
          >
            <QrCode className="w-4 h-4" />
            <span>Join QR ({cls.joinCode})</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleRunNewDrill}>
            <Play className="w-4 h-4" />
            <span>Run a Drill</span>
          </Button>
        </div>
      </div>

      {/* Optional Join QR Drawer */}
      {showQrModal && (
        <Card className="p-5 sm:p-6 border-2 border-primary/40 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Student Zero-Account Join Beacon
            </span>
            <h2 className="text-xl font-extrabold text-ink">
              Scan or enter code <span className="font-mono">{cls.joinCode}</span>
            </h2>
            <p className="text-sm text-ink-muted max-w-xl">
              Students scan this QR or open <code className="font-mono text-ink">{joinUrl}</code>, select their anonymous code (S-01..S-{String(cls.studentCount).padStart(2, '0')}), and claim a squad role.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate(`/join/${cls.joinCode}`)}
              >
                <span>Open Student Join Screen</span>
              </Button>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => drillService.rotateClassJoinCode(cls.id)}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Rotate 7-Day Code</span>
              </Button>
            </div>
          </div>

          <div
            className="p-3 rounded-2xl bg-white border border-border shrink-0"
            dangerouslySetInnerHTML={{
              __html: generateQRCodeSVG(joinUrl, 148)
            }}
          />
        </Card>
      )}

      {/* Hero Readiness Strip: Now vs Baseline */}
      <Card className="p-5 sm:p-6 bg-primary-soft/40 border-primary/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block">
            Class Readiness Score (Median of Last 3 Completed Drills)
          </span>
          {readinessGuard.suppressed ? (
            <div className="text-xl font-extrabold text-ink-muted">
              Not enough data yet (n={nStudents} &lt; 5 students minimum)
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-3 font-mono tabular-nums">
              <span className="text-3xl sm:text-4xl font-extrabold text-ink">
                {stats?. baselineScore ?? '—'} → {stats?.readinessScore ?? '—'}/100
              </span>
              {typeof stats?.baselineScore === 'number' &&
                typeof stats?.readinessScore === 'number' && (
                  <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-sm font-bold">
                    {stats.readinessScore - stats.baselineScore >= 0 ? '+' : ''}
                    {stats.readinessScore - stats.baselineScore} pts vs baseline
                  </span>
                )}
            </div>
          )}
          <p className="text-xs sm:text-sm text-ink-muted">
            Based on <strong>{stats?.drillsCompleted ?? 0}</strong> completed practice drills across <strong>n={nStudents}</strong> participating students.
          </p>
        </div>

        {latestDrill && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onNavigate(`/teach/classes/${cls.id}/drills/${latestDrill.id}`)
            }
          >
            <span>Open Latest Drill Report</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </Card>

      {/* 4 Core Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreTile
          label="Simulated 112 Call"
          value={latestDrill?.summary?.medianTimeToCall112 ?? null}
          formattedValue={
            latestDrill?.summary?.medianTimeToCall112 !== null &&
            latestDrill?.summary?.medianTimeToCall112 !== undefined
              ? `${latestDrill.summary.medianTimeToCall112}s`
              : '—'
          }
          baselineValue={baselineDrill?.summary?.medianTimeToCall112 ?? null}
          formattedBaseline={
            baselineDrill?.summary?.medianTimeToCall112
              ? `${baselineDrill.summary.medianTimeToCall112}s`
              : undefined
          }
          lowerIsBetter
          unit="s"
          nStudents={nStudents}
          targetCaption={`Program target: ≤${targets.call112FullSec}s (simulated 112)`}
          onClick={
            latestDrill
              ? () =>
                  onNavigate(
                    `/teach/classes/${cls.id}/drills/${latestDrill.id}`
                  )
              : undefined
          }
        />

        <ScoreTile
          label="Time to 1st Compression"
          value={latestDrill?.summary?.medianTimeToFirstCompression ?? null}
          formattedValue={
            latestDrill?.summary?.medianTimeToFirstCompression !== null &&
            latestDrill?.summary?.medianTimeToFirstCompression !== undefined
              ? `${latestDrill.summary.medianTimeToFirstCompression}s`
              : '—'
          }
          baselineValue={
            baselineDrill?.summary?.medianTimeToFirstCompression ?? null
          }
          formattedBaseline={
            baselineDrill?.summary?.medianTimeToFirstCompression
              ? `${baselineDrill.summary.medianTimeToFirstCompression}s`
              : undefined
          }
          lowerIsBetter
          unit="s"
          nStudents={nStudents}
          targetCaption={`Program target: ≤${targets.firstCompressionFullSec}s`}
          onClick={
            latestDrill
              ? () =>
                  onNavigate(
                    `/teach/classes/${cls.id}/drills/${latestDrill.id}`
                  )
              : undefined
          }
        />

        <ScoreTile
          label="CPR Rate in 100–120 BPM"
          value={latestDrill?.summary?.medianCprInRangePct ?? null}
          formattedValue={
            latestDrill?.summary
              ? `${latestDrill.summary.medianCprInRangePct}%`
              : '—'
          }
          baselineValue={baselineDrill?.summary?.medianCprInRangePct ?? null}
          formattedBaseline={
            baselineDrill?.summary
              ? `${baselineDrill.summary.medianCprInRangePct}%`
              : undefined
          }
          unit="%"
          nStudents={nStudents}
          targetCaption={`Program target: ≥${targets.cprInRangeTargetPct}% in range`}
          onClick={
            latestDrill
              ? () =>
                  onNavigate(
                    `/teach/classes/${cls.id}/drills/${latestDrill.id}`
                  )
              : undefined
          }
        />

        <ScoreTile
          label="Squad Role Coverage"
          value={latestDrill?.summary?.roleCoveragePct ?? null}
          formattedValue={
            latestDrill?.summary ? `${latestDrill.summary.roleCoveragePct}%` : '—'
          }
          baselineValue={baselineDrill?.summary?.roleCoveragePct ?? null}
          formattedBaseline={
            baselineDrill?.summary
              ? `${baselineDrill.summary.roleCoveragePct}%`
              : undefined
          }
          unit="%"
          nStudents={nStudents}
          targetCaption={`Program target: 4/4 roles within ≤${targets.roleCoverageFullSec}s`}
          onClick={
            latestDrill
              ? () =>
                  onNavigate(
                    `/teach/classes/${cls.id}/drills/${latestDrill.id}`
                  )
              : undefined
          }
        />
      </div>

      {/* Trend Chart + What to Practise Next */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            points={stats?.trendSeries ?? []}
            targets={targets}
            onSelectDrill={(drillId) =>
              onNavigate(`/teach/classes/${cls.id}/drills/${drillId}`)
            }
          />
        </div>

        <Card className="p-5 sm:p-6 flex flex-col justify-between gap-4 border-2 border-primary/30">
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>What to Practise Next (Rule-Based)</span>
            </span>
            <h3 className="text-lg font-extrabold text-ink">
              {recommendation.headline}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {recommendation.reason}
            </p>
            <p className="text-xs sm:text-sm text-ink font-medium leading-relaxed">
              {recommendation.actionTip}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => onOpenProtocol(recommendation.protocolSlug)}
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Protocol: {recommendation.protocolTitle}</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Sub-Tabs: Drills | Students | Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          {(['drills', 'students', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize cursor-pointer ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-surface text-ink-muted hover:text-ink border border-border'
              }`}
            >
              {tab === 'drills'
                ? `Drills (${drills.length})`
                : tab === 'students'
                ? `Student Roster (${roster.length})`
                : 'Class Settings'}
            </button>
          ))}
        </div>

        {certBanner && (
          <div className="p-4 rounded-xl bg-primary-soft border border-primary/30 text-xs sm:text-sm font-bold text-ink flex items-center justify-between gap-3">
            <span>{certBanner}</span>
            <button
              type="button"
              onClick={() => setCertBanner(null)}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: DRILLS LIST */}
        {activeTab === 'drills' && (
          <Card className="p-5 sm:p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="py-2.5 pr-3 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold">Scenario</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Teams (n)</th>
                  <th className="py-2.5 px-3 font-bold text-right">Median Score</th>
                  <th className="py-2.5 px-3 font-bold text-right">1st Compression</th>
                  <th className="py-2.5 pl-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-mono tabular-nums">
                {drills.map((d) => (
                  <tr key={d.id} className="hover:bg-base/60">
                    <td className="py-3 pr-3 font-sans font-semibold text-ink">
                      {new Date(d.endedAt ?? d.scheduledAt).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }
                      )}
                      {d.isBaseline && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-primary-soft text-primary text-[11px] font-bold">
                          Baseline
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans text-ink">
                      {DRILL_SCENARIOS[d.scenarioId]?.title || d.scenarioId}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2.5 py-1 rounded-lg bg-base border border-border text-xs font-bold uppercase">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.teamCount} teams ({d.summary?.studentsCount ?? 0} students)
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-primary">
                      {d.summary ? `${d.summary.medianScore}/100` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.summary?.medianTimeToFirstCompression !== null &&
                      d.summary?.medianTimeToFirstCompression !== undefined
                        ? `${d.summary.medianTimeToFirstCompression}s`
                        : '—'}
                    </td>
                    <td className="py-3 pl-3 text-right font-sans">
                      {d.status === 'live' || d.status === 'ready' ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(`/teach/drills/${d.id}/live`)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer"
                        >
                          Live Control
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate(`/teach/classes/${cls.id}/drills/${d.id}`)
                          }
                          className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary-soft text-xs font-bold cursor-pointer"
                        >
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* TAB 2: STUDENT ROSTER (Anonymous codes S-01..S-N, NO rankings or individual scores) */}
        {activeTab === 'students' && (
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Anonymous Student Participation Roster
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted">
                  Tracks participation count and squad roles practised by anonymous code. Individual scores and student rankings are never computed.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleIssueClassCertificates}
              >
                <Award className="w-4 h-4" />
                <span>Issue Certificates (Class PDF)</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border text-ink-muted">
                    <th className="py-2.5 pr-3 font-bold">Student Code</th>
                    <th className="py-2.5 px-3 font-bold text-right">Drills Participated</th>
                    <th className="py-2.5 px-3 font-bold">Squad Roles Practised</th>
                    <th className="py-2.5 px-3 font-bold">Last Practice Date</th>
                    <th className="py-2.5 pl-3 font-bold text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {roster.map((st) => (
                    <tr key={st.id}>
                      <td className="py-2.5 pr-3 font-mono font-bold text-ink">
                        {st.code}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {st.drillsParticipated}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {st.rolesPracticed.length > 0 ? (
                            st.rolesPracticed.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded bg-base border border-border text-xs font-mono"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-ink-muted">None yet</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-ink-muted">
                        {st.lastDrillAt
                          ? new Date(st.lastDrillAt).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        {st.lastCertId ? (
                          <button
                            type="button"
                            onClick={() => onNavigate(`/verify/${st.lastCertId}`)}
                            className="text-xs font-mono font-bold text-primary hover:underline cursor-pointer"
                          >
                            {st.lastCertId}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-muted">Not issued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Rotate Class Join Code
                </h3>
                <p className="text-xs text-ink-muted">
                  Current code: <strong className="font-mono">{cls.joinCode}</strong> (expires in 7 days).
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => drillService.rotateClassJoinCode(cls.id)}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Generate New Code</span>
              </Button>
            </div>

            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Delete Class &amp; Raw Drill Logs
                </h3>
                <p className="text-xs text-ink-muted">
                  Permanently removes this class, its student roster codes, and its drill runs.
                </p>
              </div>
              {!confirmDelete ? (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Class</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="alert"
                    size="sm"
                    onClick={() => {
                      drillService.deleteClassCascade(cls.id);
                      onNavigate('/teach');
                    }}
                  >
                    <span>Confirm Permanent Delete</span>
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    <span>Cancel</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. DRILL REPORT (/teach/classes/:classId/drills/:drillId)
 * ============================================================================ */
export interface DrillReportScreenProps {
  classId: string;
  drillId: string;
  onNavigate: (path: string) => void;
}

export const DrillReportScreen: React.FC<DrillReportScreenProps> = ({
  classId,
  drillId,
  onNavigate
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return drillService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const store = drillService.getStore();
  const drill: DrillRecord | undefined = store.drills[drillId];

  const [notesText, setNotesText] = useState<string>(drill?.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);

  if (!drill) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-ink">Drill Report Not Found</h1>
        <Button variant="primary" size="sm" onClick={() => onNavigate('/teach')}>
          Back to Teacher Home
        </Button>
      </div>
    );
  }

  const scenario =
    DRILL_SCENARIOS[drill.scenarioId] ??
    DRILL_SCENARIOS['cardiac-arrest-unresponsive'];
  const summary = drill.summary;
  const sampleRunBreakdown = drill.runs[0]?.scoreBreakdown ?? null;

  const handleIssueCertificates = () => {
    const issued = drillService.issueCertificatesForDrill(drill.id);
    if (issued.length > 0) {
      downloadCertificatesPdf(
        issued.map((c) => ({
          certId: c.certId,
          schoolName: c.schoolName,
          className: c.className,
          grade: c.grade,
          drillDateIso: c.drillDateIso,
          scenarioTitle: c.scenarioTitle,
          studentIdentifier: c.studentDisplayName || c.studentCode,
          rolePracticed: c.rolePracticed,
          verifyUrl: `${window.location.origin}/verify/${c.certId}`,
          isDemo: c.isDemo
        })),
        `sanjeevani-drill-${drill.id}-certificates.pdf`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:border-b print:pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate(`/teach/classes/${drill.classId}`)}
            className="print:hidden inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Class {drill.className}</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
              Drill Report: Class {drill.className}
            </h1>
            {drill.isBaseline && <Badge variant="soft">Baseline Drill</Badge>}
            {drill.isDemo && <Badge variant="neutral">DEMO DATA</Badge>}
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Scenario: <strong>{scenario.title}</strong> • Date:{' '}
            {new Date(drill.endedAt ?? drill.scheduledAt).toLocaleDateString(
              'en-IN',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }
            )}{' '}
            • {drill.teamCount} teams ({summary?.studentsCount ?? 0} students)
          </p>
        </div>

        <div className="print:hidden flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleIssueCertificates}>
            <Award className="w-4 h-4" />
            <span>Issue Certificates (PDF)</span>
          </Button>
          <Button
            variant="neutral"
            size="sm"
            onClick={() =>
              triggerCsvDownload(
                drillService.exportClassDrillsCsv(drill.classId),
                `drill-${drill.id}.csv`
              )
            }
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums">
        <Card className="p-4">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Median Score (IQR)
          </span>
          <span className="text-2xl font-extrabold text-primary">
            {summary ? `${summary.medianScore}/100` : '—'}
          </span>
          <span className="text-xs text-ink-muted block">
            IQR: {summary?.p25Score ?? '—'}–{summary?.p75Score ?? '—'}
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Simulated 112
          </span>
          <span className="text-2xl font-extrabold text-ink">
            {summary?.medianTimeToCall112 !== null &&
            summary?.medianTimeToCall112 !== undefined
              ? `${summary.medianTimeToCall112}s`
              : '—'}
          </span>
          <span className="text-xs font-sans text-ink-muted block">
            Target ≤30s
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            1st Compression
          </span>
          <span className="text-2xl font-extrabold text-ink">
            {summary?.medianTimeToFirstCompression !== null &&
            summary?.medianTimeToFirstCompression !== undefined
              ? `${summary.medianTimeToFirstCompression}s`
              : '—'}
          </span>
          <span className="text-xs font-sans text-ink-muted block">
            Target ≤30s
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            CPR in 100–120 BPM
          </span>
          <span className="text-2xl font-extrabold text-ink">
            {summary ? `${summary.medianCprInRangePct}%` : '—'}
          </span>
          <span className="text-xs font-sans text-ink-muted block">
            Target ≥70%
          </span>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-sans font-bold uppercase text-ink-muted block">
            Handover Complete
          </span>
          <span className="text-2xl font-extrabold text-ink">
            {summary ? `${summary.handoverCompletePct}%` : '—'}
          </span>
          <span className="text-xs font-sans text-ink-muted block">
            4/4 Docket Fields
          </span>
        </Card>
      </div>

      {/* Horizontal Team Timeline Chart (with Table Toggle) */}
      <TimelineChart
        runs={drill.runs}
        durationSec={drill.durationSec}
        scenarioId={drill.scenarioId}
      />

      {/* Score Breakdown Formula & Teacher Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-ink">
              Score Breakdown &amp; Versioned Formula (v{drill.runs[0]?.scoreVersion ?? 1})
            </h3>
            <p className="text-xs text-ink-muted">
              Every sub-score is computed deterministically from event timestamps against school program targets (to be confirmed by a certified first-aid instructor).
            </p>
          </div>

          {sampleRunBreakdown && (
            <div className="space-y-2.5 text-xs sm:text-sm">
              {[
                {
                  title: '1. Simulated 112 Call Timing',
                  sub: sampleRunBreakdown.call112
                },
                {
                  title: '2. Time to First Chest Compression',
                  sub: sampleRunBreakdown.firstCompression
                },
                {
                  title: '3. CPR Tempo & Pause Quality',
                  sub: sampleRunBreakdown.cprRateQuality
                },
                {
                  title: '4. Squad Role Coverage',
                  sub: sampleRunBreakdown.roleCoverage
                },
                {
                  title: '5. Paramedic Handover Completeness',
                  sub: sampleRunBreakdown.handoverCompleteness
                }
              ].map((row) => (
                <div
                  key={row.title}
                  className="p-3 rounded-xl bg-base border border-border flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-ink block">{row.title}</span>
                    <span className="text-xs text-ink-muted">
                      {row.sub.ruleExplanation}
                    </span>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className="font-extrabold text-primary block">
                      {row.sub.points}/{row.sub.maxPoints} pts
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      Team 1: {row.sub.rawMetricLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                Teacher Debrief Notes (No Student Names)
              </h3>
              <p className="text-xs text-ink-muted">
                Record corridor observations, AED cabinet access issues, or compressor switch timing for the next practice session. Do not enter student names.
              </p>
            </div>
            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => {
                setNotesText(e.target.value);
                setNotesSaved(false);
              }}
              placeholder="e.g., Team 1 and Team 3 started compressions under 30s; remind AED runners which stairwell leads to the reception cabinet."
              className="w-full p-3.5 rounded-xl border border-border bg-base text-sm text-ink leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-3 print:hidden">
            <span className="text-xs text-ink-muted">
              {notesSaved ? 'Saved to drill record.' : 'Plain text only.'}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                drillService.updateDrillNotes(drill.id, notesText);
                setNotesSaved(true);
              }}
            >
              <span>Save Debrief Notes</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. LIVE DRILL CONTROL (/teach/drills/:drillId/live)
 * Phone-first screen for the teacher during a live drill:
 * - Big server-synced timer, Start / End buttons (with confirmation on End)
 * - Team cards showing claimed roles + QR join link
 * - Live event feed (limit 50)
 * - End-of-drill debrief comparing ideal vs actual timeline
 * ============================================================================ */
export interface LiveDrillControlScreenProps {
  drillId: string;
  onNavigate: (path: string) => void;
  onRealEmergencyExit: () => void;
}

export const LiveDrillControlScreen: React.FC<LiveDrillControlScreenProps> = ({
  drillId,
  onNavigate
}) => {
  const [, setTick] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    const unsub = drillService.subscribe(() => setTick((t) => t + 1));
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const store = drillService.getStore();
  const drill: DrillRecord | undefined = store.drills[drillId];

  if (!drill) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Button variant="primary" onClick={() => onNavigate('/teach')}>
          Back to Teacher Home
        </Button>
      </div>
    );
  }

  const scenario =
    DRILL_SCENARIOS[drill.scenarioId] ??
    DRILL_SCENARIOS['cardiac-arrest-unresponsive'];
  const elapsedSec =
    drill.startedAt && drill.status === 'live'
      ? Math.max(0, Math.floor((Date.now() - drill.startedAt) / 1000))
      : drill.endedAt && drill.startedAt
      ? Math.max(0, Math.floor((drill.endedAt - drill.startedAt) / 1000))
      : 0;

  // Gather latest 50 events across all teams
  const allEvents = drill.runs
    .flatMap((r) =>
      r.events.map((ev) => ({
        ...ev,
        teamName: r.teamName
      }))
    )
    .sort((a, b) => b.clientAt - a.clientAt)
    .slice(0, 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Practice Drill Timer & Control Bar */}
      <Card className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-primary/40">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="soft">
              Class {drill.className} • {drill.status === 'live' ? 'ACTIVE PRACTICE DRILL' : drill.status.toUpperCase()}
            </Badge>
            <span className="text-xs font-mono text-ink-muted">
              ID: {drill.id}
            </span>
            {drill.activeJoinCode && (
              <span className="px-2.5 py-0.5 rounded-lg bg-primary-soft border border-primary/30 text-xs font-mono font-bold text-primary">
                Quick-Join Code: {drill.activeJoinCode}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink">
            Practice Drill Control: {scenario.title}
          </h1>
          <p className="text-xs text-ink-muted">
            Teacher-assigned roster slots (S-01..S-16) lock to each student&apos;s device during the drill. Use &ldquo;Release Slot&rdquo; if a student refreshes their phone mid-drill.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-base border border-border font-mono tabular-nums text-center">
            <span className="text-[10px] font-sans font-bold uppercase text-ink-muted block">
              Elapsed Time (t0 Sync)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-primary">
              {Math.floor(elapsedSec / 60)}:
              {String(elapsedSec % 60).padStart(2, '0')}
            </span>
          </div>

          {drill.status !== 'live' && drill.status !== 'completed' && (
            <Button
              variant="primary"
              onClick={() => drillService.startLiveDrill(drill.id)}
            >
              <Play className="w-4 h-4" />
              <span>Start Practice Drill Timer</span>
            </Button>
          )}

          {drill.status === 'live' && !confirmEnd && (
            <Button
              variant="alert"
              onClick={() => setConfirmEnd(true)}
            >
              <Square className="w-4 h-4" />
              <span>End Practice Drill</span>
            </Button>
          )}

          {confirmEnd && (
            <div className="flex items-center gap-2">
              <Button
                variant="alert"
                size="sm"
                onClick={() => {
                  drillService.endAndScoreDrill(drill.id);
                  setConfirmEnd(false);
                }}
              >
                <span>Confirm End &amp; Score All Teams</span>
              </Button>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setConfirmEnd(false)}
              >
                <span>Cancel</span>
              </Button>
            </div>
          )}

          {drill.status === 'completed' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onNavigate(`/teach/classes/${drill.classId}/drills/${drill.id}`)
              }
            >
              <span>Open Full Drill Report</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* End-of-Drill Debrief Card (Ideal vs Actual Timeline) */}
      {drill.status === 'completed' && drill.summary && (
        <Card className="p-5 sm:p-6 bg-primary-soft/45 border-primary/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                Classroom Debrief Screen
              </span>
              <h2 className="text-xl font-extrabold text-ink">
                Program Target Timeline vs Class Median
              </h2>
            </div>
            <span className="text-2xl font-extrabold font-mono text-primary">
              Median Score: {drill.summary.medianScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono tabular-nums text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="font-sans font-bold text-ink-muted block">
                1. Simulated 112 Call
              </span>
              <span className="text-lg font-extrabold text-ink">
                Actual: {drill.summary.medianTimeToCall112 ?? '—'}s
              </span>
              <span className="text-xs text-primary block">
                Program Target: ≤{scenario.idealTimelineSec.call112_confirmed}s
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="font-sans font-bold text-ink-muted block">
                2. First Compression
              </span>
              <span className="text-lg font-extrabold text-ink">
                Actual: {drill.summary.medianTimeToFirstCompression ?? '—'}s
              </span>
              <span className="text-xs text-primary block">
                Program Target: ≤{scenario.idealTimelineSec.cpr_started}s
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="font-sans font-bold text-ink-muted block">
                3. CPR Rhythm (100–120 BPM)
              </span>
              <span className="text-lg font-extrabold text-ink">
                Actual: {drill.summary.medianCprInRangePct}%
              </span>
              <span className="text-xs text-primary block">
                Program Target: ≥70% in range
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="font-sans font-bold text-ink-muted block">
                4. AED Confirmed at Scene
              </span>
              <span className="text-lg font-extrabold text-ink">
                Actual: {drill.summary.medianAedConfirmedSec ?? '—'}s
              </span>
              <span className="text-xs text-primary block">
                Program Target: ≤{scenario.idealTimelineSec.aed_confirmed}s
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Team Role Cards + Live Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {drill.runs.map((run) => (
            <Card key={run.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    {run.teamName}
                  </h3>
                  <span className="text-xs font-mono text-ink-muted">
                    Token: {run.runToken}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/drill/${run.runToken}`)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-base hover:bg-primary-soft text-xs font-bold text-primary cursor-pointer"
                  >
                    Open Team View
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {scenario.roles.map((r) => {
                  const claimer = run.teamMembers.find(
                    (m) => m.roleId === r.id
                  );
                  const evDone = run.events.find(
                    (e) => e.type === r.eventType
                  );
                  return (
                    <div
                      key={r.id}
                      className="p-2 rounded-lg bg-base border border-border flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-ink">
                        {r.shortLabel}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        {claimer ? (
                          <>
                            <span className="text-primary font-bold">
                              {claimer.studentCode}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                drillService.releaseStudentSlot({
                                  drillId: drill.id,
                                  runId: run.id,
                                  studentCode: claimer.studentCode
                                })
                              }
                              className="px-1.5 py-0.5 rounded border border-border bg-surface hover:bg-alert/10 hover:text-alert text-[10px] font-sans font-bold text-ink-muted cursor-pointer"
                              title={`Release slot ${claimer.studentCode} so the student can re-join if their phone refreshed`}
                            >
                              Release Slot
                            </button>
                          </>
                        ) : (
                          <span className="text-ink-muted">Unclaimed</span>
                        )}
                        {evDone && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Live Event Feed (Latest 50) */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-base font-bold text-ink">
              Live Telemetry Feed (Latest 50)
            </h3>
            <span className="text-xs font-mono text-ink-muted">
              {allEvents.length} events
            </span>
          </div>

          {allEvents.length === 0 ? (
            <p className="text-xs text-ink-muted py-6 text-center">
              Waiting for student role claims and simulated 112 / CPR actions…
            </p>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 font-mono text-xs">
              {allEvents.map((ev) => {
                const sec = drill.startedAt
                  ? Math.max(0, Math.round((ev.clientAt - drill.startedAt) / 1000))
                  : 0;
                return (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-base border border-border flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-ink">
                        [{ev.teamName}] {ev.studentCode}
                      </span>{' '}
                      <span className="text-primary font-semibold">
                        {ev.type}
                      </span>
                    </div>
                    <span className="text-ink-muted tabular-nums">+{sec}s</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
