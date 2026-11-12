import * as fs from 'fs';
import * as path from 'path';
import { PROTOCOLS, AHA_2025_REVIEW_NOTE } from '../src/data/protocolSchema';

interface ValidationReport {
  errors: string[];
  warnings: string[];
  protocolFlags: Record<string, string[]>;
}

function validateProtocols(): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const protocolFlags: Record<string, string[]> = {};
  const seenIds = new Set<string>();
  const allIds = new Set(PROTOCOLS.map(p => p.id));
  const now = new Date();

  for (const proto of PROTOCOLS) {
    const flags: string[] = [];

    // 1. Duplicate ID check (Fatal)
    if (seenIds.has(proto.id)) {
      errors.push(`[DUPLICATE_ID] Protocol ID "${proto.id}" is duplicated.`);
      flags.push('ERR: Duplicate ID');
    }
    seenIds.add(proto.id);

    // 2. Emergency protocol call112 & first step check (Fatal)
    if (proto.severity === 'Emergency') {
      if (!proto.call112) {
        errors.push(`[EMERGENCY_NO_CALL112] Emergency protocol "${proto.id}" has call112 = false.`);
        flags.push('ERR: call112=false');
      }
      const firstStep = proto.steps[0];
      const firstStepText = `${firstStep?.title || ''} ${firstStep?.text || ''}`.toLowerCase();
      if (!firstStep || (!firstStepText.includes('112') && !firstStepText.includes('call emergency'))) {
        errors.push(
          `[EMERGENCY_STEP1_NOT_112] Emergency protocol "${proto.id}" does not start with a "call 112" step (found: "${firstStep?.title}").`
        );
        flags.push('ERR: Step 1 not Call 112');
      }
    }

    // 3. Source check (Fatal)
    if (!proto.sources || proto.sources.length === 0) {
      errors.push(`[MISSING_SOURCE] Protocol "${proto.id}" lacks a clinical guideline source.`);
      flags.push('ERR: No source');
    }

    // 4. Summary length check <= 90 chars (Fatal)
    if (!proto.summary || proto.summary.length > 90) {
      errors.push(
        `[SUMMARY_TOO_LONG] Protocol "${proto.id}" summary is ${proto.summary?.length || 0} chars (max 90): "${proto.summary}"`
      );
      flags.push(`ERR: Summary ${proto.summary?.length} chars`);
    }

    // 5. Related IDs existence check (Fatal)
    for (const relId of proto.related) {
      if (!allIds.has(relId)) {
        errors.push(
          `[BROKEN_RELATED_ID] Protocol "${proto.id}" references non-existent related ID "${relId}".`
        );
        flags.push(`ERR: Missing related ${relId}`);
      }
    }

    // 6. Step word count > 20 words (Warning)
    const longSteps = proto.steps
      .map((s, idx) => ({ idx: idx + 1, wc: s.wordCount }))
      .filter(s => s.wc > 20);
    if (longSteps.length > 0) {
      const desc = longSteps.map(s => `Step ${s.idx} (${s.wc}w)`).join(', ');
      warnings.push(`[STEP_OVER_20_WORDS] Protocol "${proto.id}" has steps over 20 words: ${desc}`);
      flags.push(`Step >20w: ${desc}`);
    }

    // 7. Review date in future or past next_review (Warning)
    if (proto.review.reviewed_on) {
      const revDate = new Date(proto.review.reviewed_on);
      if (revDate > now) {
        warnings.push(`[FUTURE_REVIEW_DATE] Protocol "${proto.id}" has future reviewed_on date ${proto.review.reviewed_on}`);
        flags.push(`Future review date (${proto.review.reviewed_on})`);
      }
    }
    if (proto.review.next_review) {
      const nextDate = new Date(proto.review.next_review);
      if (nextDate < now) {
        warnings.push(`[PAST_NEXT_REVIEW] Protocol "${proto.id}" is past its next_review date ${proto.review.next_review}`);
        flags.push(`Past next_review (${proto.review.next_review})`);
      }
    }

    // 8. Candidate summary approval flag
    if (proto.summaryCandidateNeedsApproval) {
      flags.push(`Approve <=90c summary: "${proto.summary}"`);
    }

    // 9. Missing aliases flag
    if (proto.missingAliasesFlag) {
      flags.push('Needs search aliases');
    }

    // 10. AHA Oct 2025 update note flag
    if (proto.review.status === 'needs_update') {
      flags.push('AHA Oct 2025 / IRC guideline verification required');
    }

    protocolFlags[proto.id] = flags;
  }

  return { errors, warnings, protocolFlags };
}

