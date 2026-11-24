import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Heart,
  Layers,
  Lightbulb,
  Loader2,
  Lock,
  Mic,
  MicOff,
  SkipForward,
  Sparkles,
  Turtle,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { playFeedbackTone, speakNativePhrase, stopActiveSpeech } from '../lib/audio';
import type {
  GuidedPathItem,
  GuidedPathQuestion,
  LanguageCourse,
} from '../types/piryas';
import { GoogleAdSlot } from './GoogleAdSlot';

interface GuidedLessonModalProps {
  isOpen: boolean;
  course: LanguageCourse;
  guidedPath: GuidedPathItem | null;
  hearts: number;
  maxHearts: number;
  secondsUntilNextHeart: number | null;
  gems: number;
  isPlusActive: boolean;
  freeHintsRemaining: number;
  hasUnlimitedHints: boolean;
  isMysteryClaimed: boolean;
  forcedOffline: boolean;
  onLoseHeart: () => void;
  onRefillHearts: () => boolean;
  onUseHint: () => boolean;
  onOpenHintsUpgradeModal: () => void;
  onOpenPlusModal: () => void;
  onCompleteLesson: (result: {
    langCode: string;
    pathId: string;
    xpEarned: number;
    gemsEarned: number;
    accuracyPct: number;
  }) => Promise<void>;
  onClaimMysteryBox: (item: GuidedPathItem) => void;
  onClose: () => void;
}

interface SpeechRecognitionResultItem {
  isFinal?: boolean;
  0?: { transcript: string };
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultItem> }) => void) | null;
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

function normalizeAnswerText(val: string): string {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,!?।؟。、「」"'’`~:;()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n);
}

function isFlexibleAnswerMatch(
  input: string,
  expected: string,
  acceptedVariants: string[] = []
): boolean {
  const sNorm = normalizeAnswerText(input);
  if (!sNorm) return false;
  const targets = [expected, ...acceptedVariants].map(normalizeAnswerText).filter(Boolean);

  for (const tNorm of targets) {
    if (sNorm === tNorm) return true;
    const expectedWords = tNorm.split(' ').filter(Boolean);
    const spokenWords = new Set(sNorm.split(' ').filter(Boolean));
    if (expectedWords.length === 1) {
      if (spokenWords.has(expectedWords[0]) || levenshteinRatio(sNorm, tNorm) >= 0.72) {
        return true;
      }
    } else {
      const overlap = expectedWords.filter((w) => spokenWords.has(w)).length;
      if (overlap / expectedWords.length >= 0.65 || levenshteinRatio(sNorm, tNorm) >= 0.7) {
        return true;
      }
    }
  }
  return false;
}

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read recorded audio'));
    reader.readAsDataURL(blob);
  });
}

