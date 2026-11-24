import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Compass,
  Filter,
  Flame,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Trophy,
  Volume2,
} from 'lucide-react';
import { computeLeague } from '../data/gamification';
import { getLanguageByCode, LANGUAGES } from '../data/languages';
import { playFeedbackTone, speakNativePhrase, stopActiveSpeech } from '../lib/audio';
import type { ChatMessage, LeaderboardEntry, UserProfile } from '../types/piryas';
import { AvatarFrame } from './AvatarFrame';

interface LeaderboardChatHubProps {
  profile: UserProfile;
  isSignedIn: boolean;
  leaderboardEntries: LeaderboardEntry[];
  chatMessages: ChatMessage[];
  forcedOffline: boolean;
  onSignIn: () => void;
  onSendChatMessage: (payload: {
    recipientUid: string;
    recipientName: string;
    languageCode: string;
    text: string;
    viaVoice: boolean;
  }) => Promise<void>;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export const LeaderboardChatHub: React.FC<LeaderboardChatHubProps> = ({
  profile,
  isSignedIn,
  leaderboardEntries,
  chatMessages,
  forcedOffline,
  onSignIn,
  onSendChatMessage,
}) => {
  const [sortBy, setSortBy] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [selectedTargetUid, setSelectedTargetUid] = useState<string>('lobby');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeakIncoming, setAutoSpeakIncoming] = useState(false);
  const [voiceNoteError, setVoiceNoteError] = useState<string | null>(null);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const userLeague = computeLeague(profile.weeklyXp);

  const scoreFor = (e: LeaderboardEntry) =>
    sortBy === 'weekly'
      ? e.weeklyXp
      : sortBy === 'monthly'
        ? e.monthlyXp ?? e.weeklyXp
        : e.xp;

  const standings = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    leaderboardEntries.forEach((entry) => map.set(entry.uid, entry));

    map.set(profile.uid, {
      uid: profile.uid,
      displayName: profile.displayName,
      xp: profile.xp,
      weeklyXp: profile.weeklyXp,
      monthlyXp: profile.monthlyXp ?? profile.weeklyXp,
      streak: profile.streak,
      activeFrameId: profile.activeFrameId,
      activeLanguage: profile.activeLanguage,
      badgesCount: profile.earnedBadges.length,
      league: userLeague,
      isPlus: profile.subscriptionStatus === 'active',
    });

