import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  AlertOctagon,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  BookOpen,
  Activity,
  ClipboardCheck,
  ExternalLink,
  Stethoscope
} from 'lucide-react';
import { resolveClinicalDeepDiveDoc } from '../../data/clinicalDeepDiveDocs';
import { useAppLanguage, UI_TRANSLATIONS } from '../../utils/languageStore';

interface FormattedAIMessageProps {
  text: string;
  onTriggerEscalation?: (reason?: string) => void;
  className?: string;
  animate?: boolean;
  onComplete?: () => void;
  focusMode?: boolean;
  showDeepDiveDoc?: boolean;
}

/**
 * Render inline markdown while enforcing C.1:
 * "Bold only on the action verb or key number inside a line, at most one bold phrase per bullet."
 */
export function renderInlineMarkdown(
  text: string,
  maxBolds: number = 1
): React.ReactNode {
  if (!text) return null;
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  let boldCount = 0;

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      if (boldCount < maxBolds) {
        boldCount++;
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {inner}
          </strong>
        );
      }
      return <span key={i}>{inner}</span>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <em key={i} className="italic text-inherit">
          {inner}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-base border border-border text-[15px] font-mono text-slate-800"
        >
          {inner}
        </code>
      );
    }
    return token;
  });
}

type SectionType =
  | 'immediate_action'
  | 'steps_group'
  | 'what_not_to_do'
  | 'call_112'
  | 'secondary_disclosure';

export interface StepItem {
  stepNumber: number;
  title?: string;
  content: string;
}

export interface DangerSubSection {
  subheading?: string;
  content?: string;
  bullets: string[];
}

export interface ParsedBlock {
  type: SectionType;
  title?: string;
  content: string;
  steps?: StepItem[];
  bullets?: string[];
  subSections?: DangerSubSection[];
  secondaryItems?: string[];
}

/**
 * Checks whether a leftover line is a generic conversational preamble
 * (e.g., "Below is the general emergency protocol for Severe Bleeding:")
 * so we don't clutter clinical notes with boilerplate.
 */
function isRedundantPreambleLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (
    lower.includes('below is the general emergency protocol') ||
    lower.includes('here is the verified emergency protocol') ||
    lower.startsWith('i am sanjeevani ai guardian')
  ) {
    return true;
  }
  return false;
}

/**
 * Robustly parses markdown medical response into semantic blocks:
 * - Immediate Priority
 * - Plain numbered list of steps
 * - Merged single "Avoid" callout
 * - Merged single "Call 112 / Red Flags" callout (never > 2 red blocks total)
 * - Structured Clinical Deep-Dive & Guideline Sources document (`secondary_disclosure`).
 */
