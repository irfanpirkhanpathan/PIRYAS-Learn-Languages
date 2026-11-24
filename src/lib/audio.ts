import { getCachedAudio, saveCachedAudio } from './offlineDb';

let activeAudioEl: HTMLAudioElement | null = null;

export function makeAudioCacheKey(langCode: string, text: string, slow: boolean): string {
  return `${langCode}:${slow ? 'slow' : 'norm'}:${text.trim()}`;
}

export async function fetchAndCacheNativeAudio(params: {
  text: string;
  langCode: string;
  languageName: string;
  voiceHint: string;
  slow?: boolean;
}): Promise<string | null> {
  const slow = Boolean(params.slow);
  const cacheKey = makeAudioCacheKey(params.langCode, params.text, slow);
  const cached = await getCachedAudio(cacheKey);
  if (cached) return cached;

  try {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        languageName: params.languageName,
        voice: params.voiceHint,
        slow,
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { audioBase64?: string };
    if (data.audioBase64) {
      await saveCachedAudio(cacheKey, data.audioBase64);
      return data.audioBase64;
    }
    return null;
  } catch {
    return null;
  }
}

export function stopActiveSpeech(): void {
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakNativePhrase(params: {
  text: string;
  bcp47: string;
  langCode: string;
  languageName: string;
  voiceHint: string;
  slow?: boolean;
  offlineOnly?: boolean;
}): Promise<'studio' | 'cached' | 'speech_api' | 'unavailable'> {
  stopActiveSpeech();
  const slow = Boolean(params.slow);
  const cacheKey = makeAudioCacheKey(params.langCode, params.text, slow);

  // 1. Check IndexedDB cached WAV first (works offline and online instantaneously)
  const cached = await getCachedAudio(cacheKey);
  if (cached) {
    await playBase64Wav(cached);
    return 'cached';
  }

  // 2. If online and not forced offline, fetch Studio Native Audio via Gemini TTS and cache it
  if (!params.offlineOnly && (typeof navigator === 'undefined' || navigator.onLine)) {
    const fetched = await fetchAndCacheNativeAudio(params);
    if (fetched) {
      await playBase64Wav(fetched);
      return 'studio';
    }
  }

  // 3. Offline / Instant fallback: native Web Speech Synthesis with BCP-47 accent matching
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(params.text);
      utterance.lang = params.bcp47;
      utterance.rate = slow ? 0.72 : 0.96;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = params.bcp47.split('-')[0].toLowerCase();
      const matchedVoice =
        voices.find((v) => v.lang.toLowerCase() === params.bcp47.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => resolve('speech_api');
      utterance.onerror = () => resolve('speech_api');
      window.speechSynthesis.speak(utterance);
    });
  }

  return 'unavailable';
}

function playBase64Wav(base64: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    activeAudioEl = audio;
    audio.onended = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      resolve();
    };
    audio.onerror = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      resolve();
    };
    audio.play().catch(() => resolve());
  });
}

let soundEnabled = true;

export function setSoundEffectsEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEffectsEnabled(): boolean {
  return soundEnabled;
}

export function playFeedbackTone(
  kind: 'correct' | 'incorrect' | 'levelup' | 'tap' | 'combo' | 'chest'
): void {
  if (!soundEnabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes =
      kind === 'tap'
        ? [440]
        : kind === 'correct'
          ? [523.25, 659.25]
          : kind === 'combo'
            ? [587.33, 739.99, 880]
            : kind === 'chest'
              ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
              : kind === 'levelup'
                ? [523.25, 659.25, 783.99, 1046.5]
                : [293.66, 246.94];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'tap' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(kind === 'tap' ? 0.04 : 0.08, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.18);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