    return Array.from(map.values()).sort((a, b) => {
      const diff = scoreFor(b) - scoreFor(a);
      if (diff !== 0) return diff;
      return b.xp - a.xp;
    });
  }, [leaderboardEntries, profile, sortBy, userLeague]);

  const filteredStandings = useMemo(() => {
    if (languageFilter === 'all') return standings;
    return standings.filter((s) => s.activeLanguage === languageFilter);
  }, [standings, languageFilter]);

  const myRank = useMemo(
    () => Math.max(1, standings.findIndex((s) => s.uid === profile.uid) + 1),
    [standings, profile.uid]
  );
  const myEntry = standings.find((s) => s.uid === profile.uid) || standings[0];

  const selectedPlayer = useMemo(
    () => standings.find((p) => p.uid === selectedTargetUid && p.uid !== profile.uid) || null,
    [standings, selectedTargetUid, profile.uid]
  );

  // Compare against selected player, or Rank #1 leader (or Rank #2 if user is #1)
  const comparisonTarget = useMemo(() => {
    if (selectedPlayer) return selectedPlayer;
    const topOther = standings.find((p) => p.uid !== profile.uid);
    return topOther || null;
  }, [selectedPlayer, standings, profile.uid]);

  const comparisonRank = comparisonTarget
    ? standings.findIndex((s) => s.uid === comparisonTarget.uid) + 1
    : null;

  const activeChatLanguageCode =
    selectedPlayer?.activeLanguage ||
    (languageFilter !== 'all' ? languageFilter : profile.activeLanguage) ||
    'en';
  const activeChatLangObj = getLanguageByCode(activeChatLanguageCode);

  const visibleMessages = useMemo(() => {
    if (selectedTargetUid === 'lobby') {
      return chatMessages.filter((m) => m.recipientUid === 'lobby');
    }
    return chatMessages.filter(
      (m) =>
        (m.senderUid === profile.uid && m.recipientUid === selectedTargetUid) ||
        (m.senderUid === selectedTargetUid && m.recipientUid === profile.uid)
    );
  }, [chatMessages, selectedTargetUid, profile.uid]);

  useEffect(() => {
    if (!autoSpeakIncoming || visibleMessages.length === 0) return;
    const newest = visibleMessages[visibleMessages.length - 1];
    if (
      newest &&
      newest.id !== lastSpokenIdRef.current &&
      newest.senderUid !== profile.uid
    ) {
      lastSpokenIdRef.current = newest.id;
      const lang = getLanguageByCode(newest.languageCode);
      speakNativePhrase({
        text: newest.text,
        bcp47: lang.bcp47,
        langCode: lang.code,
        languageName: lang.name,
        voiceHint: lang.voiceHint,
        offlineOnly: forcedOffline,
      });
    }
  }, [autoSpeakIncoming, visibleMessages, profile.uid, forcedOffline]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSend = async (textOverride?: string, viaVoice = false) => {
    const text = (textOverride ?? draft).trim();
    if (!text) return;
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setSending(true);
    try {
      await onSendChatMessage({
        recipientUid: selectedPlayer ? selectedPlayer.uid : 'lobby',
        recipientName: selectedPlayer ? selectedPlayer.displayName : 'All Learners Lobby',
        languageCode: activeChatLanguageCode,
        text,
        viaVoice,
      });
      if (!textOverride) setDraft('');
      playFeedbackTone('tap');
    } finally {
      setSending(false);
    }
  };

  const handleSpeakToPlayer = async () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    stopActiveSpeech();

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setVoiceNoteError('Microphone access denied. Enable mic in your browser or type below.');
        return;
      }
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceNoteError('Browser speech recognition is unavailable here. Type your message below.');
      return;
    }

    setVoiceNoteError(null);
    const recognition = new Ctor();
    recognition.lang = activeChatLangObj.bcp47;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setDraft(transcript);
        await handleSend(transcript, true);
      }
    };

    recognition.onerror = () => {
      setVoiceNoteError('Could not capture voice clearly. Try typing or speaking closer.');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  const handleHearMessage = (msg: ChatMessage) => {
    const lang = getLanguageByCode(msg.languageCode);
    speakNativePhrase({
      text: msg.text,
      bcp47: lang.bcp47,
      langCode: lang.code,
      languageName: lang.name,
      voiceHint: lang.voiceHint,
      offlineOnly: forcedOffline,
    });
  };

  const discoveryPrompts = [
    `What new ${activeChatLangObj.name} word did you discover today?`,
    `Can we practice a quick ${activeChatLangObj.name} greeting together?`,
    `Share a cultural or travel tip for ${activeChatLangObj.name} learners!`,
  ];

  const myPeriodPoints = myEntry ? scoreFor(myEntry) : profile.xp;
  const targetPeriodPoints = comparisonTarget ? scoreFor(comparisonTarget) : 0;
  const maxComparePoints = Math.max(1, myPeriodPoints, targetPeriodPoints);
  const xpGap = myPeriodPoints - targetPeriodPoints;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/70 via-slate-50 to-indigo-50/70 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/35">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Leaderboard Rank Analytics & Player Comparison Strip */}
        <section
          className="bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
          aria-label="Rank Analytics and Player Comparison"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Leaderboard Analytics &amp; Player Comparison
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {comparisonTarget
                    ? `Comparing Your Rank #${myRank} vs ${comparisonTarget.displayName} (#${comparisonRank})`
                    : `Your live ranking across ${standings.length} learner${standings.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                Your Rank: #{myRank} / {standings.length}
              </span>
              {comparisonTarget && (
                <span
                  className={`px-3 py-1.5 rounded-lg font-bold ${
                    xpGap >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {xpGap >= 0
                    ? `+${xpGap.toLocaleString()} XP Ahead`
                    : `${Math.abs(xpGap).toLocaleString()} XP to Catch #${comparisonRank}`}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* You */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-slate-800/70 border border-indigo-200/70 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AvatarFrame
                    name={profile.displayName}
                    frameId={profile.activeFrameId}
                    size="sm"
                    isPlus={profile.subscriptionStatus === 'active'}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {profile.displayName} (You · #{myRank})
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Learning {getLanguageByCode(profile.activeLanguage).name} · {userLeague}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
                  {myPeriodPoints.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.max(8, Math.round((myPeriodPoints / maxComparePoints) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {profile.streak}d Streak
                </span>
                <span>{profile.earnedBadges.length} Badges</span>
                <span>Total {profile.xp.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Selected or Leading Comparison Player */}
            {comparisonTarget ? (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-slate-800/70 border border-amber-200/70 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarFrame
                      name={comparisonTarget.displayName}
                      frameId={comparisonTarget.activeFrameId}
                      size="sm"
                      isPlus={comparisonTarget.isPlus}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {comparisonTarget.displayName} (#{comparisonRank})
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Learning {getLanguageByCode(comparisonTarget.activeLanguage).name} · {comparisonTarget.league}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {targetPeriodPoints.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.max(8, Math.round((targetPeriodPoints / maxComparePoints) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    {comparisonTarget.streak}d Streak
                  </span>
                  <span>{comparisonTarget.badgesCount} Badges</span>
                  <span>Total {comparisonTarget.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isSignedIn
                    ? 'More players appear here as they join the leaderboard. Tap any player below to compare & chat!'
                    : 'Sign in with Google to compare live XP, ranks, streaks, and chat with learners.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard Standings + Discovery Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Leaderboard Ranked by Period & Discoverable by Language */}
          <section
            className="lg:col-span-7 bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
            aria-label="Global Leaderboard"
          >
            <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 shrink-0" />
                  <h1 className="font-display text-lg sm:text-xl font-bold">
                    Leaderboard ·{' '}
                    {sortBy === 'monthly'
                      ? 'Monthly Arena'
                      : sortBy === 'weekly'
                        ? 'Weekly Sprint'
                        : 'All-Time'}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isSignedIn && (
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-amber-50 cursor-pointer"
                    >
                      Sign In to Sync
                    </button>
                  )}
                  <div className="flex items-center gap-1 p-1 bg-slate-950/20 rounded-lg backdrop-blur-xs">
                    {(['weekly', 'monthly', 'alltime'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSortBy(mode)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                          sortBy === mode
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-white/90 hover:text-white'
                        }`}
                      >
                        {mode === 'weekly' ? 'Weekly' : mode === 'monthly' ? 'Monthly' : 'All-Time'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Language Discovery Filter */}
              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 shrink-0 opacity-90" />
                <label htmlFor="lb-lang-filter" className="font-medium text-white/90 shrink-0">
                  Discover Learners by Language:
                </label>
                <select
                  id="lb-lang-filter"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white/95 text-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All 15 Languages ({standings.length})</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStandings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No learners currently active in {getLanguageByCode(languageFilter).name}. Switch filter or invite friends!
                </div>
              ) : (
                filteredStandings.map((entry) => {
                  const globalRank = standings.findIndex((s) => s.uid === entry.uid) + 1;
                  const isSelf = entry.uid === profile.uid;
                  const langObj = getLanguageByCode(entry.activeLanguage);
                  const isSelected = selectedTargetUid === entry.uid;
                  const displayPoints = scoreFor(entry);

                  const rankTint =
                    globalRank === 1
                      ? 'bg-amber-50/70 dark:bg-amber-950/25'
                      : globalRank === 2
                        ? 'bg-slate-50/80 dark:bg-slate-800/35'
                        : globalRank === 3
                          ? 'bg-orange-50/60 dark:bg-orange-950/20'
                          : '';

                  return (
                    <div
                      key={entry.uid}
                      className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-indigo-50 dark:bg-indigo-950/45' : rankTint
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-7 text-sm font-mono font-bold tabular-nums text-center shrink-0 ${
                            globalRank === 1
                              ? 'text-amber-600 dark:text-amber-400'
                              : globalRank === 2
                                ? 'text-slate-600 dark:text-slate-300'
                                : globalRank === 3
                                  ? 'text-orange-700 dark:text-orange-400'
                                  : 'text-slate-400'
                          }`}
                        >
                          #{globalRank}
                        </span>

                        <AvatarFrame
                          name={entry.displayName}
                          frameId={entry.activeFrameId}
                          size="sm"
                          isPlus={entry.isPlus}
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {entry.displayName} {isSelf ? '(You)' : ''}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            Learning:{' '}
                            <strong className="text-indigo-700 dark:text-indigo-300">
                              {langObj.name}
                            </strong>{' '}
                            · {entry.streak}d streak · {entry.league}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                          {displayPoints.toLocaleString()} XP
                        </span>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => setSelectedTargetUid(entry.uid)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-700 text-white'
                                : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Compare &amp; Chat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Right: Real-Time Player Chat, Discovery Prompts & Voice Speak Panel */}
          <section
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-slate-800 rounded-2xl flex flex-col h-[590px] shadow-xs overflow-hidden"
            aria-label="Learner Chat and Discovery"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {selectedPlayer
                    ? `${selectedPlayer.displayName} · ${(selectedPlayer.monthlyXp ?? selectedPlayer.weeklyXp).toLocaleString()} Monthly XP`
                    : 'All Learners Discovery Lobby'}
                </p>
                <p className="text-xs text-indigo-100 truncate">
                  Language: {activeChatLangObj.name} · Chat, speak &amp; discover words
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedPlayer && (
                  <button
                    type="button"
                    onClick={() => setSelectedTargetUid('lobby')}
                    className="px-2.5 py-1 rounded-lg bg-white/15 text-xs font-semibold text-white hover:bg-white/25 cursor-pointer"
                  >
                    Lobby
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAutoSpeakIncoming((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    autoSpeakIncoming
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                  title="Automatically read incoming messages aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Auto Voice
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!isSignedIn ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <MessageSquare className="w-8 h-8 text-indigo-600" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Sign in with Google to chat, speak, and discover new words with real learners on the Leaderboard
                  </p>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer"
                  >
                    Sign In with Google
                  </button>
                </div>
              ) : visibleMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <Compass className="w-6 h-6 text-indigo-500" />
                  <p>
                    {selectedPlayer
                      ? `Start chatting or speaking in ${activeChatLangObj.name} with ${selectedPlayer.displayName} to discover new phrases!`
                      : 'No messages in the Discovery Lobby yet. Pick a prompt below or speak into the mic!'}
                  </p>
                </div>
              ) : (
                visibleMessages.map((msg) => {
                  const mine = msg.senderUid === profile.uid;
                  const msgLang = getLanguageByCode(msg.languageCode);
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          mine
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span
                            className={`text-[11px] font-semibold ${
                              mine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {mine ? 'You' : msg.senderName} · {msgLang.name}
                            {msg.viaVoice ? ' · Voice' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleHearMessage(msg)}
                            className={`p-1 rounded hover:opacity-80 cursor-pointer ${
                              mine ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-300'
                            }`}
                            aria-label="Hear message aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="leading-snug break-words">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Discovery Quick Topics + Input Bar */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {discoveryPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDraft(promptText)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {voiceNoteError && (
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  {voiceNoteError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSpeakToPlayer}
                  className={`p-2.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                    isRecording
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
                  }`}
                  aria-label={isRecording ? 'Stop speaking' : `Speak in ${activeChatLangObj.name}`}
                  title={`Speak in ${activeChatLangObj.name}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !sending && draft.trim()) {
                      handleSend();
                    }
                  }}
                  placeholder={
                    isRecording
                      ? `Listening in ${activeChatLangObj.name}...`
                      : selectedPlayer
                        ? `Message ${selectedPlayer.displayName}...`
                        : 'Chat & discover with learners...'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />

                <button
                  type="button"
                  disabled={sending || !draft.trim()}
                  onClick={() => handleSend()}
                  className="p-2.5 rounded-xl bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-40 shrink-0 cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
