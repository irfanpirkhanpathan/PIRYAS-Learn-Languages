import React, { useState } from 'react';
import { Flame, Menu, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { NavTab } from '../types/piryas';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isPlusActive: boolean;
  streak: number;
  dailyGoalReached: boolean;
  celebrateStreakKey: number;
  onOpenPlusModal: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'path', label: 'Guided Path' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'languages', label: 'Languages' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'refer', label: 'Refer' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'profile', label: 'Profile' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isPlusActive,
  streak,
  dailyGoalReached,
  celebrateStreakKey,
  onOpenPlusModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 lg:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          onClick={() => onSelectTab('path')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          PIRYAS
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[19px] h-0.5 bg-blue-700 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Celebratory Streak Animation + Primary Action */}
        <div className="relative flex items-center gap-3 shrink-0">
          <AnimatePresence>
            {celebrateStreakKey > 0 && (
              <motion.div
                key={`streak-burst-${celebrateStreakKey}`}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.72, y: -6 }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [0.85, 1.08, 1], y: 0 }
                }
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.9, y: -4 }
                }
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                role="status"
                aria-live="polite"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs font-bold shadow-md whitespace-nowrap shrink-0"
              >
                <motion.span
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { rotate: [0, -14, 14, -8, 0], scale: [1, 1.25, 1] }
                  }
                  transition={{ duration: 0.8, repeat: 2, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </motion.span>
                <span className="tabular-nums">{streak}d Streak Milestone!</span>
                <motion.span
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: [0.6, 1, 0.6], scale: [0.9, 1.2, 0.9] }
                  }
                  transition={{ duration: 0.9, repeat: 2 }}
                  className="inline-flex"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {celebrateStreakKey === 0 && dailyGoalReached && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap shrink-0"
              title="Daily streak milestone completed"
            >
              <Flame className="w-4 h-4 fill-current" />
              {streak}d
            </span>
          )}

          <button
            onClick={onOpenPlusModal}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
              isPlusActive
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {isPlusActive ? 'Ad-Free Active' : 'No Ads ₹200'}
          </button>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
