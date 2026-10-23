import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Target, 
  Award, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Lock,
  HeartPulse,
  Flame,
  Droplet,
  ShieldAlert,
  Zap,
  Check,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  Radio
} from 'lucide-react';
import { ScenarioQuiz } from '../../types';
import { SCENARIO_QUIZZES, MYTH_BUSTER_QUESTIONS, BADGE_TIERS } from '../../data/practiceData';
import { audioEngine } from '../../utils/audio';
import { generateScenarioQuiz } from '../../services/aiService';
import { userService, UserStats } from '../../services/userService';
import { Tilt3D } from '../common/Tilt3D';

const CATEGORIES = [
  'All',
  'Bleeding',
  'Burns',
  'Cardiac & CPR',
  'Choking',
  'Fractures & Sprains',
  'Environmental',
  'Neurological'
];

const DIFFICULTIES: ('Beginner' | 'Intermediate' | 'Advanced')[] = [
  'Beginner',
  'Intermediate',
  'Advanced'
];

export const PracticeView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'cpr_beat' | 'mythbusters' | 'badges'>('scenarios');
  const [userStats, setUserStats] = useState<UserStats>(() => userService.getStats());

  // Subscribe to user state changes
  useEffect(() => {
    const unsub = userService.subscribe((updated) => {
      setUserStats(updated);
    });
    return unsub;
  }, []);

  // ========================================================
  // 1. SCENARIO QUIZ STATE & AI GENERATION
  // ========================================================
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [currentScenario, setCurrentScenario] = useState<ScenarioQuiz>(SCENARIO_QUIZZES[0]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [xpAwardToast, setXpAwardToast] = useState<{ amount: number; message: string } | null>(null);

  // Trigger AI Generation for a fresh scenario
  const handleGenerateAiScenario = async () => {
    setIsGeneratingAi(true);
    setSelectedOptionIndex(null);
    setScenarioSubmitted(false);
    try {
      const generated = await generateScenarioQuiz(selectedCategory, selectedDifficulty);
      setCurrentScenario(generated);
    } catch (err) {
      console.warn('AI scenario generation error, falling back', err);
      const fallback = SCENARIO_QUIZZES[Math.floor(Math.random() * SCENARIO_QUIZZES.length)];
      setCurrentScenario(fallback);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (scenarioSubmitted) return;
    setSelectedOptionIndex(idx);
  };

  const handleSubmitScenario = () => {
    if (selectedOptionIndex === null || scenarioSubmitted) return;
    setScenarioSubmitted(true);
    const chosen = currentScenario.options[selectedOptionIndex];

    if (chosen.isCorrect) {
      const earnedXp = 25;
      userService.recordQuizCompletion(currentScenario.id, true, earnedXp);
      setXpAwardToast({ amount: earnedXp, message: 'Decision Verified! +25 XP' });
      audioEngine.speak('Excellent decision. That is the safe medical action.');
    } else {
      userService.recordQuizCompletion(currentScenario.id, false, 0);
      setXpAwardToast({ amount: 5, message: 'Learning Opportunity! +5 XP' });
      audioEngine.speak('Caution. Review why this action could be dangerous.');
    }

    setTimeout(() => {
      setXpAwardToast(null);
    }, 3500);
  };

  const handleNextScenario = () => {
    setSelectedOptionIndex(null);
    setScenarioSubmitted(false);
    // If user wants next, generate another or pick from offline pool
    const currentIndex = SCENARIO_QUIZZES.findIndex(s => s.id === currentScenario.id);
    if (currentIndex >= 0 && currentIndex < SCENARIO_QUIZZES.length - 1) {
      setCurrentScenario(SCENARIO_QUIZZES[currentIndex + 1]);
    } else {
      handleGenerateAiScenario();
    }
  };

  // ========================================================
  // 2. INTERACTIVE CPR BEAT TRAINER (Tap-to-the-beat)
  // ========================================================
  const [cprActive, setCprActive] = useState(false);
  const [cprSecondsLeft, setCprSecondsLeft] = useState(25);
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [currentBpmRate, setCurrentBpmRate] = useState<number>(0);
  const [tapFeedback, setTapFeedback] = useState<'PERFECT' | 'TOO FAST' | 'TOO SLOW' | 'START TAPPING'>('START TAPPING');
  const [successfulTaps, setSuccessfulTaps] = useState<number>(0);
  const [totalTaps, setTotalTaps] = useState<number>(0);
  const [cprFinishedSummary, setCprFinishedSummary] = useState<{ accuracy: number; totalPushes: number } | null>(null);
    const cprIntervalRef = useRef<any>(null);

  const startCprDrill = () => {
    setCprActive(true);
    setCprSecondsLeft(25);
    setLastTapTime(null);
    setCurrentBpmRate(0);
    setSuccessfulTaps(0);
    setTotalTaps(0);
    setCprFinishedSummary(null);
    setTapFeedback('START TAPPING');

    audioEngine.startMetronome(110);

    cprIntervalRef.current = setInterval(() => {
      setCprSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cprIntervalRef.current);
          finishCprDrill();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishCprDrill = () => {
    setCprActive(false);
    audioEngine.stopMetronome();
    if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);

    setTotalTaps((currentTotal) => {
      setSuccessfulTaps((currentGood) => {
        const accuracy = currentTotal > 0 ? Math.min(100, Math.round((currentGood / currentTotal) * 100)) : 88;
        setCprFinishedSummary({ accuracy, totalPushes: currentTotal });
        userService.recordDrillCompletion(accuracy, 35);
        setXpAwardToast({ amount: 35, message: `CPR Rhythm Mastered! Accuracy: ${accuracy}%` });
        setTimeout(() => setXpAwardToast(null), 3500);
        return currentGood;
      });
      return currentTotal;
    });
  };

  const handleUserCprTap = () => {
    if (!cprActive) {
      startCprDrill();
      return;
    }

    const now = Date.now();
    setTotalTaps((prev) => prev + 1);

    if (lastTapTime !== null) {
      const deltaMs = now - lastTapTime;
      const bpm = Math.round(60000 / deltaMs);
      setCurrentBpmRate(bpm);

      // Target is 100 - 120 BPM (delta 500ms to 600ms)
      if (bpm >= 98 && bpm <= 122) {
        setTapFeedback('PERFECT');
        setSuccessfulTaps((prev) => prev + 1);
      } else if (bpm > 122) {
        setTapFeedback('TOO FAST');
      } else {
        setTapFeedback('TOO SLOW');
      }
    }
    setLastTapTime(now);
  };

  useEffect(() => {
    return () => {
      if (cprIntervalRef.current) clearInterval(cprIntervalRef.current);
      audioEngine.stopMetronome();
    };
  }, []);

  // Keyboard Spacebar listener for CPR drill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'cpr_beat' && e.code === 'Space') {
        e.preventDefault();
        handleUserCprTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, cprActive, lastTapTime]);

  // ========================================================
  // 3. MYTH-BUSTER QUICK FIRE STATE
  // ========================================================
  const [mythIndex, setMythIndex] = useState(0);
  const [mythAnswered, setMythAnswered] = useState<boolean>(false);
  const [userMythChoice, setUserMythChoice] = useState<boolean | null>(null);

  const currentMyth = MYTH_BUSTER_QUESTIONS[mythIndex];

  const handleAnswerMyth = (isTrueChoice: boolean) => {
    if (mythAnswered) return;
    setUserMythChoice(isTrueChoice);
    setMythAnswered(true);

    const isCorrect = isTrueChoice === currentMyth.isTrue;
    if (isCorrect) {
      userService.recordMythBusterSolved(15);
      setXpAwardToast({ amount: 15, message: 'Myth Busted! +15 XP' });
      audioEngine.speak('Correct. This harmful myth is now debunked.');
    } else {
      setXpAwardToast({ amount: 5, message: 'Review the medical fact! +5 XP' });
      audioEngine.speak('Actually, that is a common myth. Review the explanation.');
    }
    setTimeout(() => setXpAwardToast(null), 3000);
  };

  const handleNextMyth = () => {
    setMythAnswered(false);
    setUserMythChoice(null);
    setMythIndex((prev) => (prev + 1) % MYTH_BUSTER_QUESTIONS.length);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Floating XP Award Toast */}
      {xpAwardToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-bounce flex items-center space-x-2 bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/30">
          <Award className="w-5 h-5" />
          <span className="text-xs sm:text-sm">{xpAwardToast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">
              First-Aid Practice Arena
            </h1>
            <span className="inline-flex items-center text-xs font-bold text-ink bg-accent/20 px-2.5 py-0.5 rounded-full border border-accent/30">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
              Gemma 4 31B AI Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Infinite dynamic scenarios, interactive CPR cadence checks, and common myth busters to build life-saving reflexes.
          </p>
        </div>

        {/* Readiness Meter & XP Capsule */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="p-2.5 rounded-2xl bg-surface border border-border flex items-center space-x-2.5 sm:space-x-3 shadow-xs">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-ink-muted block truncate">Readiness Index</span>
              <span className="text-xs sm:text-sm font-bold text-ink block truncate">{userStats.readinessScore}% Certified</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-accent/15 border border-accent/30 flex items-center space-x-2.5 sm:space-x-3 shadow-xs">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-accent/30 text-ink flex items-center justify-center font-bold text-sm shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-ink-muted block truncate">Earned XP</span>
              <span className="text-xs sm:text-sm font-bold text-ink block truncate">{userStats.xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-surface border border-border shadow-xs">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl text-xs font-bold btn-press transition-all ${
            activeTab === 'scenarios'
              ? 'bg-primary text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-base'
          }`}
        >
          <BrainCircuit className="h-4 w-4 shrink-0" />
          <span className="truncate">AI Scenarios</span>
        </button>

        <button
          onClick={() => setActiveTab('cpr_beat')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl text-xs font-bold btn-press transition-all ${
            activeTab === 'cpr_beat'
              ? 'bg-primary text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-base'
          }`}
        >
          <HeartPulse className="h-4 w-4 shrink-0" />
          <span className="truncate">110 BPM CPR</span>
        </button>

        <button
          onClick={() => setActiveTab('mythbusters')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl text-xs font-bold btn-press transition-all ${
            activeTab === 'mythbusters'
              ? 'bg-primary text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-base'
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">Myth Busters</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-xl text-xs font-bold btn-press transition-all ${
            activeTab === 'badges'
              ? 'bg-primary text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-base'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          <span className="truncate">Badges ({userStats.drillsCompleted})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DYNAMIC AI SCENARIO ARENA */}
      {/* ======================================================== */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Category Filters + Difficulty + AI Generator Trigger */}
          <div className="p-4 rounded-3xl bg-surface border border-border shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Difficulty Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-ink-muted flex items-center">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                  Level:
                </span>
                <div className="inline-flex p-1 rounded-xl bg-base border border-border text-xs">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate AI Button */}
              <button
                onClick={handleGenerateAiScenario}
                disabled={isGeneratingAi}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-[#E08A35] text-ink font-bold text-xs shadow-xs hover:brightness-105 disabled:opacity-50 btn-press"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-ink" />
                    <span>Gemma 4 31B Generating Scenario...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-ink" />
                    <span>Generate Fresh AI Dilemma</span>
                  </>
                )}
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all font-semibold ${
                    selectedCategory === cat
                      ? 'bg-ink text-surface border-ink'
                      : 'bg-base border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dilemma Question Card */}
          <Tilt3D maxTilt={2} scale={1.002}>
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
              
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                    {currentScenario.category || selectedCategory}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-ink">
                    {currentScenario.difficulty || selectedDifficulty}
                  </span>
                  {currentScenario.isAiGenerated && (
                    <span className="inline-flex items-center text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      <Sparkles className="w-3 h-3 mr-1 text-accent" />
                      Live AI Generated
                    </span>
                  )}
                </div>

                {userStats.completedScenarioIds.includes(currentScenario.id) && (
                  <span className="inline-flex items-center text-xs font-semibold text-success bg-success/15 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Solved
                  </span>
                )}
              </div>

              {/* Title & Realistic Emergency Situation */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  {currentScenario.title}
                </h2>

                <div className="p-4 sm:p-5 rounded-2xl bg-base border border-border/80 text-sm text-ink leading-relaxed">
                  <div className="text-xs font-bold text-primary mb-1 flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-alert animate-pulse" />
                    <span>EMERGENCY SCENARIO</span>
                  </div>
                  {currentScenario.situation}
                </div>

                <h3 className="text-base font-bold text-ink pt-1 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-accent" />
                  <span>{currentScenario.question}</span>
                </h3>
              </div>

              {/* 4 Interactive Answer Choices */}
              <div className="space-y-3">
                {currentScenario.options.map((opt, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  let optionStyle = 'border-border bg-surface hover:border-primary/40 text-ink';

                  if (scenarioSubmitted) {
                    if (opt.isCorrect) {
                      optionStyle = 'border-success bg-success/10 text-ink font-semibold ring-1 ring-success';
                    } else if (isSelected && !opt.isCorrect) {
                      optionStyle = 'border-alert bg-alert/10 text-ink ring-1 ring-alert';
                    } else {
                      optionStyle = 'border-border/60 bg-base/50 text-ink-muted opacity-80';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-primary bg-primary/5 text-ink ring-2 ring-primary/30';
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer btn-press space-y-2 ${optionStyle}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          scenarioSubmitted && opt.isCorrect
                            ? 'bg-success text-white'
                            : scenarioSubmitted && isSelected && !opt.isCorrect
                            ? 'bg-alert text-white'
                            : isSelected
                            ? 'bg-primary text-white'
                            : 'bg-base text-ink-muted border border-border'
                        }`}>
                          {scenarioSubmitted && opt.isCorrect ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : scenarioSubmitted && isSelected && !opt.isCorrect ? (
                            <X className="w-4 h-4 stroke-[3]" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed pt-0.5">{opt.text}</span>
                      </div>

                      {/* Explanation displayed when submitted */}
                      {scenarioSubmitted && (
                        <div className={`mt-2 pt-2 border-t text-xs leading-relaxed ${
                          opt.isCorrect ? 'border-success/30 text-success font-medium' : 'border-alert/30 text-alert'
                        }`}>
                          <span className="font-bold">{opt.isCorrect ? 'Why this saves lives: ' : 'Why this is dangerous: '}</span>
                          {opt.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Key Principle & Myth Buster Banner upon Submit */}
              {scenarioSubmitted && (
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                      <Lightbulb className="w-4 h-4" />
                      <span>Golden First-Aid Principle</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink font-medium">
                      {currentScenario.principleLearned}
                    </p>
                  </div>

                  {currentScenario.mythBuster && (
                    <div className="p-4 rounded-2xl bg-accent/15 border border-accent/35 space-y-1">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-ink uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-accent" />
                        <span>Folk Myth Debunked</span>
                      </div>
                      <p className="text-xs sm:text-sm text-ink-muted italic">
                        {currentScenario.mythBuster}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                {!scenarioSubmitted ? (
                  <button
                    onClick={handleSubmitScenario}
                    disabled={selectedOptionIndex === null}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-3 px-8 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark disabled:opacity-50 btn-press"
                  >
                    <span>Check First-Aid Decision</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      onClick={handleGenerateAiScenario}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-surface border border-border text-ink text-xs font-bold hover:bg-base btn-press"
                    >
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>Another AI Scenario</span>
                    </button>

                    <button
                      onClick={handleNextScenario}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-3 px-8 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark btn-press"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </Tilt3D>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 110 BPM CPR RHYTHM TRAINER */}
      {/* ======================================================== */}
      {activeTab === 'cpr_beat' && (
        <div className="space-y-6">
          <Tilt3D maxTilt={2} scale={1.002}>
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-accent uppercase">
                    <HeartPulse className="w-4 h-4" />
                    <span>Real-Time Cadence Monitor</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink">
                    Interactive 110 BPM CPR Rhythm Check
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Tap the pulse circle or hit the <kbd className="px-2 py-0.5 bg-base border border-border rounded text-[10px] font-mono">Spacebar</kbd> in rhythm with the beat of "Stayin' Alive" (100–120 BPM).
                  </p>
                </div>
              </div>

              {/* The Central Interactive Tap Arena */}
              <div className="flex flex-col items-center justify-center py-8 space-y-6 bg-base/50 rounded-3xl border border-border/80">
                
                {/* Cadence Telemetry Badge */}
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                    tapFeedback === 'PERFECT'
                      ? 'bg-success/20 text-success border border-success/40 animate-pulse'
                      : tapFeedback === 'TOO FAST'
                      ? 'bg-alert/20 text-alert border border-alert/40'
                      : tapFeedback === 'TOO SLOW'
                      ? 'bg-accent/30 text-ink border border-accent/40'
                      : 'bg-surface text-ink-muted border border-border'
                  }`}>
                    <Activity className="w-3.5 h-3.5" />
                    <span>{tapFeedback} {currentBpmRate > 0 ? `(${currentBpmRate} BPM)` : ''}</span>
                  </div>

                  {cprActive && (
                    <span className="text-xs font-bold text-ink bg-surface px-3 py-1.5 rounded-full border border-border">
                      ⏱ {cprSecondsLeft}s Left
                    </span>
                  )}
                </div>

                {/* The Big Pulse Button */}
                <button
                  onClick={handleUserCprTap}
                  className={`relative h-44 w-44 sm:h-52 sm:w-52 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 shadow-2xl focus:outline-none ${
                    cprActive
                      ? 'bg-gradient-to-tr from-alert via-[#E0533C] to-accent ring-8 ring-alert/20 cursor-pointer'
                      : 'bg-gradient-to-tr from-primary to-[#0E5A50] ring-4 ring-primary/20 cursor-pointer hover:scale-105'
                  }`}
                  aria-label="Tap to compress"
                >
                  <HeartPulse className={`w-14 h-14 sm:w-16 sm:h-16 ${cprActive ? 'animate-bounce' : ''}`} />
                  <span className="font-bold text-sm sm:text-base mt-2 tracking-wide uppercase">
                    {cprActive ? 'PUSH HARD' : 'TAP TO START'}
                  </span>
                  <span className="text-[11px] text-white/80 font-medium">
                    {cprActive ? 'Keep 110 BPM' : 'or Press Spacebar'}
                  </span>
                </button>

                {/* Score & Pushes counter */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center">
                  <div className="p-3 rounded-2xl bg-surface border border-border">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">Chest Pushes</span>
                    <span className="text-xl font-bold text-ink">{totalTaps}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface border border-border">
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">Best Rhythm Accuracy</span>
                    <span className="text-xl font-bold text-primary">{userStats.cprBestAccuracy}%</span>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center space-x-3">
                  {!cprActive ? (
                    <button
                      onClick={startCprDrill}
                      className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark btn-press flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4 text-accent" />
                      <span>Begin 25-Second Drill</span>
                    </button>
                  ) : (
                    <button
                      onClick={finishCprDrill}
                      className="px-6 py-3 rounded-xl bg-alert text-white text-xs font-bold shadow-xs hover:bg-alert/90 btn-press flex items-center space-x-2"
                    >
                      <span>Stop Metronome Early</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Finished Summary Box */}
              {cprFinishedSummary && (
                <div className="p-5 rounded-2xl bg-success/15 border border-success/35 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-ink">
                        CPR Cadence Drill Completed!
                      </h4>
                      <p className="text-xs text-ink-muted">
                        Recorded {cprFinishedSummary.totalPushes} compressions with {cprFinishedSummary.accuracy}% steady tempo match.
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl shadow-xs font-bold text-xs text-success">
                    <Award className="w-4 h-4 text-accent" />
                    <span>+35 XP Awarded</span>
                  </div>
                </div>
              )}

            </div>
          </Tilt3D>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MYTH-BUSTER QUICK FIRE */}
      {/* ======================================================== */}
      {activeTab === 'mythbusters' && (
        <div className="space-y-6">
          <Tilt3D maxTilt={2} scale={1.002}>
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    Folk Myth vs Medical Fact
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink">
                    Dangerous First-Aid Misconceptions
                  </h2>
                </div>
                <span className="text-xs font-bold text-ink-muted bg-base px-3 py-1.5 rounded-xl border border-border">
                  {mythIndex + 1} of {MYTH_BUSTER_QUESTIONS.length}
                </span>
              </div>

              {/* The Myth Statement Card */}
              <div className="p-6 rounded-3xl bg-base border border-border space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/20 text-ink">
                  Claim Under Review
                </span>
                <p className="text-base sm:text-lg font-bold text-ink leading-relaxed">
                  "{currentMyth.myth}"
                </p>
                <span className="text-xs text-ink-muted block">
                  Is this scientifically safe medical practice or a dangerous folk misconception?
                </span>
              </div>

              {/* True / False Decision Buttons */}
              {!mythAnswered ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswerMyth(true)}
                    className="py-4 px-6 rounded-2xl bg-surface border-2 border-border hover:border-success/60 text-ink font-bold text-sm flex items-center justify-center space-x-2 btn-press"
                  >
                    <Check className="w-5 h-5 text-success" />
                    <span>Safe & True</span>
                  </button>

                  <button
                    onClick={() => handleAnswerMyth(false)}
                    className="py-4 px-6 rounded-2xl bg-surface border-2 border-border hover:border-alert/60 text-ink font-bold text-sm flex items-center justify-center space-x-2 btn-press"
                  >
                    <X className="w-5 h-5 text-alert" />
                    <span>Harmful Myth</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className={`p-5 rounded-2xl border ${
                    userMythChoice === currentMyth.isTrue
                      ? 'bg-success/15 border-success/35 text-ink'
                      : 'bg-alert/15 border-alert/35 text-ink'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold text-sm mb-2">
                      {userMythChoice === currentMyth.isTrue ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span>Correctly Identified!</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-5 h-5 text-alert" />
                          <span>Common Misconception Trap!</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed">
                      {currentMyth.explanation}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNextMyth}
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark btn-press"
                    >
                      <span>Next Myth</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </Tilt3D>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MY BADGES & VERIFIED PROGRESS */}
      {/* ======================================================== */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Certified Guardian Progression
                </span>
                <h2 className="text-2xl font-bold text-ink">
                  Rank: Level {userStats.level} Cadet
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Master CPR tempo, scenario dilemmas, and verified first-aid knowledge to earn higher responder tiers.
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-base px-4 py-3 rounded-2xl border border-border">
                <Award className="h-8 w-8 text-accent" />
                <div>
                  <span className="text-xs font-bold text-ink block">
                    {userStats.completedScenarioIds.length} Scenarios Solved
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {userStats.drillsCompleted} CPR Drills • {userStats.mythBustersSolved} Myths Busted
                  </span>
                </div>
              </div>
            </div>

            {/* Badge Ladder */}
            <div className="space-y-4">
              {BADGE_TIERS.map((tier, idx) => {
                const isEarned = (idx === 0) || 
                  (idx === 1 && userStats.completedScenarioIds.length >= 2) ||
                  (idx === 2 && userStats.drillsCompleted >= 1 && userStats.completedScenarioIds.length >= 4) ||
                  (idx === 3 && userStats.xp >= 400);

                return (
                  <div
                    key={tier.level}
                    className={`p-5 rounded-2xl border transition-all flex items-start space-x-4 ${
                      isEarned
                        ? 'border-primary/40 bg-surface shadow-xs ring-1 ring-primary/10'
                        : 'border-border/60 bg-base opacity-75'
                    }`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${
                      isEarned 
                        ? 'bg-gradient-to-tr from-accent to-[#E08A35] text-ink shadow-xs' 
                        : 'bg-border text-ink-muted'
                    }`}>
                      {isEarned ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-ink">{tier.level}</h4>
                        {isEarned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/20 text-success">
                            Verified Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {tier.desc}
                      </p>
                      <span className="inline-block text-[11px] font-semibold text-primary/80 pt-1">
                        Requirement: {tier.req}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