export const GuidedLessonModal: React.FC<GuidedLessonModalProps> = ({
  isOpen,
  course,
  guidedPath,
  hearts,
  maxHearts,
  secondsUntilNextHeart,
  gems,
  isPlusActive,
  freeHintsRemaining,
  hasUnlimitedHints,
  isMysteryClaimed,
  forcedOffline,
  onLoseHeart,
  onRefillHearts,
  onUseHint,
  onOpenHintsUpgradeModal,
  onOpenPlusModal,
  onCompleteLesson,
  onClaimMysteryBox,
  onClose,
}) => {
  const steps: GuidedPathQuestion[] = useMemo(() => {
    if (!guidedPath) return [];
    return [...guidedPath.commonQuestions, guidedPath.challengeQuestion];
  }, [guidedPath]);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [micFallbackMode, setMicFallbackMode] = useState(false);
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const [builtTokens, setBuiltTokens] = useState<string[]>([]);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [hintExhaustedPrompt, setHintExhaustedPrompt] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finished, setFinished] = useState(false);

  // AdSense break when every Guided Path finishes (for non-subscribers)
  const [completionAdSecondsLeft, setCompletionAdSecondsLeft] = useState(0);
  // Optional second ad gate for Mystery Box if user wants extra reward
  const [watchingMysteryAd, setWatchingMysteryAd] = useState(false);
  const [mysteryAdSecondsLeft, setMysteryAdSecondsLeft] = useState(0);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const latestSpokenRef = useRef<string>('');
  const feedbackRef = useRef<'correct' | 'incorrect' | null>(null);
  const currentStepRef = useRef<GuidedPathQuestion | undefined>(undefined);

  const currentStep = steps[stepIndex];
  currentStepRef.current = currentStep;
  feedbackRef.current = feedback;

  const stopAllMicResources = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    setMicLevel(0);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (isOpen && guidedPath) {
      setStepIndex(0);
      setSelectedOption(null);
      setWrittenAnswer('');
      setSpokenTranscript('');
      latestSpokenRef.current = '';
      setRecordedAudioUrl(null);
      setMicFallbackMode(false);
      setMicMessage(null);
      setIsTranscribing(false);
      setBuiltTokens([]);
      setHintRevealed(false);
      setHintExhaustedPrompt(false);
      setFeedback(null);
      setCombo(0);
      setCorrectCount(0);
      setFinished(false);
      setCompletionAdSecondsLeft(0);
      setWatchingMysteryAd(false);
      setMysteryAdSecondsLeft(0);
    }
    return () => {
      stopActiveSpeech();
      stopAllMicResources();
    };
  }, [isOpen, guidedPath, stopAllMicResources]);

  useEffect(() => {
    if (!finished || isPlusActive || completionAdSecondsLeft <= 0) return;
    const t = setTimeout(() => setCompletionAdSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [finished, isPlusActive, completionAdSecondsLeft]);

  useEffect(() => {
    if (!watchingMysteryAd || mysteryAdSecondsLeft <= 0) return;
    const t = setTimeout(() => setMysteryAdSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [watchingMysteryAd, mysteryAdSecondsLeft]);

  const availableTokens = useMemo(() => {
    if (!currentStep || currentStep.kind !== 'sentence_builder') return [];
    const remaining = [...currentStep.options];
    builtTokens.forEach((t) => {
      const idx = remaining.indexOf(t);
      if (idx !== -1) remaining.splice(idx, 1);
    });
    return remaining;
  }, [currentStep, builtTokens]);

  const gradeAnswerWithResult = useCallback(
    (isRight: boolean) => {
      if (feedbackRef.current !== null) return;
      feedbackRef.current = isRight ? 'correct' : 'incorrect';
      setFeedback(isRight ? 'correct' : 'incorrect');
      if (isRight) {
        playFeedbackTone(currentStepRef.current?.isChallengeQuestion ? 'combo' : 'correct');
        setCombo((c) => c + 1);
        setCorrectCount((c) => c + 1);
      } else {
        playFeedbackTone('incorrect');
        setCombo(0);
        if (!isPlusActive) {
          onLoseHeart();
        }
      }
    },
    [isPlusActive, onLoseHeart]
  );

  const evaluateSpeakTranscript = useCallback(
    (transcriptText: string) => {
      const step = currentStepRef.current;
      if (!step || feedbackRef.current !== null) return;
      const clean = transcriptText.trim();
      if (!clean) return;
      const matched = isFlexibleAnswerMatch(clean, step.correctAnswer, step.acceptedAnswers);
      gradeAnswerWithResult(matched);
    },
    [gradeAnswerWithResult]
  );

  if (!isOpen || !guidedPath || steps.length === 0 || !currentStep) return null;

  const outOfHearts = !isPlusActive && hearts <= 0 && !finished;
  const progressPct = finished ? 100 : Math.round((stepIndex / steps.length) * 100);

  const audioLanguage = getLanguageByCode(currentStep.voiceLangCode || course.code);
  const answerLanguage = getLanguageByCode(currentStep.answerLangCode || course.code);

  // Prevent audio from giving away the exact answer on write/speak/tile translation prompts until checked or hint unlocked
  const audioWouldSpoil =
    currentStep.kind !== 'hear_answer' &&
    (currentStep.voiceLangCode || course.code) === (currentStep.answerLangCode || course.code);
  const audioUnlocked = !audioWouldSpoil || feedback !== null || hintRevealed;

  const playAudio = async (text: string, slow = false) => {
    if (!audioUnlocked) return;
    stopAllMicResources();
    setIsSpeaking(true);
    await speakNativePhrase({
      text,
      bcp47: audioLanguage.bcp47,
      langCode: audioLanguage.code,
      languageName: audioLanguage.name,
      voiceHint: audioLanguage.voiceHint,
      slow,
      offlineOnly: forcedOffline,
    });
    setIsSpeaking(false);
  };

  const transcribeRecordedBlob = async (blob: Blob) => {
    const stepAtCapture = currentStepRef.current;
    if (!stepAtCapture) return;
    const expectedLang = getLanguageByCode(stepAtCapture.answerLangCode || course.code);
    setIsTranscribing(true);
    setMicMessage(`Analyzing your ${expectedLang.name} speech...`);
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          languageName: expectedLang.name,
        }),
      });
      if (!res.ok) {
        throw new Error('Speech transcription service unavailable');
      }
      const data = (await res.json()) as { transcript?: string };
      const recognized = (data.transcript || '').trim();
      if (!recognized) {
        setMicMessage(
          'No clear words detected. Tap Microphone to speak again, edit text below, or tap "Skip".'
        );
        return;
      }
      latestSpokenRef.current = recognized;
      setSpokenTranscript(recognized);
      setMicMessage(`Recognized speech: "${recognized}"`);
      evaluateSpeakTranscript(recognized);
    } catch {
      setMicMessage(
        'Voice captured! Type or verify what you spoke in the box below, then tap Check.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const startVoiceFallbackRecorder = async (existingStream?: MediaStream) => {
    try {
      const stream =
        existingStream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(buf);
          const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
          setMicLevel(Math.min(100, Math.round(avg * 1.8)));
          rafRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }

      if (typeof MediaRecorder !== 'undefined') {
        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = () => {
          if (chunks.length > 0) {
            const mimeType = recorder.mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            setRecordedAudioUrl(url);
            if (!forcedOffline) {
              transcribeRecordedBlob(blob);
            } else {
              setMicMessage(
                'Offline voice recorded. Type what you spoke below and tap Check.'
              );
            }
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
      }

      setMicFallbackMode(true);
      setIsRecording(true);
      setMicMessage(
        `Recording in ${answerLanguage.name} — speak clearly, then tap Stop Microphone to auto-transcribe & check.`
      );
    } catch {
      setMicMessage(
        'Microphone access was blocked by the browser. Allow microphone permission in your browser bar, type below, or tap "Skip".'
      );
      setMicFallbackMode(true);
      setIsRecording(false);
    }
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      const captured = latestSpokenRef.current;
      stopAllMicResources();
      if (captured.trim() && feedbackRef.current === null) {
        evaluateSpeakTranscript(captured);
      }
      return;
    }

    stopActiveSpeech();
    setMicMessage(null);
    setRecordedAudioUrl(null);
    latestSpokenRef.current = '';
    setSpokenTranscript('');

    let preGrantedStream: MediaStream | undefined;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        preGrantedStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setMicMessage(
          'Microphone permission denied. Enable mic access in your browser or use "Can\'t speak · Skip".'
        );
        return;
      }
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      await startVoiceFallbackRecorder(preGrantedStream);
      return;
    }

    if (preGrantedStream) {
      preGrantedStream.getTracks().forEach((t) => t.stop());
    }

    try {
      const recognition = new Ctor();
      recognition.lang = answerLanguage.bcp47;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        const parts: string[] = [];
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i += 1) {
          const res = event.results[i];
          if (res && res[0]?.transcript) {
            parts.push(res[0].transcript.trim());
            if (res.isFinal) hasFinal = true;
          }
        }
        const combined = parts.join(' ').trim();
        if (combined) {
          latestSpokenRef.current = combined;
          setSpokenTranscript(combined);
          if (hasFinal && feedbackRef.current === null) {
            try {
              recognition.stop();
            } catch {
              // ignore
            }
          }
        }
      };

      recognition.onerror = async (event) => {
        if (
          event.error === 'service-not-allowed' ||
          event.error === 'audio-capture' ||
          event.error === 'network'
        ) {
          recognitionRef.current = null;
          setIsRecording(false);
          await startVoiceFallbackRecorder();
        } else if (event.error === 'not-allowed') {
          setMicMessage(
            'Microphone permission denied. Allow microphone access or tap "Skip Question".'
          );
          setIsRecording(false);
        } else if (event.error === 'no-speech') {
          setMicMessage('No voice detected yet — hold mic steady and speak clearly.');
        } else {
          setMicMessage(`Voice error (${event.error}). Try speaking again or type your answer.`);
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        const captured = latestSpokenRef.current.trim();
        if (captured && feedbackRef.current === null) {
          evaluateSpeakTranscript(captured);
        }
      };

      recognitionRef.current = recognition;
      setMicFallbackMode(false);
      setIsRecording(true);
      recognition.start();
    } catch {
      await startVoiceFallbackRecorder();
    }
  };

  const resetStepState = () => {
    stopAllMicResources();
    setSelectedOption(null);
    setWrittenAnswer('');
    setSpokenTranscript('');
    latestSpokenRef.current = '';
    setRecordedAudioUrl(null);
    setMicFallbackMode(false);
    setMicMessage(null);
    setIsTranscribing(false);
    setBuiltTokens([]);
    setHintRevealed(false);
    setHintExhaustedPrompt(false);
    feedbackRef.current = null;
    setFeedback(null);
  };

  const advanceToNextStep = async (nextCorrectTotal: number) => {
    if (stepIndex + 1 >= steps.length) {
      const accuracyPct = Math.round((nextCorrectTotal / steps.length) * 100);
      const xpEarned = 50 + Math.round((accuracyPct / 100) * 40);
      const gemsEarned = accuracyPct >= 80 ? 25 : 15;
      setFinished(true);
      if (!isPlusActive) {
        setCompletionAdSecondsLeft(5);
      }
      playFeedbackTone('levelup');
      await onCompleteLesson({
        langCode: course.code,
        pathId: guidedPath.id,
        xpEarned,
        gemsEarned,
        accuracyPct,
      });
    } else {
      setStepIndex((i) => i + 1);
      resetStepState();
    }
  };

  const handleRequestHint = () => {
    if (hintRevealed || feedback !== null) return;
    const allowed = onUseHint();
    if (allowed) {
      playFeedbackTone('tap');
      setHintRevealed(true);
      setHintExhaustedPrompt(false);
    } else {
      playFeedbackTone('incorrect');
      setHintExhaustedPrompt(true);
    }
  };

  // Heart rule: wrong answer loses 1 heart; right answer NEVER increases or decreases heart.
  const handleCheck = () => {
    stopAllMicResources();
    let isRight = false;

    if (currentStep.kind === 'sentence_builder') {
      const built = builtTokens.join(' ').trim();
      if (!built) return;
      isRight = isFlexibleAnswerMatch(built, currentStep.correctAnswer, currentStep.acceptedAnswers);
    } else if (currentStep.kind === 'write_answer') {
      if (!writtenAnswer.trim()) return;
      isRight = isFlexibleAnswerMatch(
        writtenAnswer,
        currentStep.correctAnswer,
        currentStep.acceptedAnswers
      );
    } else if (currentStep.kind === 'speak_answer') {
      if (!spokenTranscript.trim()) return;
      isRight = isFlexibleAnswerMatch(
        spokenTranscript,
        currentStep.correctAnswer,
        currentStep.acceptedAnswers
      );
    } else {
      if (!selectedOption) return;
      isRight = selectedOption === currentStep.correctAnswer;
    }

    gradeAnswerWithResult(isRight);
  };

  const handleSkipQuestion = async () => {
    if (!currentStep.skippable) return;
    playFeedbackTone('tap');
    await advanceToNextStep(correctCount);
  };

  const handleContinue = async () => {
    await advanceToNextStep(correctCount);
  };

  const handleStartMysteryBoxReward = () => {
    if (isPlusActive) {
      playFeedbackTone('chest');
      onClaimMysteryBox(guidedPath);
    } else {
      playFeedbackTone('tap');
      setWatchingMysteryAd(true);
      setMysteryAdSecondsLeft(5);
    }
  };

  const canCheck =
    currentStep.kind === 'sentence_builder'
      ? builtTokens.length > 0
      : currentStep.kind === 'write_answer'
        ? writtenAnswer.trim().length > 0
        : currentStep.kind === 'speak_answer'
          ? spokenTranscript.trim().length > 0 && !isTranscribing
          : Boolean(selectedOption);

  const finalAccuracy = Math.round((correctCount / Math.max(1, steps.length)) * 100);
  const finalXp = 50 + Math.round((finalAccuracy / 100) * 40);
  const completionGateLocked = !isPlusActive && completionAdSecondsLeft > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-b from-sky-50 via-white to-emerald-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${course.name} Guided Path ${guidedPath.pathNumber}`}
    >
      {/* Top Progress, Hints & Hearts Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-5">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Exit guided path"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                currentStep.isChallengeQuestion ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {!finished && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
              <Lightbulb className="w-3.5 h-3.5" />
              {hasUnlimitedHints || isPlusActive ? '∞ Hints' : `${freeHintsRemaining}/10 Hints`}
            </span>
          )}

          {combo >= 2 && !finished && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
              <Flame className="w-4 h-4" />
              {combo}x
            </span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 font-mono text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              <Heart className="w-5 h-5 fill-current" />
              {isPlusActive ? '∞' : `${hearts}/${maxHearts}`}
            </span>
            {!isPlusActive && hearts < maxHearts && secondsUntilNextHeart !== null && (
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {formatCountdown(secondsUntilNextHeart)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        {outOfHearts ? (
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
              <Heart className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Out of Hearts (0/{maxHearts})
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Every heart recovers automatically in 1 hour.
                {secondsUntilNextHeart !== null && (
                  <>
                    {' '}
                    Next +1 heart in{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {formatCountdown(secondsUntilNextHeart)}
                    </strong>
                    .
                  </>
                )}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  const ok = onRefillHearts();
                  if (!ok) onOpenPlusModal();
                }}
                disabled={gems < 20}
                className="w-full py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold border-b-4 border-blue-900 active:border-b-0 active:translate-y-[3px] disabled:opacity-40 cursor-pointer"
              >
                Refill 5 Hearts (20 Gems · You have {gems})
              </button>
              <button
                onClick={onOpenPlusModal}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold cursor-pointer"
              >
                Go Ad-Free + Unlimited Hearts (₹200)
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Back to Guided Path
              </button>
            </div>
          </div>
        ) : finished ? (
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {course.name} · Path #{guidedPath.pathNumber} ({guidedPath.level} · {guidedPath.worldLabel})
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-white">
                Guided Path Complete!
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Completed 10 new words &amp; 10 sentences (20 questions). Path #
                {Math.min(100, guidedPath.pathNumber + 1)} is now unlocked!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-slate-800/70 border border-blue-200/70 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total XP</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-blue-700 dark:text-blue-400">
                  +{finalXp}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-slate-800/70 border border-emerald-200/70 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Accuracy</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {finalAccuracy}%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-slate-800/70 border border-amber-200/70 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Study Gems</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-amber-600">
                  +{finalAccuracy >= 80 ? 25 : 15}
                </p>
              </div>
            </div>

            {/* Automatic Google AdSense Break on every Guided Path Completion (Zero Ads for Subscribers) */}
            {!isPlusActive && (
              <div className="text-left space-y-2">
                <GoogleAdSlot
                  variant="completion"
                  isAdFree={isPlusActive}
                  onUpgradeAdFree={onOpenPlusModal}
                />
                {completionGateLocked && (
                  <p className="text-center font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                    Sponsored Path Break · Continue unlocks in {completionAdSecondsLeft}s (₹200 removes all ads)
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {!isMysteryClaimed ? (
                watchingMysteryAd && !isPlusActive ? (
                  <div className="space-y-3">
                    <GoogleAdSlot
                      variant="mystery"
                      isAdFree={isPlusActive}
                      onUpgradeAdFree={onOpenPlusModal}
                    />
                    <button
                      type="button"
                      disabled={mysteryAdSecondsLeft > 0}
                      onClick={() => {
                        setWatchingMysteryAd(false);
                        playFeedbackTone('chest');
                        onClaimMysteryBox(guidedPath);
                      }}
                      className="w-full py-3 rounded-xl bg-amber-400 text-slate-950 text-sm font-bold border-b-4 border-amber-600 disabled:opacity-50 cursor-pointer"
                    >
                      {mysteryAdSecondsLeft > 0
                        ? `Opening Mystery Box in ${mysteryAdSecondsLeft}s...`
                        : `Claim Mystery Box (${guidedPath.mysteryReward.label})`}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={completionGateLocked}
                    onClick={handleStartMysteryBoxReward}
                    className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-bold border-b-4 border-amber-600 hover:bg-amber-300 active:border-b-0 active:translate-y-[3px] inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Gift className="w-5 h-5" />
                    {isPlusActive
                      ? `Open Mystery Box (${guidedPath.mysteryReward.label})`
                      : `Watch Ad to Open Mystery Box (${guidedPath.mysteryReward.label})`}
                  </button>
                )
              ) : (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Mystery Box Claimed: {guidedPath.mysteryReward.label}
                </p>
              )}

              <button
                type="button"
                disabled={completionGateLocked}
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-bold border-b-4 border-emerald-800 hover:bg-emerald-700 active:border-b-0 active:translate-y-[3px] disabled:opacity-50 transition-all cursor-pointer"
              >
                {completionGateLocked
                  ? `Continue Guided Path (${completionAdSecondsLeft}s)`
                  : 'Continue Guided Path'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl w-full space-y-4">
            {/* Step Header & Question Prompt + Hint Action (NO answer revealed!) */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Path #{guidedPath.pathNumber} · {guidedPath.worldLabel} ·{' '}
                  {currentStep.stageLabel ||
                    (currentStep.isChallengeQuestion
                      ? 'Challenge Question'
                      : `Q${currentStep.questionNumber}/${steps.length}`)}
                </p>
                <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {currentStep.prompt}
                </h2>
              </div>

              {!feedback && (
                <button
                  type="button"
                  disabled={hintRevealed}
                  onClick={handleRequestHint}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                    hintRevealed
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                      : hasUnlimitedHints || isPlusActive || freeHintsRemaining > 0
                        ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'bg-indigo-700 border-indigo-800 text-white hover:bg-indigo-800'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {hintRevealed
                    ? 'Hint Shown'
                    : hasUnlimitedHints || isPlusActive
                      ? 'Hint (Unlimited)'
                      : freeHintsRemaining > 0
                        ? `Hint (${freeHintsRemaining}/10)`
                        : 'Unlock Hints (₹20)'}
                </button>
              )}
            </div>

            {/* Revealed Hint Clue (Only shown if user had hints & tapped Hint) */}
            {hintRevealed && currentStep.hintClue && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Clue
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 font-medium">
                    {currentStep.hintClue}
                  </p>
                </div>
              </div>
            )}

            {/* Exhausted 10 Free Hints -> ₹20 Unlimited Hints Subscription Prompt */}
            {hintExhaustedPrompt && !hasUnlimitedHints && !isPlusActive && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    All 10 Free Hints Used
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Unlock Unlimited Hints across all 100 Guided Paths for just ₹20.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenHintsUpgradeModal}
                  className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 shrink-0 cursor-pointer"
                >
                  Unlock Unlimited Hints · ₹20
                </button>
              </div>
            )}

            {/* Prompt-Language Word Forms Breakdown (Different grammatical forms without spoiling answer) */}
            {currentStep.wordForms && currentStep.wordForms.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  <Layers className="w-3.5 h-3.5" />
                  Word Forms &amp; Grammar Variations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentStep.wordForms.map((wf, idx) => (
                    <div
                      key={`${currentStep.id}-wf-${idx}`}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700"
                    >
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {wf.label}
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {wf.form}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {wf.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Native Voice Audio Strip (Locked before answer when audio would spoil answer) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={!audioUnlocked}
                  onClick={() => playAudio(currentStep.audioText, false)}
                  className={`w-12 h-12 rounded-2xl border-b-4 flex items-center justify-center shrink-0 transition-colors ${
                    audioUnlocked
                      ? 'bg-blue-700 text-white border-blue-900 hover:bg-blue-800 active:border-b-0 active:translate-y-[3px] cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                  }`}
                  aria-label="Play native speaker audio"
                >
                  {audioUnlocked ? (
                    <Volume2 className={`w-5 h-5 ${isSpeaking ? 'scale-110' : ''}`} />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {audioUnlocked
                      ? currentStep.subHint || `${audioLanguage.name} Native Voice`
                      : `${audioLanguage.name} Audio Locked`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {audioUnlocked
                      ? `Tap speaker to listen in ${audioLanguage.name}`
                      : 'Answer first or use a Hint to unlock answer pronunciation'}
                  </p>
                </div>
              </div>
              {audioUnlocked && (
                <button
                  type="button"
                  onClick={() => playAudio(currentStep.audioText, true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto cursor-pointer"
                >
                  <Turtle className="w-4 h-4" />
                  Slow 0.7x
                </button>
              )}
            </div>

            {/* Interactive Question Stage */}
            {currentStep.kind === 'sentence_builder' ? (
              <div className="space-y-4">
                <div className="min-h-20 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  {builtTokens.length === 0 ? (
                    <span className="text-sm text-slate-400">
                      Tap the word tiles below in exact {answerLanguage.name} grammatical order...
                    </span>
                  ) : (
                    builtTokens.map((tok, idx) => (
                      <button
                        key={`${tok}-${idx}`}
                        type="button"
                        disabled={feedback !== null}
                        onClick={() => setBuiltTokens((prev) => prev.filter((_, i) => i !== idx))}
                        className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold border-b-4 border-blue-900 cursor-pointer"
                      >
                        {tok}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {availableTokens.map((tok, idx) => (
                    <button
                      key={`${tok}-opt-${idx}`}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        playFeedbackTone('tap');
                        setBuiltTokens((prev) => [...prev, tok]);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-b-4 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white hover:border-blue-500 cursor-pointer"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>
            ) : currentStep.kind === 'write_answer' ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <label
                  htmlFor="guided-write-answer"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Write your {answerLanguage.name} answer below
                </label>
                <input
                  id="guided-write-answer"
                  type="text"
                  value={writtenAnswer}
                  disabled={feedback !== null}
                  onChange={(e) => setWrittenAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && writtenAnswer.trim() && feedback === null) {
                      handleCheck();
                    }
                  }}
                  placeholder={`Type your ${answerLanguage.name} translation here...`}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            ) : currentStep.kind === 'speak_answer' ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      Speak Your Answer in {answerLanguage.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Tap the microphone, speak clearly, and the system will auto-write and verify your answer.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={feedback !== null || isTranscribing}
                    onClick={handleToggleMic}
                    className={`px-5 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 border-b-4 active:border-b-0 active:translate-y-[3px] shrink-0 cursor-pointer disabled:opacity-50 ${
                      isRecording
                        ? 'bg-rose-600 border-rose-800 text-white'
                        : 'bg-indigo-700 border-indigo-900 text-white hover:bg-indigo-800'
                    }`}
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {isTranscribing
                      ? 'Transcribing...'
                      : isRecording
                        ? 'Stop & Check'
                        : 'Tap & Speak'}
                  </button>
                </div>

                {/* Live Mic Input Meter when recording */}
                {isRecording && (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${Math.max(12, micLevel)}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      Listening in {answerLanguage.name}...
                    </p>
                  </div>
                )}

                {recordedAudioUrl && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Recorded Voice Playback
                    </p>
                    <audio controls src={recordedAudioUrl} className="w-full h-8" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="guided-spoken-transcript"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                  >
                    Auto-Written Speech Answer {micFallbackMode ? '(AI transcribed or editable)' : '(auto-filled by mic)'}
                  </label>
                  <input
                    id="guided-spoken-transcript"
                    type="text"
                    disabled={feedback !== null || isTranscribing}
                    value={spokenTranscript}
                    onChange={(e) => {
                      latestSpokenRef.current = e.target.value;
                      setSpokenTranscript(e.target.value);
                    }}
                    placeholder={
                      isRecording
                        ? `Listening in ${answerLanguage.name}...`
                        : isTranscribing
                          ? 'Converting your speech into text...'
                          : 'Your spoken words will appear here automatically...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {micMessage && (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {micMessage}
                  </p>
                )}
              </div>
            ) : (
              /* MCQ & Hear & Answer MCQ Choices */
              <div className="grid grid-cols-1 gap-3">
                {currentStep.options.map((opt, idx) => {
                  const selected = selectedOption === opt;
                  const isCorrect = opt === currentStep.correctAnswer;
                  let cls =
                    'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500';
                  if (feedback) {
                    if (isCorrect) cls = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600';
                    else if (selected) cls = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500';
                  } else if (selected) {
                    cls = 'bg-blue-50 dark:bg-blue-950/50 border-blue-600';
                  }

                  return (
                    <button
                      key={`${currentStep.id}-opt-${idx}`}
                      type="button"
                      disabled={feedback !== null}
                      onClick={() => {
                        playFeedbackTone('tap');
                        setSelectedOption(opt);
                      }}
                      className={`p-4 rounded-xl border-2 border-b-4 text-left text-sm font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer ${cls}`}
                    >
                      <span className="font-mono text-xs text-slate-400 mr-2.5">{idx + 1}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Feedback, Skip & Check Bar */}
      {!outOfHearts && !finished && (
        <div
          className={`border-t transition-colors ${
            feedback === 'correct'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800'
              : feedback === 'incorrect'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {feedback ? (
              <div className="flex items-start gap-3">
                {feedback === 'correct' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-base font-bold ${
                      feedback === 'correct'
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {feedback === 'correct'
                      ? `Correct! Answer: ${currentStep.correctAnswer} (Hearts unchanged)`
                      : `Wrong answer${!isPlusActive ? ' (-1 Heart · 1h recovery)' : ''} — Answer: ${currentStep.correctAnswer}`}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {currentStep.explanation}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentStep.isChallengeQuestion
                  ? `Question 20 of ${steps.length} · Final Challenge`
                  : currentStep.kind === 'speak_answer'
                    ? "Speak clearly into mic or tap \"Can't speak · Skip\""
                    : currentStep.kind === 'hear_answer'
                      ? "Listen and answer or tap \"Can't hear · Skip\""
                      : `Question ${currentStep.questionNumber} of ${steps.length} · Wrong answer loses 1 heart`}
              </span>
            )}

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {!feedback && currentStep.skippable && (
                <button
                  type="button"
                  onClick={handleSkipQuestion}
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  {currentStep.kind === 'speak_answer'
                    ? "Can't speak · Skip"
                    : "Can't hear · Skip"}
                </button>
              )}

              {feedback ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`px-8 py-3 rounded-xl text-sm font-bold text-white border-b-4 active:border-b-0 active:translate-y-[3px] transition-all cursor-pointer ${
                    feedback === 'correct'
                      ? 'bg-emerald-600 border-emerald-800 hover:bg-emerald-700'
                      : 'bg-rose-600 border-rose-800 hover:bg-rose-700'
                  }`}
                >
                  {stepIndex + 1 >= steps.length ? 'Finish Path' : 'Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={!canCheck}
                  className="px-8 py-3 rounded-xl bg-emerald-600 border-b-4 border-emerald-800 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border-slate-300 dark:disabled:border-slate-700 disabled:text-slate-400 active:border-b-0 active:translate-y-[3px] transition-all cursor-pointer"
                >
                  Check
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
