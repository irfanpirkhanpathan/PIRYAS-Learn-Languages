import React, { useState } from 'react';
import { Award, Gift, Swords } from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import type { UserProfile, XpDuel } from '../types/piryas';
import { ReferEarnCard } from './ReferEarnCard';

interface ReferHubProps {
  profile: UserProfile;
  isSignedIn: boolean;
  duels: XpDuel[];
  onSignIn: () => void;
  onCreateDuel: (languageCode: string, targetXp: number) => Promise<void>;
  onJoinDuel: (duelId: string) => Promise<void>;
  onRedeemReferral: (code: string) => { ok: boolean; message: string };
  onOpenPlusModal: () => void;
}

export const ReferHub: React.FC<ReferHubProps> = ({
  profile,
  isSignedIn,
  duels,
  onSignIn,
  onCreateDuel,
  onJoinDuel,
  onRedeemReferral,
  onOpenPlusModal,
}) => {
  const [duelLang, setDuelLang] = useState(profile.activeLanguage);
  const [duelTargetXp, setDuelTargetXp] = useState(100);
  const [creatingDuel, setCreatingDuel] = useState(false);

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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/75 via-slate-50 to-amber-50/65 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <Gift className="w-4 h-4" />
          Refer & Earn + Head-to-Head Duels
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Invite Friends, Earn Points & Challenge Learners
        </h1>
      </div>

      <ReferEarnCard
        profile={profile}
        onRedeemReferral={onRedeemReferral}
        onOpenPlusModal={onOpenPlusModal}
      />

      <div className="pt-4 border-t border-emerald-200/70 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-gradient-to-br from-white to-emerald-50/60 dark:from-slate-900 dark:to-emerald-950/25 border border-emerald-200/80 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="w-4 h-4 text-blue-600" />
            Start an XP Duel Challenge
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Post an open challenge in your target language. Every Guided Path or Challenge completed pushes your duel score forward.
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
            type="button"
            onClick={handleCreate}
            disabled={creatingDuel}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {creatingDuel ? 'Creating Challenge...' : isSignedIn ? 'Post Open Duel Challenge' : 'Sign In to Challenge Learners'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-gradient-to-br from-white to-amber-50/60 dark:from-slate-900 dark:to-amber-950/20 border border-amber-200/80 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Active & Open Duels
          </h3>

          {duels.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No active duels yet. Post a challenge on the left to kick off the first match.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        type="button"
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
