import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileText,
  Flame,
  Gem,
  Heart,
  RotateCcw,
  Turtle,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  generate50PhasesChallenges,
  getMultilingualGlossForEnglish,
  groupChallengesByPhase,
} from '../data/cefrChallenges';
import { LANGUAGES, getLanguageByCode } from '../data/languages';
import {
  isSoundEffectsEnabled,
  playFeedbackTone,
  setSoundEffectsEnabled,
  speakNativePhrase,
} from '../lib/audio';
import type {
  CEFRLevel,
  LanguageProgressData,
  UserProfile,
} from '../types/piryas';
import { AICommunicationCoach } from './AICommunicationCoach';

export type ChallengeSubMode = 'phases' | 'flashcards' | 'grammar' | 'coach';

interface ChallengesHubProps {
  profile: UserProfile;
  initialSubMode: ChallengeSubMode;
  progressMap: Record<string, LanguageProgressData>;
  hearts: number;
  forcedOffline: boolean;
  onSavePair: (knownCode: string, targetCode: string) => void;
  onSwapLanguages: () => void;
  onOpenSubscriptionTab: () => void;
  onOpenPlusModal: () => void;
  onCardMastered: (langCode: string, cardId: string, xpEarned: number) => void;
  onGrammarCompleted: (langCode: string, grammarId: string, xpEarned: number) => void;
}

