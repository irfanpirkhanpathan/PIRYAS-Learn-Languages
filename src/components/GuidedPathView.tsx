import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Gift,
  Heart,
  Lock,
  Play,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { GUIDED_LEVEL_SECTIONS, generate100GuidedPaths } from '../data/guidedPaths';
import { playFeedbackTone } from '../lib/audio';
import type {
  CEFRLevel,
  GuidedPathItem,
  LanguageProgressData,
  UserProfile,
} from '../types/piryas';
import { GoogleAdSlot } from './GoogleAdSlot';

interface GuidedPathViewProps {
  profile: UserProfile;
  progressMap: Record<string, LanguageProgressData>;
  hearts: number;
  maxHearts: number;
  secondsUntilNextHeart: number | null;
  onStartGuidedPath: (item: GuidedPathItem) => void;
  onClaimMysteryBox: (item: GuidedPathItem) => void;
  onOpenPlusModal: () => void;
}

const SECTION_BANNER_PALETTE: Record<CEFRLevel, string> = {
  A1: 'from-emerald-600 via-teal-600 to-cyan-600 border-emerald-500',
  A2: 'from-sky-600 via-blue-600 to-indigo-600 border-sky-500',
  B1: 'from-indigo-600 via-violet-600 to-purple-600 border-indigo-500',
  B2: 'from-amber-600 via-orange-600 to-rose-600 border-amber-500',
  C1: 'from-rose-600 via-pink-600 to-fuchsia-600 border-rose-500',
  C2: 'from-slate-900 via-indigo-900 to-violet-900 border-indigo-600',
};

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const GuidedPathView: React.FC<GuidedPathViewProps> = ({
  profile,
  progressMap,
  hearts,
  maxHearts,
  secondsUntilNextHeart,
  onStartGuidedPath,
  onClaimMysteryBox,
  onOpenPlusModal,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('A1');
  const [openedRewardModal, setOpenedRewardModal] = useState<GuidedPathItem | null>(null);
  const [adGateBox, setAdGateBox] = useState<GuidedPathItem | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(0);
  const [lockedNoticeId, setLockedNoticeId] = useState<string | null>(null);
  const [lockedPathNotice, setLockedPathNotice] = useState<{ id: string; text: string } | null>(null);

  const isPlusActive = profile.subscriptionStatus === 'active';
  const langProgress = progressMap[profile.activeLanguage] || {
    uid: profile.uid,
    langCode: profile.activeLanguage,
    xp: 0,
    masteredCards: [],
    completedGrammar: [],
  };

  useEffect(() => {
    if (!adGateBox || adSecondsLeft <= 0) return;
    const t = setTimeout(() => setAdSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [adGateBox, adSecondsLeft]);

  const completedSet = useMemo(
    () => new Set(langProgress.completedGrammar),
    [langProgress.completedGrammar]
  );
  const claimedMysterySet = useMemo(
    () => new Set(langProgress.masteredCards),
    [langProgress.masteredCards]
  );

  const all100Paths = useMemo(
    () => generate100GuidedPaths(profile.activeLanguage, profile.knownLanguage || 'hi'),
    [profile.activeLanguage, profile.knownLanguage]
  );

  const unlockedPathSet = useMemo(() => {
    const unlocked = new Set<string>();
    all100Paths.forEach((item) => {
      if (item.pathNumber === 1) {
        unlocked.add(item.id);
      } else {
        const prevId = `${profile.activeLanguage}-gp-${item.pathNumber - 1}`;
        if (completedSet.has(prevId)) {
          unlocked.add(item.id);
        }
      }
    });
    return unlocked;
  }, [all100Paths, completedSet, profile.activeLanguage]);

  const activeSectionMeta = useMemo(
    () => GUIDED_LEVEL_SECTIONS.find((s) => s.level === selectedLevel) || GUIDED_LEVEL_SECTIONS[0],
    [selectedLevel]
  );

  const visiblePaths = useMemo(
    () => all100Paths.filter((p) => p.level === selectedLevel),
    [all100Paths, selectedLevel]
  );

  const activeFrontierIndex = useMemo(
    () =>
      visiblePaths.findIndex(
        (p) => unlockedPathSet.has(p.id) && !completedSet.has(p.id)
      ),
    [visiblePaths, unlockedPathSet, completedSet]
  );

  const handleTapPathNode = (pathItem: GuidedPathItem, isUnlocked: boolean) => {
    if (!isUnlocked) {
      playFeedbackTone('incorrect');
      const notice = {
        id: pathItem.id,
        text: `Complete Guided Path #${pathItem.pathNumber - 1} first to unlock Path #${pathItem.pathNumber}.`,
      };
      setLockedPathNotice(notice);
      setTimeout(() => {
        setLockedPathNotice((cur) => (cur?.id === pathItem.id ? null : cur));
      }, 2800);
      return;
    }
    playFeedbackTone('tap');
    onStartGuidedPath(pathItem);
  };

  const handleTapMysteryBox = (pathItem: GuidedPathItem) => {
    const isCompleted = completedSet.has(pathItem.id);
    const isClaimed = claimedMysterySet.has(pathItem.mysteryBoxId);

    if (!isCompleted) {
      playFeedbackTone('tap');
      setLockedNoticeId(pathItem.id);
      setTimeout(() => {
        setLockedNoticeId((cur) => (cur === pathItem.id ? null : cur));
      }, 2400);
      return;
    }

    if (isClaimed) {
      playFeedbackTone('tap');
      setOpenedRewardModal(pathItem);
      return;
    }

    if (isPlusActive) {
      playFeedbackTone('chest');
      onClaimMysteryBox(pathItem);
      setOpenedRewardModal(pathItem);
    } else {
      playFeedbackTone('tap');
      setAdGateBox(pathItem);
      setAdSecondsLeft(5);
    }
  };

  const unlockedInSection = visiblePaths.filter((p) => unlockedPathSet.has(p.id)).length;
  const completedInSection = visiblePaths.filter((p) => completedSet.has(p.id)).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-100/80 via-emerald-50/80 to-amber-100/70 dark:from-slate-950 dark:via-indigo-950/35 dark:to-emerald-950/25 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Minimal Guided-Path-Only Controls: CEFR Level Tabs + Hearts & 1h Recovery Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/85 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
            {GUIDED_LEVEL_SECTIONS.map((sec) => {
              const active = selectedLevel === sec.level;
              const levelPaths = all100Paths.filter((p) => p.level === sec.level);
              const doneCount = levelPaths.filter((p) => completedSet.has(p.id)).length;
              return (
                <button
                  key={sec.level}
                  type="button"
                  onClick={() => {
                    playFeedbackTone('tap');
                    setSelectedLevel(sec.level);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sec.level} · {sec.difficultyLabel} ({doneCount}/{sec.pathCount})
                </button>
              );
            })}
          </div>

          {/* Live Hearts + 1-Hour Recovery Status */}
          <div
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-slate-800 self-start md:self-auto shrink-0 shadow-xs"
            aria-label="Hearts and recovery timer"
          >
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono text-sm font-bold tabular-nums">
              <Heart className="w-4 h-4 fill-current" />
              <span>{isPlusActive ? '∞' : `${hearts}/${maxHearts}`}</span>
            </div>
            {!isPlusActive && hearts < maxHearts && secondsUntilNextHeart !== null && (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium tabular-nums text-slate-600 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                +1 in {formatCountdown(secondsUntilNextHeart)}
              </span>
            )}
            {!isPlusActive && hearts === maxHearts && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                1h recovery/heart
              </span>
            )}
          </div>
        </div>

        {/* Vibrant CEFR Section Banner */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${SECTION_BANNER_PALETTE[selectedLevel]} border text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shadow-sm`}
        >
          <div>
            <p className="text-xs font-medium text-white/90">
              {activeSectionMeta.title} · {unlockedInSection}/{activeSectionMeta.pathCount} Unlocked · {completedInSection} Completed
            </p>
            <h1 className="mt-0.5 font-display text-lg sm:text-xl font-bold text-balance">
              Paths {activeSectionMeta.startPath}–{activeSectionMeta.endPath}
            </h1>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-white/90 tabular-nums shrink-0">
            New Word + World Every Path · Mystery Box
          </div>
        </div>

        {/* Winding Multi-Color Guided Path Nodes + Per-Path Mystery Boxes */}
        <div className="py-4 flex flex-col items-center space-y-8">
          {visiblePaths.map((pathItem, idx) => {
            const isCompleted = completedSet.has(pathItem.id);
            const isUnlocked = unlockedPathSet.has(pathItem.id);
            const isCurrent = idx === activeFrontierIndex;
            const isMysteryClaimed = claimedMysterySet.has(pathItem.mysteryBoxId);

            const curvePos = idx % 4;
            const offsetClass =
              curvePos === 1
                ? '-translate-x-10 sm:-translate-x-14'
                : curvePos === 3
                  ? 'translate-x-10 sm:translate-x-14'
                  : 'translate-x-0';

            return (
              <div key={pathItem.id} className={`flex flex-col items-center ${offsetClass}`}>
                {isCurrent && (
                  <div className="mb-2 px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold tracking-wide shadow-xs">
                    START
                  </div>
                )}

                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => handleTapPathNode(pathItem, isUnlocked)}
                    aria-label={
                      isUnlocked
                        ? `Open Guided Path ${pathItem.pathNumber}: ${pathItem.title}`
                        : `Locked Guided Path ${pathItem.pathNumber}: Complete Path ${pathItem.pathNumber - 1} first`
                    }
                    className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center border-b-[6px] transition-transform cursor-pointer shadow-sm ${
                      isUnlocked
                        ? `${pathItem.colorTheme.circleClass} hover:scale-105 active:border-b-0 active:translate-y-[4px] ${
                            isCurrent ? `ring-4 ${pathItem.colorTheme.ringClass}` : ''
                          }`
                        : 'bg-white/75 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {!isUnlocked ? (
                      <Lock className="w-6 h-6" />
                    ) : isCompleted ? (
                      <Check className="w-7 h-7 stroke-[3]" />
                    ) : isCurrent ? (
                      <Star className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                    <span className="mt-0.5 font-mono text-[10px] font-bold tabular-nums opacity-95">
                      #{pathItem.pathNumber}
                    </span>
                  </button>

                  {/* Mystery Box paired with every Guided Path */}
                  <button
                    type="button"
                    onClick={() => handleTapMysteryBox(pathItem)}
                    aria-label={`Mystery Box for Path ${pathItem.pathNumber}`}
                    title={
                      isMysteryClaimed
                        ? 'Mystery Box Claimed'
                        : isCompleted
                          ? isPlusActive
                            ? 'Open Unlocked Mystery Box!'
                            : 'Watch Ad & Open Mystery Box!'
                          : `Complete Path #${pathItem.pathNumber} to open Mystery Box`
                    }
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-transform active:border-b-0 active:translate-y-[3px] cursor-pointer shadow-xs ${
                      isMysteryClaimed
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        : isCompleted
                          ? 'bg-amber-400 border-amber-600 text-slate-950 hover:scale-105 ring-4 ring-amber-400/35'
                          : 'bg-white/85 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isMysteryClaimed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Gift className="w-5 h-5" />
                    )}
                    <span className="mt-0.5 text-[9px] font-bold">
                      {isMysteryClaimed ? 'Opened' : isCompleted ? (isPlusActive ? 'Open' : 'Ad+Box') : 'Box'}
                    </span>
                  </button>
                </div>

                <div className="mt-2.5 text-center max-w-[250px] px-3 py-1.5 rounded-xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xs border border-white/60 dark:border-slate-800/80">
                  <p
                    className={`text-sm font-bold leading-tight ${
                      isUnlocked
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {pathItem.pathNumber}. {pathItem.title}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] font-medium ${
                      isUnlocked
                        ? pathItem.colorTheme.badgeTextClass
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isUnlocked
                      ? `${pathItem.worldLabel} · 10 Words · 10 Sentences · 20 Qs`
                      : `Locked · Finish Path #${pathItem.pathNumber - 1}`}
                  </p>
                  {lockedPathNotice?.id === pathItem.id && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {lockedPathNotice.text}
                    </p>
                  )}
                  {lockedNoticeId === pathItem.id && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Finish Path #{pathItem.pathNumber} to unlock this Mystery Box
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rewarded Google AdSense Gate for Mystery Box (Free Tier Only) */}
      {adGateBox && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sponsored Mystery Box Ad"
        >
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Path #{adGateBox.pathNumber} · Sponsored Mystery Box
              </p>
              <button
                type="button"
                onClick={() => setAdGateBox(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Close ad popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <GoogleAdSlot
              variant="mystery"
              isAdFree={isPlusActive}
              onUpgradeAdFree={() => {
                setAdGateBox(null);
                onOpenPlusModal();
              }}
            />

            <button
              type="button"
              disabled={adSecondsLeft > 0}
              onClick={() => {
                const target = adGateBox;
                setAdGateBox(null);
                playFeedbackTone('chest');
                onClaimMysteryBox(target);
                setOpenedRewardModal(target);
              }}
              className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 text-sm font-bold border-b-4 border-amber-600 disabled:opacity-50 cursor-pointer"
            >
              {adSecondsLeft > 0
                ? `Unlocking Mystery Box in ${adSecondsLeft}s...`
                : `Claim Reward: ${adGateBox.mysteryReward.label}`}
            </button>
          </div>
        </div>
      )}

      {/* Mystery Box Reward Modal */}
      {openedRewardModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mystery Box Reward"
        >
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-5 shadow-xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpenedRewardModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Close reward popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Path #{openedRewardModal.pathNumber} · Mystery Box Opened
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
                {openedRewardModal.mysteryReward.label}
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                Rewards credited for completing “{openedRewardModal.title}”.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenedRewardModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 cursor-pointer"
            >
              Back to Guided Path
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
