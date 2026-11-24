import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Crown,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { playFeedbackTone, speakNativePhrase } from '../lib/audio';

interface AICommunicationCoachProps {
  knownLanguageCode: string;
  targetLanguageCode: string;
  isPlusActive: boolean;
  forcedOffline: boolean;
  onSwapLanguages: () => void;
  onOpenPlusModal: () => void;
}

interface CoachTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  englishMeaning?: string;
  targetSnippet?: string;
}

type CoachMode = 'conversation' | 'differences' | 'english_meaning';

export const AICommunicationCoach: React.FC<AICommunicationCoachProps> = ({
  knownLanguageCode,
  targetLanguageCode,
  isPlusActive,
  forcedOffline,
  onSwapLanguages,
  onOpenPlusModal,
}) => {
  const isOnline = useOnlineStatus();
  const knownCourse = getLanguageByCode(knownLanguageCode);
  const targetCourse = getLanguageByCode(targetLanguageCode);

  const [coachMode, setCoachMode] = useState<CoachMode>('conversation');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turns, setTurns] = useState<CoachTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Welcome to your PIRYAS AI Communication Coach! Ask me to roleplay in ${targetCourse.name}, explain differences between tricky words, or break down exact meanings in English while coaching you in ${knownCourse.name}.`,
      englishMeaning: `Ready to practice ${knownCourse.name} ↔ ${targetCourse.name} real-world communication.`,
      targetSnippet: targetCourse.greeting,
    },
  ]);

  const starterPrompts =
    coachMode === 'conversation'
      ? [
          `Start a realistic café conversation in ${targetCourse.name} and explain in ${knownCourse.name}`,
          `How do I introduce myself politely in ${targetCourse.name}?`,
        ]
      : coachMode === 'differences'
        ? [
            `Explain the difference between formal and casual greetings in ${targetCourse.name}`,
            `What is the difference between "sorry" and "excuse me" in ${targetCourse.name}?`,
          ]
        : [
            `Give me 3 B2/C1 ${targetCourse.name} idioms with English meaning and ${knownCourse.name} explanation`,
            `How do I politely disagree in a business meeting in ${targetCourse.name}?`,
          ];

  const handleSend = async (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || loading) return;

    if (!isPlusActive) {
      onOpenPlusModal();
      return;
    }

    if (forcedOffline || !isOnline) {
      setErrorMsg('Live AI Coach requires an active internet connection. Cached phrase audio still plays offline.');
      return;
    }

    setErrorMsg(null);
    playFeedbackTone('tap');
    const userTurn: CoachTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
    };
    setTurns((prev) => [...prev, userTurn]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          knownLanguage: knownCourse.name,
          targetLanguage: targetCourse.name,
          mode: coachMode,
        }),
      });
      const data = (await resp.json()) as {
        error?: string;
        reply?: string;
        englishMeaning?: string;
        targetSnippet?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Unable to reach AI Coach right now.');
        return;
      }

      playFeedbackTone('correct');
      const aiTurn: CoachTurn = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Let us continue practicing!',
        englishMeaning: data.englishMeaning,
        targetSnippet: data.targetSnippet,
      };
      setTurns((prev) => [...prev, aiTurn]);
    } catch {
      setErrorMsg('Network error reaching AI Communication Coach.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakTarget = async (phrase: string) => {
    await speakNativePhrase({
      text: phrase,
      bcp47: targetCourse.bcp47,
      langCode: targetCourse.code,
      languageName: targetCourse.name,
      voiceHint: targetCourse.voiceHint,
      offlineOnly: forcedOffline,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Included in Every Plan (From ₹200/mo) · {knownCourse.name} ↔ {targetCourse.name}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-white">
            AI Communication & Difference Coach
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwapLanguages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Reverse Pair
          </button>

          {!isPlusActive && (
            <button
              type="button"
              onClick={onOpenPlusModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              Unlock AI Coach
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="px-5 sm:px-6 pt-4 flex flex-wrap gap-2">
        {(
          [
            { id: 'conversation', label: 'Real-World Conversation' },
            { id: 'differences', label: 'Ask Word Differences' },
            { id: 'english_meaning', label: 'English Meaning & Register' },
          ] as { id: CoachMode; label: string }[]
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setCoachMode(m.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              coachMode === m.id
                ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="p-5 sm:p-6 space-y-4 max-h-[420px] overflow-y-auto">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-xl p-4 space-y-2.5 ${
                turn.role === 'user'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{turn.text}</p>

              {turn.englishMeaning && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white">English Meaning: </strong>
                  {turn.englishMeaning}
                </p>
              )}

              {turn.targetSnippet && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {turn.targetSnippet}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeakTarget(turn.targetSnippet!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-600 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen in {targetCourse.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Coach is preparing your {knownCourse.name} ↔ {targetCourse.name} response...
          </p>
        )}
      </div>

      {/* Starter Prompts & Input */}
      <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
        {!isPlusActive && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>AI Communication Coach</strong> is included in every subscription — starting at just <strong>₹200/month</strong> (Ad-Free App + AI Coach + Offline Access + Unlimited Hearts).
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPlusModal}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Unlock for ₹200/mo
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {starterPrompts.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => handleSend(sp)}
              className="text-left px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3 inline mr-1.5 text-blue-600" />
              {sp}
            </button>
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-red-700 dark:text-red-400">{errorMsg}</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isPlusActive
                ? `Ask anything in ${knownCourse.name} or English about ${targetCourse.name}...`
                : 'Unlock from ₹200/mo (Ad-Free + AI Coach) to chat live...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && isPlusActive)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isPlusActive ? 'Ask' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};
