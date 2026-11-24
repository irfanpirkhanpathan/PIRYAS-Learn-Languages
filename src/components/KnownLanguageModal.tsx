import React, { useState } from 'react';
import { ArrowLeftRight, Check, Globe2, X } from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import { playFeedbackTone } from '../lib/audio';

interface KnownLanguageModalProps {
  isOpen: boolean;
  initialKnownCode: string;
  initialTargetCode: string;
  allowClose?: boolean;
  onSavePair: (knownCode: string, targetCode: string) => void;
  onClose?: () => void;
}

export const KnownLanguageModal: React.FC<KnownLanguageModalProps> = ({
  isOpen,
  initialKnownCode,
  initialTargetCode,
  allowClose = true,
  onSavePair,
  onClose,
}) => {
  const [knownCode, setKnownCode] = useState(initialKnownCode || 'hi');
  const [targetCode, setTargetCode] = useState(initialTargetCode || 'en');

  if (!isOpen) return null;

  const knownLang = LANGUAGES.find((l) => l.code === knownCode) || LANGUAGES[0];
  const targetLang = LANGUAGES.find((l) => l.code === targetCode) || LANGUAGES[1];

  const handleSwap = () => {
    playFeedbackTone('tap');
    setKnownCode(targetCode);
    setTargetCode(knownCode);
  };

  const handleSelectKnown = (code: string) => {
    playFeedbackTone('tap');
    setKnownCode(code);
    if (code === targetCode) {
      const alt = LANGUAGES.find((l) => l.code !== code);
      if (alt) setTargetCode(alt.code);
    }
  };

  const handleSelectTarget = (code: string) => {
    playFeedbackTone('tap');
    setTargetCode(code);
    if (code === knownCode) {
      const alt = LANGUAGES.find((l) => l.code !== code);
      if (alt) setKnownCode(alt.code);
    }
  };

  const handleConfirm = () => {
    playFeedbackTone('correct');
    onSavePair(knownCode, targetCode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="known-lang-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 my-8 shadow-xl">
        {allowClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close language pair setup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" />
            Step 1 · Personalize Your Learning Bridge
          </p>
          <h2
            id="known-lang-modal-title"
            className="mt-1.5 font-display text-2xl font-bold text-slate-900 dark:text-white"
          >
            Which language do you already know?
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select your native or known language first, then pair it with the language you want to learn. For example: know Hindi &rarr; learn English, and reverse direction anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label
              htmlFor="known-lang-picker"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              1. I Already Know
            </label>
            <select
              id="known-lang-picker"
              value={knownCode}
              onChange={(e) => handleSelectKnown(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap / Reverse Known & Target Language"
              aria-label="Swap known and learning languages"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label
              htmlFor="target-lang-picker"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              2. I Want to Learn
            </label>
            <select
              id="target-lang-picker"
              value={targetCode}
              onChange={(e) => handleSelectTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Popular quick-pick pairs */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Popular Learning Bridges:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'hi', t: 'en', label: 'Hindi → English' },
              { k: 'en', t: 'de', label: 'English → German' },
              { k: 'en', t: 'ja', label: 'English → Japanese' },
              { k: 'es', t: 'en', label: 'Spanish → English' },
              { k: 'en', t: 'es', label: 'English → Spanish' },
              { k: 'hi', t: 'ja', label: 'Hindi → Japanese' },
            ].map((preset) => {
              const active = knownCode === preset.k && targetCode === preset.t;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    playFeedbackTone('tap');
                    setKnownCode(preset.k);
                    setTargetCode(preset.t);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Bridge Preview */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            Active Bridge: {knownLang.name} ({knownLang.nativeName}) ↔ {targetLang.name} ({targetLang.nativeName})
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All 50 phases (500 CEFR A1–C2 challenges), flashcards, voice questions, and AI Coach explanations will connect{' '}
            <strong>{knownLang.name}</strong> with <strong>{targetLang.name}</strong> — plus you can reverse the translation direction with one click during any exercise.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Attach & Start Learning
          </button>
        </div>
      </div>
    </div>
  );
};
