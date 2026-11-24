import type { AvatarFrame, BadgeDefinition, LeagueTier } from '../types/piryas';

export const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: 'slate',
    name: 'Novice Slate',
    description: 'Clean architectural slate border for every new polyglot.',
    unlockRequirement: 'Default starting frame',
    ringClass: 'ring-2 ring-slate-300 dark:ring-slate-600',
    accentHex: '#64748B',
    minXp: 0,
  },
  {
    id: 'cobalt',
    name: 'Cobalt Scholar',
    description: 'Deep cobalt anodized ring awarded for early consistency.',
    unlockRequirement: 'Reach 150 Total XP',
    ringClass: 'ring-[3px] ring-blue-600 shadow-sm shadow-blue-500/20',
    accentHex: '#2563EB',
    minXp: 150,
  },
  {
    id: 'amber_flame',
    name: 'Solar Streak',
    description: 'Warm amber crest honoring sustained daily study habits.',
    unlockRequirement: 'Reach a 3-Day Streak or 400 XP',
    ringClass: 'ring-[3px] ring-amber-500 shadow-sm shadow-amber-500/25',
    accentHex: '#D97706',
    minStreak: 3,
    minXp: 400,
  },
  {
    id: 'emerald_polyglot',
    name: 'Emerald Polyglot',
    description: 'Botanical emerald bezel for multi-language explorers.',
    unlockRequirement: 'Reach 900 Total XP',
    ringClass: 'ring-[3px] ring-emerald-600 shadow-sm shadow-emerald-500/20',
    accentHex: '#059669',
    minXp: 900,
  },
  {
    id: 'sakura_gold',
    name: 'Champagne Laurel',
    description: 'Brushed gold dual-bezel awarded to seasoned linguists.',
    unlockRequirement: 'Reach 2,000 Total XP',
    ringClass: 'ring-[3px] ring-yellow-500 shadow-md shadow-yellow-500/25',
    accentHex: '#CA8A04',
    minXp: 2000,
  },
  {
    id: 'obsidian_crown',
    name: 'Obsidian Grandmaster',
    description: 'Signature faceted cobalt & gold medallion frame for PIRYAS subscribers.',
    unlockRequirement: 'PIRYAS Plus / Ad-Free Plan',
    ringClass: 'ring-[3px] ring-indigo-600 dark:ring-amber-400 shadow-md shadow-indigo-500/30',
    accentHex: '#4F46E5',
    plusOnly: true,
  },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_word',
    title: 'First Lexicon',
    description: 'Master your first vocabulary flashcard in any language.',
    category: 'Study',
    targetValue: 1,
  },
  {
    id: 'grammar_architect',
    title: 'Grammar Architect',
    description: 'Complete 5 interactive grammar exercises.',
    category: 'Study',
    targetValue: 5,
  },
  {
    id: 'daily_goal_hit',
    title: 'Daily Target',
    description: 'Meet 100% of your daily XP goal in a single day.',
    category: 'Streak',
    targetValue: 1,
  },
  {
    id: 'streak_three',
    title: 'Three-Day Flame',
    description: 'Maintain an active study streak for 3 consecutive days.',
    category: 'Streak',
    targetValue: 3,
  },
  {
    id: 'streak_seven',
    title: 'Weekly Discipline',
    description: 'Sustain a 7-day learning streak without missing a day.',
    category: 'Streak',
    targetValue: 7,
  },
  {
    id: 'polyglot_trio',
    title: 'Polyglot Trio',
    description: 'Study vocabulary or grammar across at least 3 different languages.',
    category: 'Study',
    targetValue: 3,
  },
  {
    id: 'xp_500',
    title: '500 XP Scholar',
    description: 'Accumulate 500 lifetime XP across all languages.',
    category: 'Study',
    targetValue: 500,
  },
  {
    id: 'offline_explorer',
    title: 'Offline Explorer',
    description: 'Download an offline language pack for anywhere study.',
    category: 'Offline',
    targetValue: 1,
  },
  {
    id: 'social_duelist',
    title: 'Arena Duelist',
    description: 'Create or join a social XP duel on the leaderboard.',
    category: 'Social',
    targetValue: 1,
  },
  {
    id: 'plus_patron',
    title: 'Ad-Free Patron',
    description: 'Unlock Ad-Free learning, AI Communication Coach, Offline Mode & Unlimited Hearts.',
    category: 'Plus',
    targetValue: 1,
  },
];

export function computeLeague(weeklyXp: number): LeagueTier {
  if (weeklyXp >= 1500) return 'Obsidian';
  if (weeklyXp >= 800) return 'Sapphire';
  if (weeklyXp >= 400) return 'Gold';
  if (weeklyXp >= 150) return 'Silver';
  return 'Bronze';
}

export function formatCurrencyAmount(amountCents: number, currency: 'INR' | 'USD' = 'INR'): string {
  const units = amountCents / 100;
  if (currency === 'USD') {
    return `$${units.toFixed(2)}`;
  }
  return `₹${Math.round(units).toLocaleString('en-IN')}`;
}

export interface SubscriptionPlanSpec {
  id: 'hints_20' | 'ad_free' | 'monthly' | 'annual' | 'lifetime';
  name: string;
  priceDisplay: string;
  cents: number; // paise (₹1 = 100 paise)
  currency: 'INR';
  period: string;
  tagline: string;
  savingsLabel: string;
  removesAds: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanSpec[] = [
  {
    id: 'hints_20',
    name: 'Unlimited Hints Pass',
    priceDisplay: '₹20',
    cents: 2000,
    currency: 'INR',
    period: 'per month',
    tagline: 'Unlocks unlimited Hints & word forms across all 100 Guided Paths after your 10 free hints.',
    savingsLabel: 'Hints Only · ₹20',
    removesAds: false,
  },
  {
    id: 'ad_free',
    name: 'No-Ads Starter',
    priceDisplay: '₹200',
    cents: 20000,
    currency: 'INR',
    period: 'per month',
    tagline: '100% Ad-Free app (no completion, bottom, or Mystery Box ads) + AI Coach + Offline Mode + Unlimited Hints.',
    savingsLabel: 'No Ads + Full App · ₹200',
    removesAds: true,
  },
  {
    id: 'monthly',
    name: 'PIRYAS Plus Monthly',
    priceDisplay: '₹849',
    cents: 84900,
    currency: 'INR',
    period: 'per month',
    tagline: 'Includes Ad-Free App, AI Communication Coach, Unlimited Hearts, Unlimited Hints & all 15 offline packs.',
    savingsLabel: 'AI Coach + Offline + No Ads',
    removesAds: true,
  },
  {
    id: 'annual',
    name: 'PIRYAS Plus Annual',
    priceDisplay: '₹6,699',
    cents: 669900,
    currency: 'INR',
    period: 'per year',
    tagline: 'Save 33% with Ad-Free App, AI Coach, Offline App Access, Unlimited Hints, 3 Streak Freezes & Obsidian frame.',
    savingsLabel: 'Most Popular · Save 33%',
    removesAds: true,
  },
  {
    id: 'lifetime',
    name: 'Polyglot Lifetime',
    priceDisplay: '₹16,799',
    cents: 1679900,
    currency: 'INR',
    period: 'one-time',
    tagline: 'Permanent Ad-Free Access, AI Communication Coach, Offline Mode, Unlimited Hints & all 100 Guided Paths.',
    savingsLabel: 'Lifetime All-Access',
    removesAds: true,
  },
];