const CEFR_FILTERS: ('ALL' | CEFRLevel)[] = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const ChallengesHub: React.FC<ChallengesHubProps> = ({
  profile,
  initialSubMode,
  progressMap,
  hearts,
  forcedOffline,
  onSavePair,
  onSwapLanguages,
  onOpenSubscriptionTab,
  onOpenPlusModal,
  onCardMastered,
  onGrammarCompleted,
}) => {
  const [subMode, setSubMode] = useState<ChallengeSubMode>(initialSubMode);
  const [sfxEnabled, setSfxEnabled] = useState(() => isSoundEffectsEnabled());
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);

  // 50 Phases x 10 Questions state
  const [cefrFilter, setCefrFilter] = useState<'ALL' | CEFRLevel>('ALL');
  const [directionMode, setDirectionMode] = useState<'mixed' | 'known_to_target' | 'target_to_known'>('mixed');
  const [selectedPhaseNum, setSelectedPhaseNum] = useState<number>(1);
  const [qIndexInPhase, setQIndexInPhase] = useState<number>(0); // 0..9
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [phaseCompletedBanner, setPhaseCompletedBanner] = useState(false);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Grammar state
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [selectedGrammarOption, setSelectedGrammarOption] = useState<string | null>(null);
  const [builtTokens, setBuiltTokens] = useState<string[]>([]);
  const [grammarFeedback, setGrammarFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const [sessionXp, setSessionXp] = useState(0);

  useEffect(() => {
    setSubMode(initialSubMode);
  }, [initialSubMode]);

  const course = useMemo(
    () => getLanguageByCode(profile.activeLanguage),
    [profile.activeLanguage]
  );

  const knownCourse = useMemo(
    () => getLanguageByCode(profile.knownLanguage || 'hi'),
    [profile.knownLanguage]
  );

  const langProgress = progressMap[course.code] || {
    uid: 'local',
    langCode: course.code,
    xp: 0,
    masteredCards: [],
    completedGrammar: [],
  };

  const completedSet = useMemo(
    () => new Set(langProgress.completedGrammar),
    [langProgress.completedGrammar]
  );

  const all500Challenges = useMemo(
    () => generate50PhasesChallenges(course.code, knownCourse.code, directionMode),
    [course.code, knownCourse.code, directionMode]
  );

  const all50Phases = useMemo(
    () => groupChallengesByPhase(all500Challenges),
    [all500Challenges]
  );

  const visiblePhases = useMemo(() => {
    if (cefrFilter === 'ALL') return all50Phases;
    return all50Phases.filter((p) => p.level === cefrFilter);
  }, [all50Phases, cefrFilter]);

  useEffect(() => {
    if (visiblePhases.length > 0 && !visiblePhases.some((p) => p.phase === selectedPhaseNum)) {
      setSelectedPhaseNum(visiblePhases[0].phase);
      setQIndexInPhase(0);
      setSelectedOption(null);
      setChallengeFeedback(null);
      setPhaseCompletedBanner(false);
    }
  }, [visiblePhases, selectedPhaseNum]);

  useEffect(() => {
    setSelectedPhaseNum(1);
    setQIndexInPhase(0);
    setSelectedOption(null);
    setChallengeFeedback(null);
    setPhaseCompletedBanner(false);
    setCardIndex(0);
    setIsFlipped(false);
    setGrammarIndex(0);
    setSelectedGrammarOption(null);
    setBuiltTokens([]);
    setGrammarFeedback(null);
  }, [course.code]);

  const activePhaseGroup = useMemo(
    () => all50Phases.find((p) => p.phase === selectedPhaseNum) || all50Phases[0],
    [all50Phases, selectedPhaseNum]
  );

  const currentChallenge = activePhaseGroup?.questions[qIndexInPhase] || activePhaseGroup?.questions[0];

  const totalCompleted500 = useMemo(
    () => langProgress.completedGrammar.filter((id) => id.startsWith(`${course.code}-p`)).length,
    [langProgress.completedGrammar, course.code]
  );

  const isPlusActive = profile.subscriptionStatus === 'active';

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    setSoundEffectsEnabled(next);
    if (next) playFeedbackTone('tap');
  };

  const handlePlayAudio = useCallback(
    async (text: string, slow = false, langOverride?: string) => {
      const targetVoiceCourse = langOverride ? getLanguageByCode(langOverride) : course;
      setIsSpeaking(true);
      const source = await speakNativePhrase({
        text,
        bcp47: targetVoiceCourse.bcp47,
        langCode: targetVoiceCourse.code,
        languageName: targetVoiceCourse.name,
        voiceHint: targetVoiceCourse.voiceHint,
        slow,
        offlineOnly: forcedOffline,
      });
      setIsSpeaking(false);
      setAudioStatus(
        source === 'studio'
          ? 'Studio Native Audio (cached offline)'
          : source === 'cached'
            ? 'Offline Cached Native Audio'
            : `${targetVoiceCourse.name} Native Voice`
      );
    },
    [course, forcedOffline]
  );

  useEffect(() => {
    if (subMode !== 'phases' || !autoSpeakQuestion || !currentChallenge) return;
    const timer = setTimeout(() => {
      handlePlayAudio(currentChallenge.voiceText, false, currentChallenge.voiceLangCode);
    }, 180);
    return () => clearTimeout(timer);
  }, [subMode, autoSpeakQuestion, currentChallenge?.id, handlePlayAudio]);

  const handleSelectPhase = (phaseNum: number) => {
    playFeedbackTone('tap');
    setSelectedPhaseNum(phaseNum);
    setQIndexInPhase(0);
    setSelectedOption(null);
    setChallengeFeedback(null);
    setPhaseCompletedBanner(false);
  };

  const handleCheckChallenge = () => {
    if (!currentChallenge || !selectedOption) return;
    const isRight = selectedOption === currentChallenge.correctAnswer;
    setChallengeFeedback(isRight ? 'correct' : 'incorrect');
    if (isRight) {
      playFeedbackTone(currentChallenge.difficulty === 'Hard' ? 'combo' : 'correct');
      onGrammarCompleted(course.code, currentChallenge.id, currentChallenge.xpReward);
      setSessionXp((prev) => prev + currentChallenge.xpReward);
      if (qIndexInPhase === 9) {
        setPhaseCompletedBanner(true);
        playFeedbackTone('levelup');
      }
    } else {
      playFeedbackTone('incorrect');
    }
  };

  const handleNextInPhase = () => {
    playFeedbackTone('tap');
    setSelectedOption(null);
    setChallengeFeedback(null);
    if (qIndexInPhase < 9) {
      setQIndexInPhase((prev) => prev + 1);
    } else if (selectedPhaseNum < 50) {
      setSelectedPhaseNum((prev) => prev + 1);
      setQIndexInPhase(0);
      setPhaseCompletedBanner(false);
    }
  };

  // Flashcards & Grammar helpers
  const currentCard = course.flashcards[cardIndex] || course.flashcards[0];
  const currentExercise = course.grammar[grammarIndex] || course.grammar[0];
  const cardKnownTranslation = useMemo(
    () => (currentCard ? getMultilingualGlossForEnglish(currentCard.meaning, knownCourse.code) : null),
    [currentCard, knownCourse.code]
  );

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const xpReward = rating === 'easy' ? 20 : rating === 'good' ? 15 : rating === 'hard' ? 10 : 5;
    if (rating !== 'again') {
      playFeedbackTone('correct');
      onCardMastered(course.code, currentCard.id, xpReward);
    } else {
      playFeedbackTone('tap');
      onCardMastered(course.code, '', xpReward);
    }
    setSessionXp((prev) => prev + xpReward);
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % course.flashcards.length);
  };

  const availableTokens = useMemo(() => {
    if (!currentExercise || currentExercise.type !== 'sentence_builder') return [];
    const remaining = [...currentExercise.options];
    builtTokens.forEach((t) => {
      const idx = remaining.indexOf(t);
      if (idx !== -1) remaining.splice(idx, 1);
    });
    return remaining;
  }, [currentExercise, builtTokens]);

  const handleCheckGrammar = () => {
    if (!currentExercise) return;
    const userAnswer =
      currentExercise.type === 'sentence_builder'
        ? builtTokens.join(' ').trim()
        : (selectedGrammarOption || '').trim();
    if (!userAnswer) return;
    const isRight = userAnswer === currentExercise.correctAnswer;
    setGrammarFeedback(isRight ? 'correct' : 'incorrect');
    if (isRight) {
      playFeedbackTone('correct');
      onGrammarCompleted(course.code, currentExercise.id, 25);
      setSessionXp((prev) => prev + 25);
    } else {
      playFeedbackTone('incorrect');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50/75 via-slate-50 to-violet-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/25">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Compact Top Subscription Reminder (1 line, non-blocking) */}
      {!isPlusActive && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/30 border border-amber-300/80 dark:border-amber-800 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <p className="text-xs text-amber-950 dark:text-amber-100 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Ad-Free + AI Coach (₹200/mo):</strong> Remove all ads, unlock AI Communication Coach, Offline Mode & Unlimited Hearts.
            </span>
          </p>
          <button
            type="button"
            onClick={onOpenSubscriptionTab}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Go Ad-Free ₹200
          </button>
        </div>
      )}

      {/* Compact Challenge Toolbar (Known ↔ Learn + Stats + Challenge Modes) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Language Pair Quick Bridge */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Language you already know"
              value={knownCourse.code}
              onChange={(e) => {
                const k = e.target.value;
                const t = k === course.code ? LANGUAGES.find((l) => l.code !== k)?.code || course.code : course.code;
                onSavePair(k, t);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  Know: {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                playFeedbackTone('tap');
                onSwapLanguages();
              }}
              title="Swap / Reverse Known & Target languages"
              aria-label="Swap known and learning languages"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            <select
              aria-label="Language you want to learn"
              value={course.code}
              onChange={(e) => {
                const t = e.target.value;
                const k = t === knownCourse.code ? LANGUAGES.find((l) => l.code !== t)?.code || knownCourse.code : knownCourse.code;
                onSavePair(k, t);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-100"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  Learn: {l.name} ({l.nativeName})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleToggleSfx}
              title={sfxEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* Live Gamification Metrics */}
          <div className="flex items-center gap-4 text-xs sm:text-sm font-bold tabular-nums">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Daily Streak">
              <Flame className="w-4 h-4" />
              {profile.streak}
            </span>
            <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400" title="Study Gems">
              <Gem className="w-4 h-4" />
              {profile.gems}
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title="Hearts">
              <Heart className="w-4 h-4 fill-current" />
              {isPlusActive ? '∞' : hearts}
            </span>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
              {profile.xp.toLocaleString()} XP {sessionXp > 0 ? `(+${sessionXp})` : ''}
            </span>
          </div>
        </div>

        {/* Sub-mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {(
            [
              { id: 'phases', label: '50 Phases (500 Questions)' },
              { id: 'flashcards', label: 'Flashcards' },
              { id: 'grammar', label: 'Grammar Drills' },
              { id: 'coach', label: 'AI Coach' },
            ] as { id: ChallengeSubMode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                playFeedbackTone('tap');
                setSubMode(m.id);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subMode === m.id
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* SUB-MODE 1: 50 PHASES x 10 QUESTIONS WITH PICTURES & REAL-LIFE EVIDENCE */}
      {subMode === 'phases' && activePhaseGroup && currentChallenge && (
        <div className="space-y-5">
          {/* Phase Filter & 50-Phase Selector Strip */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {course.name} · 50 Phases × 10 Questions Each = 500 Visual Real-Life Challenges
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {totalCompleted500} / 500 Solved
                  </span>
                  <div className="w-40 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((totalCompleted500 / 500) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CEFR Level Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {CEFR_FILTERS.map((lvl) => {
                  const active = cefrFilter === lvl;
                  const isHard = lvl === 'C1' || lvl === 'C2';
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        playFeedbackTone('tap');
                        setCefrFilter(lvl);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? isHard
                            ? 'bg-rose-700 border-rose-700 text-white'
                            : 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'
                      }`}
                    >
                      {lvl === 'ALL' ? 'All 50 Phases' : isHard ? `${lvl} · Hard` : lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horizontal Scrollable 50-Phase Picker */}
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5">
              {visiblePhases.map((phase) => {
                const isSelected = phase.phase === selectedPhaseNum;
                const solvedCount = phase.questions.filter((q) => completedSet.has(q.id)).length;
                const isDone = solvedCount === 10;
                const isHard = phase.difficulty === 'Hard';

                return (
                  <button
                    key={phase.phase}
                    type="button"
                    onClick={() => handleSelectPhase(phase.phase)}
                    className={`min-w-[172px] max-w-[184px] text-left rounded-xl p-2.5 border transition-colors shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 ring-1 ring-blue-600/20'
                        : isDone
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={isHard ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'}>
                        Phase {phase.phase} · {phase.level}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {solvedCount}/10
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {phase.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Active Phase 10-Question Challenge Runner with Attached Pictures & Real-Life Evidence */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
            {/* Phase Header & 10-Question Stepper */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Phase {activePhaseGroup.phase} of 50 ·{' '}
                  <strong className={activePhaseGroup.difficulty === 'Hard' ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'}>
                    {activePhaseGroup.level} ({activePhaseGroup.difficulty})
                  </strong>{' '}
                  · {activePhaseGroup.title}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  {activePhaseGroup.questions.map((q, idx) => {
                    const active = idx === qIndexInPhase;
                    const solved = completedSet.has(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          playFeedbackTone('tap');
                          setQIndexInPhase(idx);
                          setSelectedOption(null);
                          setChallengeFeedback(null);
                        }}
                        title={`Question ${idx + 1} of 10`}
                        className={`h-7 min-w-[28px] px-1.5 rounded-md font-mono text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-700 text-white'
                            : solved
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'mixed', label: 'Mixed' },
                    { id: 'known_to_target', label: `${knownCourse.name} → ${course.name}` },
                    { id: 'target_to_known', label: `${course.name} → ${knownCourse.name} (Reverse)` },
                  ] as const
                ).map((dir) => (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => {
                      playFeedbackTone('tap');
                      setDirectionMode(dir.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      directionMode === dir.id
                        ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                    }`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </div>

            {phaseCompletedBanner && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Phase {activePhaseGroup.phase} Complete! You finished all 10 questions in “{activePhaseGroup.title}”.
                </p>
                {selectedPhaseNum < 50 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPhase(selectedPhaseNum + 1)}
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Start Phase {selectedPhaseNum + 1}
                  </button>
                )}
              </div>
            )}

            {/* 2-Column Visual Picture + Real-Life Evidence & Interactive Question */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Attached Picture & Real-Life Evidence */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative aspect-video">
                  <img
                    src={currentChallenge.imagePath}
                    alt={currentChallenge.imageCaption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <p className="text-[11px] text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Scene Evidence · Question {currentChallenge.questionInPhase}/10
                    </p>
                    <p className="mt-0.5 text-sm font-semibold leading-snug">
                      {currentChallenge.imageCaption}
                    </p>
                  </div>
                </div>

                {/* Real-Life Evidence Box */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 space-y-2.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Real-Life Evidence · {currentChallenge.realLifeEvidence.sourceType}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentChallenge.realLifeEvidence.contextLabel}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <strong>Field Tip: </strong>
                    {currentChallenge.realLifeEvidence.usageTip}
                  </p>
                  {challengeFeedback && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <p className="text-blue-700 dark:text-blue-400 font-semibold">
                        {course.name}: “{currentChallenge.realLifeEvidence.targetExcerpt}”
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {knownCourse.name}: “{currentChallenge.realLifeEvidence.knownExcerpt}”
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Voice Reader, Prompt & Options */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentChallenge.voiceText, false, currentChallenge.voiceLangCode)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      {isSpeaking ? 'Speaking...' : `Speak (${course.name})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentChallenge.voiceText, true, currentChallenge.voiceLangCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Turtle className="w-4 h-4" />
                      0.7x
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSpeakQuestion}
                      onChange={(e) => setAutoSpeakQuestion(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700"
                    />
                    Auto-speak
                  </label>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Question #{currentChallenge.index} of 500 · {currentChallenge.category} · +{currentChallenge.xpReward} XP
                  </p>
                  <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    {currentChallenge.promptQuestion}
                  </h2>
                  {audioStatus && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{audioStatus}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentChallenge.options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isRight = opt === currentChallenge.correctAnswer;
                    let style =
                      'border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400';
                    if (challengeFeedback) {
                      if (isRight) style = 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40';
                      else if (isSelected) style = 'border-red-500 bg-red-50/70 dark:bg-red-950/40';
                    } else if (isSelected) {
                      style = 'border-blue-700 bg-blue-50/70 dark:bg-blue-950/40';
                    }

                    return (
                      <button
                        key={`${currentChallenge.id}-opt-${idx}`}
                        type="button"
                        disabled={challengeFeedback !== null}
                        onClick={() => {
                          playFeedbackTone('tap');
                          setSelectedOption(opt);
                        }}
                        className={`p-3.5 rounded-xl border text-left text-sm font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer ${style}`}
                      >
                        <span className="font-mono text-xs text-slate-400 mr-2.5">{idx + 1}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {challengeFeedback && (
                  <div
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                      challengeFeedback === 'correct'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {challengeFeedback === 'correct' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 text-xs">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {challengeFeedback === 'correct'
                            ? `Correct! +${currentChallenge.xpReward} XP earned`
                            : `Expected answer: ${currentChallenge.correctAnswer}`}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          <strong>English Meaning:</strong> {currentChallenge.englishReference}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {currentChallenge.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={qIndexInPhase === 0 && selectedPhaseNum === 1}
                    onClick={() => {
                      playFeedbackTone('tap');
                      setSelectedOption(null);
                      setChallengeFeedback(null);
                      if (qIndexInPhase > 0) setQIndexInPhase((p) => p - 1);
                      else if (selectedPhaseNum > 1) {
                        setSelectedPhaseNum((p) => p - 1);
                        setQIndexInPhase(9);
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Previous Question
                  </button>

                  {challengeFeedback === null ? (
                    <button
                      type="button"
                      onClick={handleCheckChallenge}
                      disabled={!selectedOption}
                      className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 cursor-pointer"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextInPhase}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 cursor-pointer"
                    >
                      {qIndexInPhase < 9
                        ? `Next (Q${qIndexInPhase + 2}/10)`
                        : selectedPhaseNum < 50
                          ? `Next Phase (${selectedPhaseNum + 1}/50)`
                          : 'Finish Phase 50'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SUB-MODE 2: FLASHCARDS */}
      {subMode === 'flashcards' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Card <strong className="text-slate-900 dark:text-white tabular-nums">{cardIndex + 1}</strong> of{' '}
              {course.flashcards.length} · {currentCard.partOfSpeech}
            </span>
            <span className="tabular-nums font-mono">
              Mastered: {langProgress.masteredCards.length}/{course.flashcards.length}
            </span>
          </div>

          <div className="perspective-1000">
            <div
              onClick={() => setIsFlipped((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsFlipped((prev) => !prev);
              }}
              className={`relative w-full min-h-[340px] transition-transform duration-500 preserve-3d cursor-pointer ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {course.name} · {currentCard.partOfSpeech}
                  </span>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePlayAudio(currentCard.term, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen
                    </button>
                    <button
                      onClick={() => handlePlayAudio(currentCard.term, true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Turtle className="w-3.5 h-3.5" />
                      0.7x
                    </button>
                  </div>
                </div>
                <div className="text-center my-auto">
                  <p className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                    {currentCard.term}
                  </p>
                  {currentCard.romanization && (
                    <p className="mt-3 text-lg font-medium text-blue-700 dark:text-blue-400">
                      {currentCard.romanization}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-sm text-slate-500 dark:text-slate-400">{currentCard.ipa}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Click card to reveal meaning</p>
              </div>

              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-slate-900 border border-blue-600/40 rounded-xl p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    English Meaning {knownCourse.code !== 'en' ? `· ${knownCourse.name} Bridge` : ''}
                  </p>
                  <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {currentCard.meaning}
                  </h2>
                  {knownCourse.code !== 'en' && cardKnownTranslation && (
                    <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {knownCourse.name}: {cardKnownTranslation}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{currentCard.exampleTarget}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">“{currentCard.exampleEnglish}”</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Usage Note:</strong> {currentCard.culturalNote}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((prev) => (prev - 1 + course.flashcards.length) % course.flashcards.length);
                }}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                aria-label="Previous card"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCardIndex((prev) => (prev + 1) % course.flashcards.length);
                }}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer"
                aria-label="Next card"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 flex-1 sm:max-w-xl">
              <button onClick={() => handleRateCard('again')} className="py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer">
                Again (+5)
              </button>
              <button onClick={() => handleRateCard('hard')} className="py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer">
                Hard (+10)
              </button>
              <button onClick={() => handleRateCard('good')} className="py-2.5 px-3 rounded-lg bg-blue-700 text-white text-xs font-semibold cursor-pointer">
                Good (+15)
              </button>
              <button onClick={() => handleRateCard('easy')} className="py-2.5 px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer">
                Easy (+20)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODE 4: GRAMMAR DRILLS */}
      {subMode === 'grammar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drill {grammarIndex + 1} of {course.grammar.length} · {currentExercise.topic}
              </p>
              <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {currentExercise.prompt}
              </h2>
            </div>
            <button
              onClick={() => handlePlayAudio(currentExercise.audioSentence, false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Hear Target Audio
            </button>
          </div>

          {currentExercise.targetTemplate && (
            <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-display text-xl">
              {currentExercise.targetTemplate.replace('___', selectedGrammarOption ? `[ ${selectedGrammarOption} ]` : '_____')}
            </div>
          )}

          {currentExercise.type === 'sentence_builder' ? (
            <div className="space-y-4">
              <div className="min-h-16 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                {builtTokens.length === 0 ? (
                  <span className="text-sm text-slate-400">Click tokens below in grammatical order...</span>
                ) : (
                  builtTokens.map((token, idx) => (
                    <button
                      key={`${token}-${idx}`}
                      disabled={grammarFeedback !== null}
                      onClick={() => setBuiltTokens((prev) => prev.filter((_, i) => i !== idx))}
                      className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                    >
                      {token}
                    </button>
                  ))
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {availableTokens.map((token, idx) => (
                  <button
                    key={`${token}-avail-${idx}`}
                    disabled={grammarFeedback !== null}
                    onClick={() => setBuiltTokens((prev) => [...prev, token])}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium cursor-pointer"
                  >
                    {token}
                  </button>
                ))}
                {builtTokens.length > 0 && grammarFeedback === null && (
                  <button onClick={() => setBuiltTokens([])} className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-500 cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentExercise.options.map((option) => {
                const isSelected = selectedGrammarOption === option;
                const isAnswer = option === currentExercise.correctAnswer;
                let style = 'border-slate-200 dark:border-slate-700 hover:border-blue-500';
                if (grammarFeedback) {
                  if (isAnswer) style = 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40';
                  else if (isSelected) style = 'border-red-500 bg-red-50/70 dark:bg-red-950/40';
                } else if (isSelected) {
                  style = 'border-blue-700 bg-blue-50/70 dark:bg-blue-950/40';
                }
                return (
                  <button
                    key={option}
                    disabled={grammarFeedback !== null}
                    onClick={() => setSelectedGrammarOption(option)}
                    className={`p-4 rounded-xl border text-left text-sm font-semibold cursor-pointer ${style}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {grammarFeedback && (
            <div className={`p-4 rounded-xl border ${grammarFeedback === 'correct' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' : 'bg-red-50 dark:bg-red-950/40 border-red-200'}`}>
              <p className="text-sm font-semibold">{grammarFeedback === 'correct' ? 'Accurate! +25 XP earned' : `Correct: ${currentExercise.correctAnswer}`}</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{currentExercise.explanation}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedGrammarOption(null);
                setBuiltTokens([]);
                setGrammarFeedback(null);
                setGrammarIndex((prev) => (prev - 1 + course.grammar.length) % course.grammar.length);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              Previous Drill
            </button>
            {grammarFeedback === null ? (
              <button
                onClick={handleCheckGrammar}
                disabled={currentExercise.type === 'sentence_builder' ? builtTokens.length === 0 : !selectedGrammarOption}
                className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedGrammarOption(null);
                  setBuiltTokens([]);
                  setGrammarFeedback(null);
                  setGrammarIndex((prev) => (prev + 1) % course.grammar.length);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold cursor-pointer"
              >
                Next Exercise
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODE 5: AI COMMUNICATION COACH */}
      {subMode === 'coach' && (
        <AICommunicationCoach
          knownLanguageCode={knownCourse.code}
          targetLanguageCode={course.code}
          isPlusActive={isPlusActive}
          forcedOffline={forcedOffline}
          onSwapLanguages={onSwapLanguages}
          onOpenPlusModal={onOpenPlusModal}
        />
      )}
    </div>
    </div>
  );
};