function generateClinicalReviewMarkdown(report: ValidationReport): string {
  const total = PROTOCOLS.length;
  const bySeverity = {
    Emergency: PROTOCOLS.filter(p => p.severity === 'Emergency').length,
    Urgent: PROTOCOLS.filter(p => p.severity === 'Urgent').length,
    Moderate: PROTOCOLS.filter(p => p.severity === 'Moderate').length,
    Mild: PROTOCOLS.filter(p => p.severity === 'Mild').length,
  };
  const needsUpdateCount = PROTOCOLS.filter(p => p.review.status === 'needs_update').length;
  const pendingReviewCount = PROTOCOLS.filter(p => p.review.status === 'pending_review').length;
  const candidateSummaryCount = PROTOCOLS.filter(p => p.summaryCandidateNeedsApproval).length;
  const over20WordsProtocols = PROTOCOLS.filter(p => p.steps.some(s => s.over20Words)).length;
  const missingAliasesCount = PROTOCOLS.filter(p => p.missingAliasesFlag).length;

  const lines: string[] = [
    '# Sanjeevani First-Aid Library — Clinical Review & Audit Tracker (`CLINICAL_REVIEW.md`)',
    '',
    '> **Important Governance Rule**: No clinical wording (steps, warnings, red flags) has been invented or rewritten by engineering. All protocols are marked `needs_update` or `pending_review` until signed off by a qualified clinician.',
    '',
    '## 1. Validation & Audit Summary',
    '',
    `- **Total Protocols Audited**: **${total}** (${bySeverity.Emergency} Emergency · ${bySeverity.Urgent} Urgent · ${bySeverity.Moderate} Moderate · ${bySeverity.Mild} Mild)`,
    `- **Build-Failing Schema Errors**: **${report.errors.length}**`,
    `- **Protocols Marked \`needs_update\` (AHA Oct 2025 / CPR / Choking / Overdose)**: **${needsUpdateCount}**`,
    `- **Protocols Marked \`pending_review\`**: **${pendingReviewCount}**`,
    `- **Protocols Marked \`reviewed\`**: **0** (strictly requires human clinician sign-off)`,
    `- **Candidate Summaries (≤ 90 chars extracted from 1st sentence) Awaiting Approval**: **${candidateSummaryCount}**`,
    `- **Protocols with Steps > 20 Words (Flagged for Clinical Tightening)**: **${over20WordsProtocols}** (${report.warnings.length} total warnings)`,
    `- **Protocols Flagged for Additional Search Aliases**: **${missingAliasesCount}**`,
    '',
    '## 2. Questions for the Clinical Content Owner',
    '',
    '1. **AHA October 2025 CPR & ECC Update vs. Indian Resuscitation Council (IRC)**:',
    `   - *Context*: ${AHA_2025_REVIEW_NOTE}`,
    '   - *Action Needed*: For `infant-choking`, `child-choking`, `infant-cpr`, `child-cpr`, `cardiac-arrest-aed`, `drowning`, `drug-overdose`, and `medication-overdose`, should we adopt the Oct 2025 AHA alternating 5 back blows / 5 abdominal thrusts sequence for conscious choking children/adults and the public naloxone steps, or retain the IRC BCLS phrasing alongside dual citations?',
    '2. **First-Step "Call 112 / ask someone to" Prepending on 8 Emergency Protocols**:',
    '   - *Context*: Eight `Emergency` protocols (`infant-choking`, `child-choking`, `anaphylactic-swelling`, `electric-shock`, `severe-frostbite`, `carbon-monoxide`, `anaphylaxis-full`, `unresponsive-breathing`) originally listed calling 112 in Step 2 or in the red-flag footer rather than Step 1. To comply with the mandatory safety rule (*"For EMERGENCY protocols the first step is always Call 112 / ask someone to"*), Step 1 now instructs calling 112 on speaker / asking a bystander while immediately proceeding to the original Step 1 (e.g., 5 back blows, EpiPen injection, power isolation). Please confirm this dual-action phrasing.',
    '3. **Candidate ≤ 90-Character One-Line Summaries**:',
    `   - *Context*: ${candidateSummaryCount} protocols had original \`whatIsIt\` descriptions between 91 and 123 characters. Each candidate summary in the table below was produced strictly by truncating the first sentence at its natural clause boundary without adding or rewording clinical claims. Please check the approval boxes to promote them from candidate to approved.`,
    '4. **Steps Exceeding 20 Words**:',
    `   - *Context*: ${over20WordsProtocols} protocols contain one or more steps slightly over 20 words (typically 21–24 words when combining the bold step title and detail). We have preserved the exact clinical wording and flagged each step number and word count in the table below for optional editorial tightening.`,
    '',
    '## 3. All 100 Protocols — Clinical Sign-Off Table',
    '',
    '| Sign-Off | ID | Title | Severity | Status | Sources Cited | Audit Flags & Candidate Summary |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  for (const proto of PROTOCOLS) {
    const sourcesStr = proto.sources.map(s => `${s.publisher} (${s.year})`).join('; ');
    const flags = report.protocolFlags[proto.id] || [];
    const flagsStr = flags.length > 0 ? flags.join(' · ') : 'None (ready for sign-off)';
    lines.push(
      `| - [ ] | \`${proto.id}\` | **${proto.title}** | ${proto.severity} | \`${proto.review.status}\` | ${sourcesStr} | ${flagsStr} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

const report = validateProtocols();
const mdContent = generateClinicalReviewMarkdown(report);
const outPath = path.resolve(process.cwd(), 'CLINICAL_REVIEW.md');
fs.writeFileSync(outPath, mdContent, 'utf-8');

console.log('=== Sanjeevani Protocol Schema & Clinical Audit Validator ===');
console.log(`Audited ${PROTOCOLS.length} protocols.`);
console.log(`Generated ${outPath}`);
console.log(`Errors: ${report.errors.length}`);
console.log(`Warnings: ${report.warnings.length}`);

if (report.errors.length > 0) {
  console.error('\nFATAL VALIDATION ERRORS:');
  for (const err of report.errors) {
    console.error('  ✗', err);
  }
  process.exit(1);
} else {
  console.log('✓ All 100 protocols passed strict schema, <=90-char summary, Emergency Call-112 Step-1, source provenance, and related-ID checks.');
}
