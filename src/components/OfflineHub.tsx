import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  Crown,
  Download,
  HardDrive,
  Lock,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { LANGUAGES } from '../data/languages';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { fetchAndCacheNativeAudio } from '../lib/audio';
import { removeOfflinePack, saveOfflineLanguagePack } from '../lib/offlineDb';
import type { LanguageCourse, OfflinePackMeta, PendingSyncAction } from '../types/piryas';
import { PWAInstallButton } from './PWAInstallButton';

interface OfflineHubProps {
  offlinePacks: OfflinePackMeta[];
  pendingQueue: PendingSyncAction[];
  forcedOffline: boolean;
  isPlusActive: boolean;
  onToggleForcedOffline: () => void;
  onRefreshPacks: () => Promise<void>;
  onSyncPending: () => Promise<void>;
  onOpenPlusModal: () => void;
}

export const OfflineHub: React.FC<OfflineHubProps> = ({
  offlinePacks,
  pendingQueue,
  forcedOffline,
  isPlusActive,
  onToggleForcedOffline,
  onRefreshPacks,
  onSyncPending,
  onOpenPlusModal,
}) => {
  const isOnline = useOnlineStatus();
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [imgError, setImgError] = useState(false);

  const packMap = useMemo(() => {
    const map = new Map<string, OfflinePackMeta>();
    offlinePacks.forEach((p) => map.set(p.langCode, p));
    return map;
  }, [offlinePacks]);

  const totalBytes = useMemo(
    () => offlinePacks.reduce((acc, p) => acc + p.sizeBytes, 0),
    [offlinePacks]
  );

  const handleDownloadPack = async (course: LanguageCourse) => {
    if (!isPlusActive) {
      onOpenPlusModal();
      return;
    }

    setDownloadingCode(course.code);
    try {
      let cachedAudioCount = 0;
      let audioBytes = 0;

      if (isOnline && !forcedOffline) {
        const phrases = [course.greeting, ...course.flashcards.slice(0, 3).map((c) => c.term)];
        for (const phrase of phrases) {
          const base64 = await fetchAndCacheNativeAudio({
            text: phrase,
            langCode: course.code,
            languageName: course.name,
            voiceHint: course.voiceHint,
            slow: false,
          });
          if (base64) {
            cachedAudioCount += 1;
            audioBytes += Math.round((base64.length * 3) / 4);
          }
        }
      }

      await saveOfflineLanguagePack(course, cachedAudioCount, audioBytes);
      await onRefreshPacks();
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleToggleOfflineAction = () => {
    if (!isPlusActive && !forcedOffline) {
      onOpenPlusModal();
      return;
    }
    onToggleForcedOffline();
  };

  const handleDeletePack = async (langCode: string) => {
    await removeOfflinePack(langCode);
    await onRefreshPacks();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncPending();
    } finally {
      setSyncing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Subscription Requirement Banner when not subscribed */}
      {!isPlusActive && (
        <div className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-600">
          <div className="space-y-1">
            <p className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-300" />
              PIRYAS Plus Required for Offline App Access
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold">
              Take All 15 Languages & 50 Phases (500 Challenges) Offline — Plus Get AI Coach Included
            </h2>
            <p className="text-xs text-blue-100">
              Every Plus plan (Monthly, Annual, Lifetime) unlocks Offline App Mode, downloadable audio packs, and the AI Communication Assistant.
            </p>
          </div>
          <button
            onClick={onOpenPlusModal}
            className="px-5 py-2.5 rounded-xl bg-white text-blue-900 text-xs font-bold hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Subscribe to Unlock Offline
          </button>
        </div>
      )}

      {/* Editorial Offline Header Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Offline-First PWA · IndexedDB Pack Storage
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
              Learn Anywhere Without Signal
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Download complete 50-phase (500-challenge) CEFR packs, vocabulary decks, grammar drills, and native speaker audio directly to your device. Progress earned offline queues locally and syncs automatically when you reconnect.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Connection State</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isOnline && !forcedOffline ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-amber-500" />
                      Offline Study
                    </>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Cached Storage</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  {formatSize(totalBytes)} ({offlinePacks.length} packs)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pending Sync Queue</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                  {pendingQueue.length} {pendingQueue.length === 1 ? 'action' : 'actions'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <PWAInstallButton />

            <button
              onClick={handleToggleOfflineAction}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                forcedOffline
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                  : !isPlusActive
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                    : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isPlusActive || forcedOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {forcedOffline
                ? 'Exit Offline Mode'
                : isPlusActive
                  ? 'Switch to Offline Mode'
                  : 'Unlock Offline App Mode (Plus)'}
            </button>

            {pendingQueue.length > 0 && isOnline && !forcedOffline && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                {syncing ? 'Syncing...' : `Sync ${pendingQueue.length} Queued Updates`}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="relative h-full min-h-[240px] bg-slate-100 dark:bg-slate-800">
            {!imgError ? (
              <img
                src="/src/assets/images/offline_travel_learning_1795509263554.jpg"
                alt="High-speed train cabin overlooking alpine mountains with tablet for offline language study"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6 text-white">
                <span className="font-display text-lg font-semibold">Offline Study Packs</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs text-slate-200">
                {isPlusActive
                  ? 'PIRYAS Plus Active · Full Offline App & AI Coach Unlocked'
                  : 'Subscription Feature · Offline Mode + AI Coach'}
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                Flights, subways, and mountain trains — keep your daily streak alive offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 15 Language Offline Pack Manager */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Offline Language Packs (15 Languages)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPlusActive
                ? 'All 15 offline packs, 50 phases (500 CEFR challenges each), and cached studio voice audio are unlocked with your Plus subscription.'
                : 'Offline language pack downloads and offline study mode require a PIRYAS Plus subscription (Monthly, Annual, or Lifetime).'}
            </p>
          </div>
          {!isPlusActive && (
            <button
              onClick={onOpenPlusModal}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors self-start sm:self-auto cursor-pointer"
            >
              Subscribe for Offline Access
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANGUAGES.map((lang) => {
            const pack = packMap.get(lang.code);
            const isDownloading = downloadingCode === lang.code;
            const locked = !isPlusActive;

            return (
              <div
                key={lang.code}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        {lang.name}{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          · {lang.nativeName}
                        </span>
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        50 Phases · 500 challenges · {lang.flashcards.length} flashcards
                      </p>
                    </div>

                    {pack && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>

                  {pack && (
                    <p className="mt-3 font-mono text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                      Cached · {formatSize(pack.sizeBytes)} · {pack.audioClipsCount} studio audio clips
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {pack ? (
                    <>
                      <button
                        onClick={() => handleDownloadPack(lang)}
                        disabled={isDownloading}
                        className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {isDownloading ? 'Updating...' : 'Refresh Cache'}
                      </button>
                      <button
                        onClick={() => handleDeletePack(lang.code)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                        aria-label={`Remove ${lang.name} offline pack`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownloadPack(lang)}
                      disabled={isDownloading}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        locked
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
                      }`}
                    >
                      {locked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Plus Subscription Required
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          {isDownloading ? 'Caching Pack & Audio...' : 'Download Offline Pack'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
