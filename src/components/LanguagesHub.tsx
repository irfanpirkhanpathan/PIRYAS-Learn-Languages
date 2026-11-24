import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Globe2,
  Play,
  Search,
  Volume2,
  WifiOff,
} from 'lucide-react';
import { LANGUAGES, getLanguageByCode } from '../data/languages';
import { playFeedbackTone, speakNativePhrase } from '../lib/audio';
import type {
  LanguageFamily,
  LanguageProgressData,
  OfflinePackMeta,
  PendingSyncAction,
  UserProfile,
} from '../types/piryas';
import { OfflineHub } from './OfflineHub';

interface LanguagesHubProps {
  profile: UserProfile;
  progressMap: Record<string, LanguageProgressData>;
  offlinePacks: OfflinePackMeta[];
  pendingQueue: PendingSyncAction[];
  forcedOffline: boolean;
  onSavePair: (knownCode: string, targetCode: string) => void;
  onSwapLanguages: () => void;
  onStartLanguageChallenges: (langCode: string) => void;
  onToggleForcedOffline: () => void;
  onRefreshPacks: () => Promise<void>;
  onSyncPending: () => Promise<void>;
  onOpenPlusModal: () => void;
}

const FAMILY_FILTERS: ('All' | LanguageFamily)[] = [
  'All',
  'European',
  'East Asian',
  'Middle East & South Asia',
];

export const LanguagesHub: React.FC<LanguagesHubProps> = ({
  profile,
  progressMap,
  offlinePacks,
  pendingQueue,
  forcedOffline,
  onSavePair,
  onSwapLanguages,
  onStartLanguageChallenges,
  onToggleForcedOffline,
  onRefreshPacks,
  onSyncPending,
  onOpenPlusModal,
}) => {
  const [subTab, setSubTab] = useState<'courses' | 'offline'>('courses');
  const [familyFilter, setFamilyFilter] = useState<'All' | LanguageFamily>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingCode, setSpeakingCode] = useState<string | null>(null);

  const knownCourse = getLanguageByCode(profile.knownLanguage || 'hi');
  const targetCourse = getLanguageByCode(profile.activeLanguage);
  const offlineSet = useMemo(() => new Set(offlinePacks.map((p) => p.langCode)), [offlinePacks]);

  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter((lang) => {
      const matchesFamily = familyFilter === 'All' || lang.family === familyFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.family.toLowerCase().includes(q);
      return matchesFamily && matchesSearch;
    });
  }, [familyFilter, searchQuery]);

  const handleListenGreeting = async (code: string) => {
    const lang = getLanguageByCode(code);
    setSpeakingCode(code);
    await speakNativePhrase({
      text: lang.greeting,
      bcp47: lang.bcp47,
      langCode: lang.code,
      languageName: lang.name,
      voiceHint: lang.voiceHint,
      offlineOnly: forcedOffline,
    });
    setSpeakingCode(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Sub-navigation between 15 Languages & Offline Packs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" />
            15 World Languages · Known ↔ Learning Bridge
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Choose Your Languages & Offline Packs
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('courses')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'courses'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All 15 Languages
          </button>
          <button
            type="button"
            onClick={() => setSubTab('offline')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'offline'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            Offline Packs ({offlinePacks.length})
          </button>
        </div>
      </div>

      {subTab === 'offline' ? (
        <OfflineHub
          offlinePacks={offlinePacks}
          pendingQueue={pendingQueue}
          forcedOffline={forcedOffline}
          isPlusActive={profile.subscriptionStatus === 'active'}
          onToggleForcedOffline={onToggleForcedOffline}
          onRefreshPacks={onRefreshPacks}
          onSyncPending={onSyncPending}
          onOpenPlusModal={onOpenPlusModal}
        />
      ) : (
        <>
          {/* Known Language -> Learning Language Bridge Selector */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  1. Which Language Do You Know? &rarr; 2. Which Language Do You Want to Learn?
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Attach your known language to any learning language (e.g., Hindi → English) and reverse direction anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playFeedbackTone('tap');
                  onSwapLanguages();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-600 self-start cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Reverse ({targetCourse.name} → {knownCourse.name})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hub-known-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  I Already Know
                </label>
                <select
                  id="hub-known-select"
                  value={knownCourse.code}
                  onChange={(e) => {
                    playFeedbackTone('tap');
                    const nextKnown = e.target.value;
                    const nextTarget =
                      nextKnown === targetCourse.code
                        ? LANGUAGES.find((l) => l.code !== nextKnown)?.code || targetCourse.code
                        : targetCourse.code;
                    onSavePair(nextKnown, nextTarget);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="hub-target-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  I Am Learning
                </label>
                <select
                  id="hub-target-select"
                  value={targetCourse.code}
                  onChange={(e) => {
                    playFeedbackTone('tap');
                    const nextTarget = e.target.value;
                    const nextKnown =
                      nextTarget === knownCourse.code
                        ? LANGUAGES.find((l) => l.code !== nextTarget)?.code || knownCourse.code
                        : knownCourse.code;
                    onSavePair(nextKnown, nextTarget);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick pairs:</span>
              {[
                { k: 'hi', t: 'en', label: 'Hindi → English' },
                { k: 'en', t: 'de', label: 'English → German' },
                { k: 'en', t: 'ja', label: 'English → Japanese' },
                { k: 'es', t: 'en', label: 'Spanish → English' },
                { k: 'en', t: 'zh', label: 'English → Chinese' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    playFeedbackTone('tap');
                    onSavePair(preset.k, preset.t);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                    knownCourse.code === preset.k && targetCourse.code === preset.t
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* 15 Language Catalog */}
          <section className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  All 15 World Languages (50 Phases · 500 Questions Each)
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Pick any language to launch its 50 phases of real-life challenges, native speaker voice drills, and flashcards.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 15 languages..."
                    aria-label="Search languages"
                    className="pl-9 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                  {FAMILY_FILTERS.map((family) => {
                    const active = familyFilter === family;
                    return (
                      <button
                        key={family}
                        onClick={() => setFamilyFilter(family)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {family}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLanguages.map((lang) => {
                const isActive = lang.code === targetCourse.code;
                const lp = progressMap[lang.code];
                const completedPhaseQs = (lp?.completedGrammar || []).filter((id) =>
                  id.startsWith(`${lang.code}-p`)
                ).length;
                const pct = Math.min(100, Math.round((completedPhaseQs / 500) * 100));
                const isOfflineReady = offlineSet.has(lang.code);

                return (
                  <div
                    key={lang.code}
                    className={`bg-white dark:bg-slate-900 rounded-xl p-5 border transition-colors flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lang.family} · 50 Phases (A1–C2)
                          </p>
                          <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                            {lang.name}{' '}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              · {lang.nativeName}
                            </span>
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleListenGreeting(lang.code)}
                            title={`Hear native ${lang.name} greeting`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-600 cursor-pointer"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${speakingCode === lang.code ? 'text-blue-600' : ''}`} />
                          </button>
                          {isOfflineReady && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {lang.script} · {lang.speakers} · Greeting: “{lang.greeting}”
                      </p>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>50-Phase Progress</span>
                        <span className="tabular-nums font-mono">
                          {completedPhaseQs}/500 Qs · {lp?.xp || 0} XP
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isActive ? 'bg-blue-700 dark:bg-blue-500' : 'bg-slate-700 dark:bg-slate-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <button
                        onClick={() => onStartLanguageChallenges(lang.code)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-blue-700 text-white hover:bg-blue-800'
                            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isActive ? 'Continue 50 Phases' : `Start ${lang.name} Challenges`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
