import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Award,
  Check,
  Crown,
  Flame,
  LogIn,
  LogOut,
  Moon,
  Receipt,
  Sun,
} from 'lucide-react';
import { AVATAR_FRAMES, BADGE_DEFINITIONS, formatCurrencyAmount } from '../data/gamification';
import { getLanguageByCode } from '../data/languages';
import type { PurchaseReceipt, UserProfile } from '../types/piryas';
import { AvatarFrame } from './AvatarFrame';

interface ProfileHubProps {
  profile: UserProfile;
  isSignedIn: boolean;
  darkMode: boolean;
  receipts: PurchaseReceipt[];
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdateDisplayName: (name: string) => void;
  onUpdateDailyGoal: (goal: number) => void;
  onSelectFrame: (frameId: string) => void;
  onToggleTheme: () => void;
  onOpenPlusModal: () => void;
  onOpenKnownLanguageModal: () => void;
  onSwapLanguages: () => void;
}

const DAILY_GOALS = [30, 50, 100, 150];

export const ProfileHub: React.FC<ProfileHubProps> = ({
  profile,
  isSignedIn,
  darkMode,
  receipts,
  onSignIn,
  onSignOut,
  onUpdateDisplayName,
  onUpdateDailyGoal,
  onSelectFrame,
  onToggleTheme,
  onOpenPlusModal,
  onOpenKnownLanguageModal,
  onSwapLanguages,
}) => {
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [savedNotice, setSavedNotice] = useState(false);

  const knownLang = getLanguageByCode(profile.knownLanguage || 'en');
  const targetLang = getLanguageByCode(profile.activeLanguage);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    onUpdateDisplayName(cleaned);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-50/70 via-slate-50 to-emerald-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/25">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Identity & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-gradient-to-br from-white via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200/70 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AvatarFrame
                name={profile.displayName}
                frameId={profile.activeFrameId}
                size="lg"
                isPlus={profile.subscriptionStatus === 'active'}
              />
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {profile.displayName}
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isSignedIn && profile.email
                    ? `${profile.email} · Synced to Cloud`
                    : 'Local Study Profile · Sign in to sync across devices'}
                </p>
                <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                  {profile.subscriptionStatus === 'active'
                    ? `Ad-Free + AI Coach + ∞ Hints (${profile.subscriptionPlan === 'ad_free' ? '₹200 Starter' : profile.subscriptionPlan.toUpperCase()})`
                    : profile.unlimitedHints
                      ? 'Free Tier (Ad-Supported) · Unlimited Hints Pass Active (₹20)'
                      : `Free Learner Tier · ${profile.freeHintsRemaining ?? 10}/10 Free Hints Left`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Toggle light or dark mode"
                title="Switch Light / Dark theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {isSignedIn ? (
                <button
                  onClick={onSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={onSignIn}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In with Google
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveName} className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="profile-name-input" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Leaderboard Display Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                maxLength={80}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                {savedNotice ? 'Saved' : 'Update Name'}
              </button>
            </div>
          </form>

          {/* Known -> Learning Language Bridge Control */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Active Language Bridge
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                {knownLang.name} ({knownLang.nativeName}) &rarr; {targetLang.name} ({targetLang.nativeName})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSwapLanguages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Reverse
              </button>
              <button
                type="button"
                onClick={onOpenKnownLanguageModal}
                className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
              >
                Change Languages
              </button>
            </div>
          </div>

          {/* Daily XP Goal Control */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Daily XP Commitment
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Current: {profile.dailyGoal} XP/day
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DAILY_GOALS.map((goal) => {
                const active = profile.dailyGoal === goal;
                return (
                  <button
                    key={goal}
                    onClick={() => onUpdateDailyGoal(goal)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                    }`}
                  >
                    {goal} XP
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subscription & Billing History */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border border-amber-200/70 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Membership & Receipts
              </h2>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {profile.subscriptionStatus === 'active'
                ? 'Your Ad-Free benefits are active: zero Google ads, AI Communication Coach, Offline App Access across all 15 packs, Unlimited Hearts, and Obsidian Grandmaster frame.'
                : 'Start at just ₹200/mo for 100% Ad-Free learning + AI Communication Coach + Offline App Access + Unlimited Hearts.'}
            </p>

            {receipts.length > 0 && (
              <div className="mt-4 space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verified Payment Invoices
                </p>
                {receipts.slice(0, 3).map((rec) => (
                  <div
                    key={rec.transactionId}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white capitalize truncate">
                          {rec.planId === 'ad_free'
                            ? 'No-Ads Starter'
                            : rec.planId === 'hints_20'
                              ? 'Unlimited Hints Pass'
                              : `Plus ${rec.planId}`}{' '}
                          · {rec.paymentMethod.toUpperCase()}
                          {rec.cardLast4 ? ` •••• ${rec.cardLast4}` : ''}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 truncate">
                          {rec.transactionId}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                      {formatCurrencyAmount(rec.amountCents, rec.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenPlusModal}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors cursor-pointer"
          >
            {profile.subscriptionStatus === 'active' ? 'Manage Subscription Plan' : 'Go Ad-Free · Starting ₹200/mo'}
          </button>
        </div>
      </div>

      {/* Collectible Avatar Frames */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Avatar Frames
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unlock frames by growing your XP, sustaining streaks, or upgrading to Plus. Equipped frames appear live on the global leaderboard.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVATAR_FRAMES.map((frame) => {
            const unlocked = profile.unlockedFrames.includes(frame.id);
            const equipped = profile.activeFrameId === frame.id;
            return (
              <div
                key={frame.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border flex items-center justify-between gap-4 ${
                  equipped
                    ? 'border-blue-600 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <AvatarFrame
                    name={profile.displayName}
                    frameId={frame.id}
                    size="md"
                    isPlus={frame.plusOnly}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {frame.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {frame.unlockRequirement}
                    </p>
                  </div>
                </div>

                {unlocked ? (
                  <button
                    onClick={() => onSelectFrame(frame.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                      equipped
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
                    }`}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : frame.plusOnly ? (
                  <button
                    onClick={onOpenPlusModal}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500 shrink-0 cursor-pointer"
                  >
                    Unlock Plus
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">Locked</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievement Badges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Achievement Badges
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Earned {profile.earnedBadges.length} of {BADGE_DEFINITIONS.length} milestone badges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = profile.earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl p-5 border flex flex-col justify-between ${
                  earned
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/60'
                    : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {badge.category}
                    </span>
                    {earned ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : badge.category === 'Streak' ? (
                      <Flame className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Award className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {badge.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
                <p className="mt-4 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {earned ? 'Unlocked' : 'In Progress'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
    </div>
  );
};
