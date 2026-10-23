import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  PhoneCall, 
  AlertOctagon, 
  CheckCircle2, 
  Heart,
  FastForward,
  Activity
} from 'lucide-react';

interface FormattedAIMessageProps {
  text: string;
  onTriggerEscalation?: (reason?: string) => void;
  className?: string;
  animate?: boolean;
  onComplete?: () => void;
}

/**
 * Render inline markdown (bold **text**, italics *text*, backticks `text`)
 */
export function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  // Regex to match **bold**, *italic*, or `code`
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      return (
        <strong key={i} className="font-extrabold text-inherit">
          {inner}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <em key={i} className="italic font-semibold text-inherit">
          {inner}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[11px] font-mono text-inherit border-none">
          {inner}
        </code>
      );
    }
    return token;
  });
}

type SectionType = 
  | 'intro'
  | 'immediate_action'
  | 'step'
  | 'what_not_to_do'
  | 'call_112'
  | 'bullet'
  | 'heading'
  | 'paragraph';

interface ParsedBlock {
  type: SectionType;
  title?: string;
  content: string;
  stepNumber?: number;
  bullets?: string[];
}

/**
 * Robustly parses markdown medical response into semantic blocks.
 * Cleans out raw ### headings, double colons ::, and handles bulleted "Immediate Priority:"
 */