export function parseMedicalResponse(text: string): ParsedBlock[] {
  if (!text) return [];

  const rawLines = text.split(/\r?\n/);
  let immediatePriorityContent = '';
  const steps: StepItem[] = [];
  const avoidBullets: string[] = [];
  const avoidTitle = 'Avoid / Do Not Do';
  const redFlagBullets: string[] = [];
  let redFlagTitle = 'Immediate 112 / Hospital Red Flags';
  const extraRedSubSections: DangerSubSection[] = [];
  const secondaryNotes: string[] = [];

  let currentMode: 'none' | 'priority' | 'avoid' | 'call_112' | 'secondary' = 'none';

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();
    if (!line) continue;

    const cleanLower = line
      .toLowerCase()
      .replace(/^[•*\-\s#]+/, '')
      .replace(/^\*\*|\*\*$/g, '')
      .trim();

    // 0. Skip redundant "Action Steps" headers
    if (
      /^(immediate\s+)?action\s+steps[:*\s]*$/i.test(cleanLower) ||
      /^steps\s+to\s+take[:*\s]*$/i.test(cleanLower) ||
      /^here\s+is\s+what\s+you\s+should\s+do[:*\s]*$/i.test(cleanLower)
    ) {
      currentMode = 'none';
      continue;
    }

    // 1. Immediate Priority line
    const immediateMatch =
      !immediatePriorityContent && !cleanLower.startsWith('step')
        ? line.match(
            /^[•*\-\s]*(\*{1,2})?\s*immediate\s+(priority|action)(\s*\(first\s*10\s*seconds\))?[:*\s]*(.*)/i
          )
        : null;
    if (immediateMatch) {
      const rawContent = immediateMatch[4] || '';
      const cleanContent = rawContent
        .replace(/^[•*:\s]+/, '')
        .replace(/[*_\s]+$/, '')
        .trim();
      if (cleanContent) {
        immediatePriorityContent = cleanContent;
        currentMode = 'none';
      } else {
        currentMode = 'priority';
      }
      continue;
    }

    if (currentMode === 'priority' && !immediatePriorityContent) {
      immediatePriorityContent = line
        .replace(/^[•*:\s]+/, '')
        .replace(/[*_\s]+$/, '')
        .trim();
      currentMode = 'none';
      continue;
    }

    // 2. Check for Avoid / Contraindication heading or inline "DO NOT / Avoid" line
    const isAvoidHeading =
      cleanLower.startsWith('what not to do') ||
      cleanLower.startsWith('critical contraindications') ||
      cleanLower.startsWith('contraindications') ||
      cleanLower.startsWith('avoid / do not') ||
      cleanLower === 'avoid' ||
      cleanLower === 'avoid:' ||
      cleanLower === 'do not:';

    if (isAvoidHeading) {
      currentMode = 'avoid';
      const inlineRemainder = line
        .replace(/^[•*\-\s#]+/g, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^what not to do:?/i, '')
        .replace(/^critical contraindications(\s*\(what not to do\))?:?/i, '')
        .replace(/^contraindications:?/i, '')
        .replace(/^avoid(\s*\/\s*do not do)?:?/i, '')
        .replace(/^do not:?/i, '')
        .replace(/^[:*\s]+/, '')
        .replace(/[*#]+$/g, '')
        .trim();
      if (inlineRemainder) {
        avoidBullets.push(inlineRemainder);
      }
      continue;
    }

    // 3. Check for Call 112 / Red Flags heading
    const isRedFlagHeading =
      (cleanLower.startsWith('call 112') ||
        cleanLower.startsWith('when to call 112') ||
        cleanLower.startsWith('emergency red flags') ||
        cleanLower.startsWith('hospital red flags') ||
        cleanLower.startsWith('immediate 112') ||
        cleanLower.startsWith('⚠️ immediate 112') ||
        cleanLower.startsWith('seek immediate emergency')) &&
      line.length < 95;

    if (isRedFlagHeading) {
      currentMode = 'call_112';
      const cleanedHeading = line
        .replace(/^[•*\-\s#]+/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^⚠️\s*/, '')
        .replace(/[:\s]+$/, '')
        .trim();
      if (cleanedHeading) {
        redFlagTitle = cleanedHeading;
      }
      continue;
    }

    // 4. Numbered Steps (1. ..., 2. ...)
    const stepMatch = line.match(/^(\d+)[.):]\s+(.*)/);
    if (stepMatch) {
      currentMode = 'none';
      const stepNum = parseInt(stepMatch[1], 10);
      const stepBody = stepMatch[2].trim();

      const titleMatch = stepBody.match(
        /^(\*\*([^*]+)\*\*|\*([^*]+)\*|([A-Za-z0-9\s/&'-]+):)\s*[:\-–—]?\s*(.*)/
      );
      if (titleMatch) {
        const rawTitle = titleMatch[2] || titleMatch[3] || titleMatch[4];
        const cleanTitle = rawTitle.replace(/[:\s]+$/, '').trim();
        const cleanContent = (titleMatch[5] || '').replace(/^[:\s\-–—]+/, '').trim();
        steps.push({
          stepNumber: stepNum,
          title: cleanTitle,
          content: cleanContent
        });
      } else {
        steps.push({
          stepNumber: stepNum,
          content: stepBody
        });
      }
      continue;
    }

    // 5. Standalone "DO NOT ..." or "Avoid ..." bullet or sentence anywhere in the text -> merge into Avoid callout
    const bulletStripped = line.replace(/^[•*-]\s*/, '').replace(/\*$/g, '').trim();
    const isStandaloneAvoidLine =
      /^(do\s+not|don't|never|avoid)\b/i.test(bulletStripped) &&
      currentMode !== 'call_112';

    if (isStandaloneAvoidLine) {
      avoidBullets.push(bulletStripped);
      continue;
    }

    // 6. Bullet points under current mode
    if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
      if (currentMode === 'avoid') {
        avoidBullets.push(bulletStripped);
        continue;
      }
      if (currentMode === 'call_112') {
        redFlagBullets.push(bulletStripped);
        continue;
      }
      if (!isRedundantPreambleLine(bulletStripped)) {
        secondaryNotes.push(bulletStripped);
      }
      continue;
    }

    // 7. Plain lines under avoid or call_112 mode
    if (currentMode === 'avoid') {
      avoidBullets.push(bulletStripped);
      continue;
    }
    if (currentMode === 'call_112') {
      redFlagBullets.push(bulletStripped);
      continue;
    }

    // 8. Secondary material (intro greetings, guideline attributions, extra notes, post-event advice)
    const cleanedNote = line
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*|\*$/g, '')
      .trim();
    if (cleanedNote && !isRedundantPreambleLine(cleanedNote)) {
      secondaryNotes.push(cleanedNote);
    }
  }

  const result: ParsedBlock[] = [];

  if (immediatePriorityContent) {
    result.push({
      type: 'immediate_action',
      title: 'Immediate priority',
      content: immediatePriorityContent
    });
  }

  if (steps.length > 0) {
    result.push({
      type: 'steps_group',
      content: '',
      steps
    });
  }

  if (avoidBullets.length > 0) {
    result.push({
      type: 'what_not_to_do',
      title: avoidTitle,
      content: '',
      bullets: avoidBullets
    });
  }

  if (redFlagBullets.length > 0 || extraRedSubSections.length > 0) {
    result.push({
      type: 'call_112',
      title: redFlagTitle,
      content: '',
      bullets: redFlagBullets,
      subSections: extraRedSubSections
    });
  }

  // Always attach the structured Clinical Deep-Dive & Guideline Sources block when a medical protocol is present
  if (result.length === 0 && secondaryNotes.length > 0) {
    result.push({
      type: 'immediate_action',
      title: 'Guidance',
      content: secondaryNotes[0]
    });
    result.push({
      type: 'secondary_disclosure',
      title: 'Additional notes & guideline sources',
      content: '',
      secondaryItems: secondaryNotes.slice(1)
    });
  } else if (result.length > 0) {
    result.push({
      type: 'secondary_disclosure',
      title: 'Additional notes & guideline sources',
      content: '',
      secondaryItems: secondaryNotes
    });
  }

  return result;
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  text,
  onTriggerEscalation,
  className = '',
  onComplete,
  focusMode = false,
  showDeepDiveDoc = true
}) => {
  const { lang } = useAppLanguage();
  const copy = UI_TRANSLATIONS[lang];
  const blocks = useMemo(() => parseMedicalResponse(text), [text]);
  const deepDiveDoc = useMemo(() => resolveClinicalDeepDiveDoc(text), [text]);
  const stepsBlock = useMemo(
    () => blocks.find((b) => b.type === 'steps_group'),
    [blocks]
  );
  const stepItems = stepsBlock?.steps || [];
  const totalSteps = stepItems.length;

  const [focusedStepIdx, setFocusedStepIdx] = useState(0);

  useEffect(() => {
    setFocusedStepIdx(0);
  }, [text]);

  useEffect(() => {
    onComplete?.();
  }, [text, onComplete]);

  if (!text) return null;

  // Shared Danger Callout Renderer (Section C)
  const renderDangerBlock = (block: ParsedBlock, key: React.Key) => {
    const isCall112 = block.type === 'call_112';
    return (
      <div
        key={key}
        className="max-w-[68ch] rounded-xl border border-red-200 border-l-[3px] border-l-red-600 bg-red-50 px-4 py-3 text-[#7F1D1D] space-y-2"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[16px] font-semibold text-[#7F1D1D] leading-snug">
            {isCall112 ? (
              <AlertOctagon className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isCall112
                ? copy.call112NowIf
                : copy.whatNotToDoHeading}
            </span>
          </div>

          {isCall112 && onTriggerEscalation && (
            <button
              type="button"
              onClick={() => onTriggerEscalation('AI Emergency Red Flags Triggered')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-alert hover:bg-alert-dark text-white text-[14px] font-semibold leading-snug inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert"
            >
              <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Call 112</span>
            </button>
          )}
        </div>

        {block.bullets && block.bullets.length > 0 && (
          <ul className="space-y-2 text-[16px] leading-snug text-[#7F1D1D]">
            {block.bullets.map((b, bIdx) => (
              <li key={bIdx} className="flex items-start gap-2">
                <span className="font-semibold text-red-700 shrink-0" aria-hidden="true">
                  •
                </span>
                <span>{renderInlineMarkdown(b, 1)}</span>
              </li>
            ))}
          </ul>
        )}

        {block.subSections &&
          block.subSections.map((sub, sIdx) => (
            <div key={sIdx} className="pt-2 border-t border-red-200/80 space-y-1.5">
              {sub.subheading && (
                <div className="text-[15px] font-semibold text-[#7F1D1D]">
                  {sub.subheading}
                </div>
              )}
              <ul className="space-y-2 text-[16px] leading-snug text-[#7F1D1D]">
                {sub.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <span className="font-semibold text-red-700 shrink-0" aria-hidden="true">
                      •
                    </span>
                    <span>{renderInlineMarkdown(b, 1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    );
  };

  /* ==========================================================================
   * FOCUS MODE: One Step at a Time
   * ========================================================================== */
  if (focusMode && totalSteps > 0) {
    const activeStep = stepItems[Math.min(focusedStepIdx, totalSteps - 1)];
    const avoidBlock = blocks.find((b) => b.type === 'what_not_to_do');
    const call112Block = blocks.find((b) => b.type === 'call_112');

    return (
      <div className={`space-y-4 text-slate-800 max-w-[68ch] ${className}`}>
        <div className="flex items-center justify-between gap-2 text-[14px] font-semibold text-ink-muted tabular-nums">
          <span>
            Step {focusedStepIdx + 1} of {totalSteps}
          </span>
          <div className="flex items-center gap-1.5">
            {stepItems.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all duration-150 ${
                  i === focusedStepIdx ? 'w-5 bg-primary' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 py-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[14px] font-semibold tabular-nums mt-0.5"
          >
            {activeStep.stepNumber || focusedStepIdx + 1}
          </span>
          <div className="text-[18px] leading-[1.55] font-medium text-slate-800 min-w-0 flex-1">
            {activeStep.title ? (
              <>
                <strong className="font-semibold text-slate-900 mr-1.5">
                  {activeStep.title.replace(/\*\*/g, '')}:
                </strong>
                <span>{renderInlineMarkdown(activeStep.content, 0)}</span>
              </>
            ) : (
              <span>{renderInlineMarkdown(activeStep.content, 1)}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={focusedStepIdx === 0}
            onClick={() => setFocusedStepIdx((prev) => Math.max(0, prev - 1))}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-base hover:bg-primary-soft border border-border text-[15px] font-semibold text-ink flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Previous step</span>
          </button>

          <button
            type="button"
            disabled={focusedStepIdx >= totalSteps - 1}
            onClick={() =>
              setFocusedStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))
            }
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Next step</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>

        {avoidBlock && renderDangerBlock(avoidBlock, 'focus-avoid')}
        {call112Block && renderDangerBlock(call112Block, 'focus-112')}
      </div>
    );
  }

  /* ==========================================================================
   * STANDARD READABLE VIEW (Section C)
   * ========================================================================== */
  return (
    <div className={`space-y-4 text-[17px] leading-[1.6] font-normal text-slate-800 max-w-[68ch] ${className}`}>
      {blocks.map((block, index) => {
        // 1. Immediate Priority
        if (block.type === 'immediate_action') {
          return (
            <p key={index} className="text-[17px] leading-[1.6] font-normal text-slate-800">
              <strong className="font-semibold text-slate-900 mr-1.5">
                {copy.doThisNow}:
              </strong>
              <span>{renderInlineMarkdown(block.content, 0)}</span>
            </p>
          );
        }

        // 2. Plain Numbered List of Steps (28px numeral circles in primary, no card per step)
        if (block.type === 'steps_group' && block.steps) {
          return (
            <ol key={index} className="space-y-2.5 list-none pl-0">
              {block.steps.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[14px] font-semibold tabular-nums mt-0.5"
                  >
                    {step.stepNumber || sIdx + 1}
                  </span>
                  <div className="text-[18px] leading-[1.55] font-medium text-slate-800 min-w-0 flex-1">
                    {step.title ? (
                      <>
                        <strong className="font-semibold text-slate-900 mr-1.5">
                          {step.title.replace(/\*\*/g, '')}:
                        </strong>
                        <span>{renderInlineMarkdown(step.content, 0)}</span>
                      </>
                    ) : (
                      <span>{renderInlineMarkdown(step.content, 1)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        // 3. Avoid Callout & 4. Red Flags Callout (Shared Danger Style, max 2 total)
        if (block.type === 'what_not_to_do' || block.type === 'call_112') {
          return renderDangerBlock(block, index);
        }

        // 5. Well-Formatted Clinical Deep-Dive Document & Accredited Guideline Sources
        if (block.type === 'secondary_disclosure' && showDeepDiveDoc) {
          const customNotes = block.secondaryItems || [];

          return (
            <details
              key={index}
              open
              data-testid="clinical-deep-dive-doc"
              className="group rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden text-[15px] text-slate-700"
            >
              <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none bg-base/70 hover:bg-primary-soft/30 transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-[15px] text-ink leading-snug">
                      {block.title || 'Additional notes & guideline sources'}
                    </span>
                    <span className="block text-xs font-medium text-ink-muted leading-snug">
                      {deepDiveDoc.classification}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className="w-4 h-4 text-ink-muted shrink-0 transition-transform duration-150 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>

              <div className="p-4 sm:p-5 border-t border-border space-y-5 text-[15px] leading-relaxed text-slate-800">
                {/* Optional AI situation-specific notes */}
                {customNotes.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-primary-soft/35 border border-primary/20 space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary">
                      Triage &amp; Situation Note
                    </div>
                    <ul className="space-y-1.5 text-[15px] leading-snug text-ink">
                      {customNotes.map((item, nIdx) => (
                        <li key={nIdx}>{renderInlineMarkdown(item, 2)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Document Title & Clinical Overview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>In-Depth Clinical Reference</span>
                  </div>
                  <h4 className="text-[17px] font-bold text-ink leading-snug">
                    {deepDiveDoc.title}
                  </h4>
                  <p className="text-[15px] text-slate-700 leading-relaxed">
                    {deepDiveDoc.clinicalSummary}
                  </p>
                </div>

                {/* Section A: Why Each Step Works (Pathophysiology & Clinical Pearls) */}
                <div className="space-y-3">
                  <h5 className="text-sm font-bold text-ink uppercase tracking-wider">
                    1. Clinical Rationale — Why Each Step Works
                  </h5>
                  <div className="space-y-2.5">
                    {deepDiveDoc.pathophysiologySteps.map((pStep, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-xl bg-base border border-border space-y-1.5"
                      >
                        <div className="font-bold text-[15px] text-ink leading-snug">
                          {pIdx + 1}. {pStep.title}
                        </div>
                        <p className="text-[14px] text-slate-700 leading-relaxed">
                          <strong className="font-semibold text-ink">Mechanism:</strong>{' '}
                          {pStep.mechanism}
                        </p>
                        <p className="text-[14px] text-primary leading-relaxed">
                          <strong className="font-semibold">Clinical pearl:</strong>{' '}
                          {pStep.clinicalPearl}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section B: Vitals & Perfusion Monitoring Matrix */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <h5 className="text-sm font-bold text-ink uppercase tracking-wider">
                      2. What to Monitor Every 2–3 Minutes Until Help Arrives
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {deepDiveDoc.monitoringChecklist.map((mItem, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-3 rounded-xl bg-base border border-border space-y-1.5 text-[14px]"
                      >
                        <div className="font-bold text-ink">{mItem.metric}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
                            <span className="block text-xs font-bold uppercase text-emerald-800">
                              Stable target
                            </span>
                            <span className="leading-snug">{mItem.normalTarget}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-red-50/80 border border-red-200/80 text-[#7F1D1D]">
                            <span className="block text-xs font-bold uppercase text-red-800">
                              Escalation / shock sign
                            </span>
                            <span className="leading-snug">{mItem.dangerThreshold}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section C: Paramedic Handover Checklist (SBAR) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <h5 className="text-sm font-bold text-ink uppercase tracking-wider">
                      3. What to Report to the 112 Paramedic Crew
                    </h5>
                  </div>
                  <ul className="p-3.5 rounded-xl bg-base border border-border space-y-1.5 text-[14px] text-slate-700">
                    {deepDiveDoc.paramedicHandoverPoints.map((pt, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <span className="font-bold text-primary shrink-0">•</span>
                        <span className="leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section D: Accredited Clinical Guideline Resources (with external links) */}
                <div className="space-y-2.5">
                  <h5 className="text-sm font-bold text-ink uppercase tracking-wider">
                    4. Accredited Clinical Guidelines &amp; Official Resources
                  </h5>
                  <div className="grid grid-cols-1 gap-2.5">
                    {deepDiveDoc.resources.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3.5 rounded-xl bg-base border border-border flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-bold whitespace-nowrap">
                              {res.badge}
                            </span>
                            <span className="text-xs font-semibold text-ink-muted">
                              {res.organization} · {res.yearOrEdition}
                            </span>
                          </div>
                          <div className="font-bold text-[15px] text-ink leading-snug">
                            {res.title}
                          </div>
                          <p className="text-[13px] text-slate-600 leading-relaxed">
                            {res.summary}
                          </p>
                        </div>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-primary-soft/50 border border-border hover:border-primary/40 text-xs font-bold text-primary transition-colors whitespace-nowrap shrink-0 self-start"
                        >
                          <span>Open resource</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          );
        }

        return null;
      })}
    </div>
  );
};
