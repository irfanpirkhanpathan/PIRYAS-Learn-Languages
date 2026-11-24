import React, { useMemo, useState } from 'react';
import { Award, Flame, Swords, Trophy, Users } from 'lucide-react';
import { computeLeague } from '../data/gamification';
import { LANGUAGES } from '../data/languages';
import type { LeaderboardEntry, UserProfile, XpDuel } from '../types/piryas';
import { AvatarFrame } from './AvatarFrame';

interface LeaderboardSocialProps {
  profile: UserProfile;
  isSignedIn: boolean;
  leaderboardEntries: LeaderboardEntry[];
  duels: XpDuel[];
  onSignIn: () => void;
  onCreateDuel: (languageCode: string, targetXp: number) => Promise<void>;
  onJoinDuel: (duelId: string) => Promise<void>;
}

const LEAGUE_TIERS = [
  { name: 'Bronze', threshold: '0+ Weekly XP' },
  { name: 'Silver', threshold: '150+ Weekly XP' },
  { name: 'Gold', threshold: '400+ Weekly XP' },
  { name: 'Sapphire', threshold: '800+ Weekly XP' },
  { name: 'Obsidian', threshold: '1,500+ Weekly XP' },
];

export const LeaderboardSocial: React.FC<LeaderboardSocialProps> = ({
  profile,
  isSignedIn,
  leaderboardEntries,
  duels,
  onSignIn,
  onCreateDuel,
  onJoinDuel,
}) => {
  const [sortBy, setSortBy] = useState<'weekly' | 'alltime'>('weekly');
  const [duelLang, setDuelLang] = useState(profile.activeLanguage);
  const [duelTargetXp, setDuelTargetXp] = useState(100);
  const [creatingDuel, setCreatingDuel] = useState(false);

  const userLeague = computeLeague(profile.weeklyXp);

  // Merge signed-in user standing seamlessly into the live Firestore leaderboard list
  const combinedStandings = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaderboardEntries.forEach((entry) => map.set(entry.uid, entry));

    map.set(profile.uid, {
      uid: profile.uid,
      displayName: profile.displayName,
      xp: profile.xp,
      weeklyXp: profile.weeklyXp,
      streak: profile.streak,
      activeFrameId: profile.activeFrameId,
      activeLanguage: profile.activeLanguage,
      badgesCount: profile.earnedBadges.length,
      league: userLeague,
      isPlus: profile.subscriptionStatus === 'active',
    });

    return Array.from(map.values()).sort((a, b) =>
      sortBy === 'weekly' ? b.weeklyXp - a.weeklyXp : b.xp - a.xp
    );
  }, [leaderboardEntries, profile, sortBy, userLeague]);

  const userRank = combinedStandings.findIndex((e) => e.uid === profile.uid) + 1;

  const handleCreate = async () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setCreatingDuel(true);
    try {
      await onCreateDuel(duelLang, duelTargetXp);
    } finally {
      setCreatingDuel(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* League Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weekly Social Competition · {userLeague} Division
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Global Standings & XP Duels
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Compete across weekly leagues, showcase unlocked avatar frames and badges, and challenge fellow learners to head-to-head XP sprints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your Rank</p>
            <p className="font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              #{userRank}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Weekly XP</p>
            <p className="font-display text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-400">
              {profile.weeklyXp.toLocaleString()}
            </p>
          </div>
          {!isSignedIn && (
            <button
              onClick={onSignIn}
              className="px-4 py-2.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In to Publish Rank
            </button>
          )}
        </div>
      </div>

      {/* League Ladder */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {LEAGUE_TIERS.map((tier) => {
          const isCurrent = tier.name === userLeague;
          return (
            <div
              key={tier.name}
              className={`rounded-xl p-4 border ${
                isCurrent
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {tier.name}
                </span>
                {isCurrent && <Trophy className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {tier.threshold}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Standings Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Learner Leaderboard
            </h2>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setSortBy('weekly')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  sortBy === 'weekly'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Weekly Sprint
              </button>
              <button
                onClick={() => setSortBy('alltime')}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  sortBy === 'alltime'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All-Time XP
              </button>
            </div>
          </div>

          {combinedStandings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Sign in with Google to view and compete on the live Firestore leaderboard.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {combinedStandings.map((entry, idx) => {
                const isSelf = entry.uid === profile.uid;
                const langObj = LANGUAGES.find((l) => l.code === entry.activeLanguage);
                return (
                  <div
                    key={entry.uid}
                    className={`px-5 py-4 flex items-center justify-between gap-4 ${
                      isSelf ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`w-6 text-sm font-mono font-bold tabular-nums text-center shrink-0 ${
                          idx === 0
                            ? 'text-amber-600'
                            : idx === 1
                              ? 'text-slate-500'
                              : idx === 2
                                ? 'text-amber-700'
                                : 'text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <AvatarFrame
                        name={entry.displayName}
                        frameId={entry.activeFrameId}
                        size="sm"
                        isPlus={entry.isPlus}
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {entry.displayName} {isSelf ? '(You)' : ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {langObj?.name || entry.activeLanguage} · {entry.league} · {entry.badgesCount} badges
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-right">
                      <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {entry.streak}d
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {(sortBy === 'weekly' ? entry.weeklyXp : entry.xp).toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Social Competition: Live XP Duels */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-blue-600" />
              Start an XP Duel Challenge
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Post an open challenge in your target language. Every flashcard or grammar drill you complete automatically pushes your duel score forward.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Language
                </label>
                <select
                  value={duelLang}
                  onChange={(e) => setDuelLang(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Sprint
                </label>
                <select
                  value={duelTargetXp}
                  onChange={(e) => setDuelTargetXp(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={50}>50 XP Quick Sprint</option>
                  <option value={100}>100 XP Classic Duel</option>
                  <option value={250}>250 XP Marathon</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creatingDuel}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {creatingDuel ? 'Creating Challenge...' : isSignedIn ? 'Post Open Duel Challenge' : 'Sign In to Challenge Learners'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Active & Open Duels
            </h3>

            {duels.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No active duels yet. Post a challenge above to kick off the first match.
              </p>
            ) : (
              <div className="space-y-3">
                {duels.map((duel) => {
                  const lang = LANGUAGES.find((l) => l.code === duel.languageCode);
                  const canJoin =
                    duel.status === 'open' && isSignedIn && duel.challengerUid !== profile.uid;
                  return (
                    <div
                      key={duel.id}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {lang?.name || duel.languageCode} · {duel.targetXp} XP Goal
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 capitalize">
                          {duel.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        <span>
                          {duel.challengerName}: <strong>{duel.challengerXp} XP</strong>
                        </span>
                        <span>
                          {duel.opponentName ? `${duel.opponentName}: ` : 'Awaiting rival '}
                          {duel.opponentName && <strong>{duel.opponentXp} XP</strong>}
                        </span>
                      </div>

                      {canJoin && (
                        <button
                          onClick={() => onJoinDuel(duel.id)}
                          className="w-full py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                        >
                          Accept Duel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