export function parseMedicalResponse(text: string): ParsedBlock[] {
  if (!text) return [];

  const rawLines = text.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];
  let currentBlock: ParsedBlock | null = null;

  const flushCurrent = () => {
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    if (!line) {
      // Empty line closes grouped blocks unless next line is a continuation bullet
      if (currentBlock && (currentBlock.type === 'bullet' || currentBlock.type === 'call_112' || currentBlock.type === 'what_not_to_do')) {
        const nextLine = rawLines[i + 1]?.trim() || '';
        if (/^[•\*\-]\s+/.test(nextLine)) {
          continue;
        }
      }
      flushCurrent();
      continue;
    }

    // 0. Check if line signifies Action Steps heading FIRST (prevents matching as immediate_action)
    const isActionStepsHeading = /^[•\*\-\s#]*(\*{1,2})?\s*(immediate\s+)?action\s+steps[:\*\s]*/i.test(line) ||
                                 /^[•\*\-\s#]*(\*{1,2})?\s*steps\s+to\s+take[:\*\s]*/i.test(line) ||
                                 /^[•\*\-\s#]*(\*{1,2})?\s*action\s+steps[:\*\s]*/i.test(line);
    if (isActionStepsHeading) {
      flushCurrent();
      blocks.push({
        type: 'heading',
        content: '⚡ Immediate Action Steps'
      });
      continue;
    }

    // 1. Check for Immediate Priority (Only ONE Immediate Priority card allowed per message)
    const hasExistingPriority: boolean = blocks.some((b: ParsedBlock) => b.type === 'immediate_action') || (currentBlock !== null && currentBlock.type === 'immediate_action');
    const immediateMatch: RegExpMatchArray | null = !hasExistingPriority && !line.toLowerCase().includes('step')
      ? line.match(/^[•\*\-\s]*(\*{1,2})?\s*immediate\s+(priority|action)(\s*\(first\s*10\s*seconds\))?[:\*\s]*(.*)/i)
      : null;
    if (immediateMatch) {
      flushCurrent();
      const rawContent: string = immediateMatch[4] || '';
      // Strip asterisks, colons, bullets so text doesn't end up wrapped in muted italics
      const cleanContent: string = rawContent.replace(/^[•\*\:\s]+/, '').replace(/[\*_\s]+$/, '').trim();
      currentBlock = {
        type: 'immediate_action',
        title: 'Immediate Priority (First 10 Seconds)',
        content: cleanContent
      };
      if (cleanContent) {
        flushCurrent();
      }
      continue;
    }

    // Accumulate into immediate_action if previous line had no content
    if (currentBlock && currentBlock.type === 'immediate_action' && !currentBlock.content) {
      currentBlock.content = line.replace(/^[•\*\:\s]+/, '').replace(/[\*_\s]+$/, '').trim();
      flushCurrent();
      continue;
    }

    // 2. Markdown Headings (#, ##, ###)
    const headingMatch = line.match(/^#{1,6}\s*(.*)/);
    if (headingMatch) {
      flushCurrent();
      const headingText = headingMatch[1].replace(/[:\s]+$/, '').replace(/[*_#]/g, '').trim();
      const headingLower = headingText.toLowerCase();

      // Check if heading signifies steps
      if (headingLower.includes('action step') || headingLower.includes('what you should do') || headingLower.includes('steps to take')) {
        blocks.push({
          type: 'heading',
          content: '⚡ Immediate Action Steps'
        });
        continue;
      }

      // Check if heading signifies contraindications
      if (headingLower.includes('what not to do') || headingLower.includes('contraindication') || headingLower.includes('avoid')) {
        currentBlock = {
          type: 'what_not_to_do',
          title: 'What NOT to Do (Critical Contraindications)',
          content: '',
          bullets: []
        };
        continue;
      }

      // Check if heading signifies Call 112 / Emergency
      if (headingLower.includes('call 112') || headingLower.includes('red flag') || headingLower.includes('emergency')) {
        currentBlock = {
          type: 'call_112',
          title: headingText.replace(/^⚠️\s*/, ''),
          content: '',
          bullets: []
        };
        continue;
      }

      // General heading
      blocks.push({
        type: 'heading',
        content: headingText
      });
      continue;
    }

    // 3. "WHAT NOT TO DO" / Contraindications without markdown hashes
    const cleanLower = line.toLowerCase().replace(/^[•\*\-\s#]+/, '');
    if (
      cleanLower.startsWith('what not to do') ||
      cleanLower.startsWith('critical contraindications') ||
      cleanLower.startsWith('contraindications') ||
      cleanLower.startsWith('avoid:') ||
      cleanLower.startsWith('do not:')
    ) {
      flushCurrent();
      const content = line
        .replace(/^[•\*\-\s#]+/g, '')
        .replace(/^what not to do:?/i, '')
        .replace(/^critical contraindications(\s*\(what not to do\))?:?/i, '')
        .replace(/^contraindications:?/i, '')
        .replace(/^avoid:?/i, '')
        .replace(/^do not:?/i, '')
        .replace(/[*#]/g, '')
        .trim();

      currentBlock = {
        type: 'what_not_to_do',
        title: 'What NOT to Do',
        content,
        bullets: []
      };
      continue;
    }

    // 4. "Call 112" / Emergency Red Flags without markdown hashes
    if (
      (cleanLower.startsWith('call 112') ||
       cleanLower.startsWith('when to call 112') ||
       cleanLower.startsWith('emergency red flags') ||
       cleanLower.startsWith('hospital red flags') ||
       cleanLower.startsWith('immediate 112') ||
       cleanLower.startsWith('seek immediate emergency')) &&
      line.length < 90
    ) {
      flushCurrent();
      const title = line.replace(/^[•\*\-\s#]+/, '').replace(/^\*\*|\*\*$/g, '').replace(/^⚠️\s*/, '').trim();
      currentBlock = {
        type: 'call_112',
        title: title || 'Call 112 or Seek Immediate Help If:',
        content: '',
        bullets: []
      };
      continue;
    }

    // 5. Numbered Steps: e.g. "1. **Administer Epinephrine:** Use the auto-injector..."
    const stepMatch = line.match(/^(\d+)[\.\)\:]\s+(.*)/);
    if (stepMatch) {
      flushCurrent();
      const stepNum = parseInt(stepMatch[1], 10);
      const stepBody = stepMatch[2].trim();

      // Check if title is inside **bold**, *italic*, or followed by a colon
      const titleMatch = stepBody.match(/^(\*\*([^*]+)\*\*|\*([^*]+)\*|([A-Za-z0-9\s/&'-]+):)\s*[:\-–—]?\s*(.*)/);
      if (titleMatch) {
        const rawTitle = titleMatch[2] || titleMatch[3] || titleMatch[4];
        // Strip any trailing colons or whitespace to prevent double colons (::)
        const cleanTitle = rawTitle.replace(/[:\s]+$/, '').trim();
        const cleanContent = (titleMatch[5] || '').replace(/^[:\s\-–—]+/, '').trim();

        blocks.push({
          type: 'step',
          stepNumber: stepNum,
          title: cleanTitle,
          content: cleanContent
        });
      } else {
        blocks.push({
          type: 'step',
          stepNumber: stepNum,
          content: stepBody
        });
      }
      continue;
    }

    // 6. Bullet Points (•, *, -)
    if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
      const bulletText = line.replace(/^[•\*\-]\s*/, '').trim();

      if (currentBlock && (currentBlock.type === 'call_112' || currentBlock.type === 'what_not_to_do')) {
        currentBlock.bullets = currentBlock.bullets || [];
        currentBlock.bullets.push(bulletText);
        continue;
      }

      if (currentBlock && currentBlock.type === 'bullet') {
        currentBlock.bullets = currentBlock.bullets || [];
        currentBlock.bullets.push(bulletText);
        continue;
      }

      flushCurrent();
      currentBlock = {
        type: 'bullet',
        content: '',
        bullets: [bulletText]
      };
      continue;
    }

    // 7. General Section Subheadings: e.g. "**Here is what you should do:**"
    if (
      (line.startsWith('**') && line.endsWith('**') && line.length < 60) ||
      cleanLower.startsWith('here is what you should do')
    ) {
      flushCurrent();
      const headingText = line.replace(/^\*\*|\*\*$/g, '').replace(/[:\s]+$/, '').trim();
      blocks.push({
        type: 'heading',
        content: headingText
      });
      continue;
    }

    // 8. Accumulating content inside What NOT to Do without bullets
    if (currentBlock && currentBlock.type === 'what_not_to_do' && !currentBlock.content) {
      currentBlock.content = line;
      continue;
    }

    // 9. Intro greeting block
    if (blocks.length === 0 && !currentBlock && (cleanLower.startsWith('namaste') || cleanLower.startsWith('hello') || cleanLower.startsWith('welcome'))) {
      blocks.push({
        type: 'intro',
        content: line
      });
      continue;
    }

    flushCurrent();
    blocks.push({
      type: 'paragraph',
      content: line
    });
  }

  flushCurrent();
  return blocks;
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  text,
  onTriggerEscalation,
  className = '',
  animate = false,
  onComplete
}) => {
  const blocks = useMemo(() => parseMedicalResponse(text), [text]);

  // Identify step blocks vs pre-step vs post-step blocks
  const stepBlocks = useMemo(() => blocks.filter(b => b.type === 'step'), [blocks]);
  const totalSteps = stepBlocks.length;

  // Immediate priority / intro text for word-by-word streaming
  const priorityBlock = useMemo(() => blocks.find(b => b.type === 'immediate_action' || b.type === 'intro'), [blocks]);
  const priorityWords = useMemo(() => {
    if (!priorityBlock || !priorityBlock.content) return [];
    return priorityBlock.content.split(/\s+/).filter(Boolean);
  }, [priorityBlock]);

  // Animation states
  const [revealedWords, setRevealedWords] = useState<number>(() => (animate && priorityWords.length > 0 ? 0 : 9999));
  const [visibleStepCount, setVisibleStepCount] = useState<number>(() => (animate ? 0 : totalSteps));
  const [showPostSteps, setShowPostSteps] = useState<boolean>(() => !animate);
  const [isSkipped, setIsSkipped] = useState<boolean>(() => !animate);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Trigger onComplete when all cards are shown
  useEffect(() => {
    if (showPostSteps) {
      onCompleteRef.current?.();
    }
  }, [showPostSteps]);

  // Phase 1: Word-by-Word streaming for Immediate Priority / Intro (calm ~38ms cadence)
  useEffect(() => {
    if (!animate || isSkipped || priorityWords.length === 0) {
      setRevealedWords(9999);
      return;
    }

    let wordIdx = 0;
    const wordInterval = setInterval(() => {
      wordIdx++;
      setRevealedWords(wordIdx);
      if (wordIdx >= priorityWords.length) {
        clearInterval(wordInterval);
      }
    }, 38);

    return () => clearInterval(wordInterval);
  }, [animate, isSkipped, priorityWords.length]);

  // Phase 2: Card-wise generation with 1.5-second break between each step card
  useEffect(() => {
    if (!animate || isSkipped) {
      setVisibleStepCount(totalSteps);
      setShowPostSteps(true);
      return;
    }

    // Wait until priority words are streamed (or if none, start immediately)
    const introDelay = priorityWords.length > 0 ? Math.min(1800, priorityWords.length * 38 + 250) : 100;

    const startTimer = setTimeout(() => {
      if (totalSteps === 0) {
        setShowPostSteps(true);
        return;
      }

      // Step 1 appears immediately
      setVisibleStepCount(1);

      // Remaining steps appear one by one with a 1.5-second (1500ms) pause
      let currentStep = 1;
      const stepInterval = setInterval(() => {
        currentStep++;
        setVisibleStepCount(currentStep);

        if (currentStep >= totalSteps) {
          clearInterval(stepInterval);
          // Wait 600ms after last card before revealing contraindications and triggering completion
          setTimeout(() => {
            setShowPostSteps(true);
          }, 600);
        }
      }, 1500); // EXACT 1.5-SECOND BREAK PER USER SPECIFICATION

      return () => clearInterval(stepInterval);
    }, introDelay);

    return () => clearTimeout(startTimer);
  }, [animate, isSkipped, totalSteps, priorityWords.length]);

  const handleSkipAnimation = () => {
    setIsSkipped(true);
    setRevealedWords(9999);
    setVisibleStepCount(totalSteps);
    setShowPostSteps(true);
    onCompleteRef.current?.();
  };

  if (!text) return null;

  let currentStepRenderIndex = 0;

  return (
    <div className={`space-y-4 text-ink leading-relaxed ${className}`}>
      {/* Rescuer fast-forward toggle if animation is running */}
      {animate && !showPostSteps && (
        <div className="flex items-center justify-between py-1 px-1">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-primary font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-accent" />
            <span>Paced Step Guide • 1.5s Interval</span>
          </div>
          <button
            onClick={handleSkipAnimation}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-base hover:bg-border/60 text-ink text-[11px] font-bold border border-border/80 cursor-pointer transition-all shadow-2xs"
            title="Show all cards immediately"
          >
            <FastForward className="w-3 h-3 text-accent" />
            <span>Show All Steps</span>
          </button>
        </div>
      )}

      {blocks.map((block, index) => {
        // --- 1. INTRO / REASSURANCE ---
        if (block.type === 'intro') {
          const words = block.content.split(/\s+/).filter(Boolean);
          const visibleIntroText = isSkipped || !animate 
            ? block.content 
            : words.slice(0, revealedWords).join(' ');

          return (
            <div
              key={index}
              className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500/40 text-[#064E3B] dark:!text-emerald-100 flex items-start space-x-3 shadow-xs animate-in fade-in duration-300"
              style={{ color: '#064E3B' }}
            >
              <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="currentColor" fillOpacity={0.25} />
              <div className="leading-relaxed font-semibold text-sm sm:text-base text-[#064E3B] dark:!text-emerald-100" style={{ color: '#064E3B' }}>
                {renderInlineMarkdown(visibleIntroText)}
                {animate && !isSkipped && revealedWords < words.length && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-600 animate-pulse align-middle" />
                )}
              </div>
            </div>
          );
        }

        // --- 2. IMMEDIATE PRIORITY CARD (FIRST 10 SECONDS) ---
        if (block.type === 'immediate_action') {
          const words = block.content.split(/\s+/).filter(Boolean);
          const visiblePriorityText = isSkipped || !animate 
            ? block.content 
            : words.slice(0, revealedWords).join(' ');

          return (
            <div
              key={index}
              className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/90 border-2 border-amber-500/80 text-[#451A03] dark:!text-amber-100 space-y-2.5 shadow-sm animate-in fade-in duration-300"
              style={{ color: '#451A03' }}
            >
              <div className="flex items-center space-x-2 text-xs font-black text-amber-900 dark:!text-amber-300 uppercase tracking-wider">
                <div className="p-1 rounded-lg bg-amber-500 text-white shadow-xs">
                  <Zap className="w-4 h-4" fill="currentColor" />
                </div>
                <span className="font-extrabold tracking-wide">⚡ {block.title || 'Immediate Priority (First 10 Seconds)'}</span>
              </div>
              <div 
                className="text-sm sm:text-base font-bold text-[#451A03] dark:!text-amber-100 leading-relaxed pl-7"
                style={{ color: '#451A03' }}
              >
                {renderInlineMarkdown(visiblePriorityText)}
                {animate && !isSkipped && revealedWords < words.length && (
                  <span className="inline-block w-2 h-4 ml-1 bg-amber-600 animate-pulse align-middle" />
                )}
              </div>
            </div>
          );
        }

        // --- 3. NUMBERED STEP CARD (APPEARS 1-BY-1 WITH 1.5S PAUSE) ---
        if (block.type === 'step') {
          currentStepRenderIndex++;
          const isCardVisible = !animate || isSkipped || currentStepRenderIndex <= visibleStepCount;

          if (!isCardVisible) return null;

          return (
            <div
              key={index}
              className="flex items-start space-x-3.5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#13221C] border-2 border-[#DCE3E1] dark:border-[#223830] text-[#0F172A] dark:!text-slate-100 shadow-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-primary/50"
              style={{ color: '#0F172A' }}
            >
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white text-xs sm:text-sm font-black font-mono shadow-xs">
                {block.stepNumber || currentStepRenderIndex}
              </span>
              <div className="text-sm sm:text-base leading-relaxed space-y-1">
                {block.title && (
                  <span className="font-black text-[#0E5A50] dark:!text-emerald-400 mr-2 text-[14px] sm:text-[15px] block sm:inline" style={{ color: '#0E5A50' }}>
                    {renderInlineMarkdown(block.title)}:
                  </span>
                )}
                <span className="text-[#1E293B] dark:!text-slate-200 font-medium" style={{ color: '#1E293B' }}>
                  {renderInlineMarkdown(block.content)}
                </span>
              </div>
            </div>
          );
        }

        // Post-step blocks only appear after all step cards are revealed
        if (!showPostSteps && !isSkipped && animate) {
          return null;
        }

        // --- 4. WHAT NOT TO DO CARD (CONTRAINDICATIONS) ---
        if (block.type === 'what_not_to_do') {
          return (
            <div
              key={index}
              className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500/40 text-[#881337] dark:!text-rose-100 space-y-2.5 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-400"
              style={{ color: '#881337' }}
            >
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>⚠️ {block.title || 'What NOT to Do (Critical Contraindications)'}</span>
              </div>
              {block.content && (
                <p className="text-sm leading-relaxed text-[#4C0519] dark:!text-rose-100 font-bold pl-6" style={{ color: '#4C0519' }}>
                  {renderInlineMarkdown(block.content)}
                </p>
              )}
              {block.bullets && block.bullets.length > 0 && (
                <ul className="space-y-2 pl-6 text-xs sm:text-sm text-[#4C0519] dark:!text-rose-100" style={{ color: '#4C0519' }}>
                  {block.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start space-x-2">
                      <span className="text-rose-600 font-extrabold text-base leading-none">•</span>
                      <span className="font-semibold">{renderInlineMarkdown(b)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }

        // --- 5. CALL 112 / EMERGENCY ALERT CARD ---
        if (block.type === 'call_112') {
          return (
            <div
              key={index}
              className="p-5 sm:p-6 rounded-2xl bg-red-50 dark:bg-red-950/80 border-2 border-red-500 text-[#450A0A] dark:!text-red-100 space-y-3.5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-400"
              style={{ color: '#450A0A' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 font-black text-xs sm:text-sm">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <span>{block.title || 'Call 112 or Seek Immediate Help If:'}</span>
                </div>

                {onTriggerEscalation && (
                  <button
                    onClick={() => onTriggerEscalation('AI Emergency Red Flags Triggered')}
                    className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow-md hover:bg-red-700 btn-press animate-pulse cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 112 Emergency</span>
                  </button>
                )}
              </div>

              {block.bullets && block.bullets.length > 0 && (
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#450A0A] dark:!text-red-100" style={{ color: '#450A0A' }}>
                  {block.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start space-x-2">
                      <span className="text-red-600 font-black mt-0.5">•</span>
                      <span className="font-bold">{renderInlineMarkdown(b)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {block.content && (
                <p className="text-xs sm:text-sm leading-relaxed text-[#450A0A] dark:!text-red-100 font-bold" style={{ color: '#450A0A' }}>
                  {renderInlineMarkdown(block.content)}
                </p>
              )}
            </div>
          );
        }

        // --- 6. SECTION HEADING ---
        if (block.type === 'heading') {
          return (
            <div key={index} className="pt-2 text-xs font-black uppercase tracking-wider text-[#0E5A50] dark:!text-emerald-400 flex items-center space-x-1.5" style={{ color: '#0E5A50' }}>
              <span>{renderInlineMarkdown(block.content)}</span>
            </div>
          );
        }

        // --- 7. REGULAR BULLETS ---
        if (block.type === 'bullet') {
          return (
            <ul key={index} className="space-y-1.5 pl-2 text-xs sm:text-sm text-[#0F172A] dark:!text-slate-100" style={{ color: '#0F172A' }}>
              {block.bullets?.map((b, bIdx) => (
                <li key={bIdx} className="flex items-start space-x-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="font-semibold">{renderInlineMarkdown(b)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // --- 8. GENERAL PARAGRAPH ---
        return (
          <p key={index} className="text-xs sm:text-sm leading-relaxed text-[#1E293B] dark:!text-slate-200 font-medium" style={{ color: '#1E293B' }}>
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
};
