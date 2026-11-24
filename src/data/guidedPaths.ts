import { MULTILINGUAL_CONCEPTS } from './cefrChallenges';
import { LANGUAGES } from './languages';
import { PROGRESSIVE_VOCAB_BANK } from './progressiveVocab';
import type {
  CEFRLevel,
  GuidedLevelDifficulty,
  GuidedPathColorTheme,
  GuidedPathItem,
  GuidedPathQuestion,
  LanguageCourse,
  WordFormItem,
  WordMeaningPair,
} from '../types/piryas';

export const PATH_COLOR_PALETTE: GuidedPathColorTheme[] = [
  {
    name: 'Indigo',
    circleClass: 'bg-indigo-600 border-indigo-800 text-white',
    ringClass: 'ring-indigo-500/30',
    badgeTextClass: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    name: 'Emerald',
    circleClass: 'bg-emerald-600 border-emerald-800 text-white',
    ringClass: 'ring-emerald-500/30',
    badgeTextClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    name: 'Amber',
    circleClass: 'bg-amber-500 border-amber-700 text-white',
    ringClass: 'ring-amber-500/30',
    badgeTextClass: 'text-amber-700 dark:text-amber-300',
  },
  {
    name: 'Rose',
    circleClass: 'bg-rose-600 border-rose-800 text-white',
    ringClass: 'ring-rose-500/30',
    badgeTextClass: 'text-rose-700 dark:text-rose-300',
  },
  {
    name: 'Cyan',
    circleClass: 'bg-cyan-600 border-cyan-800 text-white',
    ringClass: 'ring-cyan-500/30',
    badgeTextClass: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    name: 'Violet',
    circleClass: 'bg-violet-600 border-violet-800 text-white',
    ringClass: 'ring-violet-500/30',
    badgeTextClass: 'text-violet-700 dark:text-violet-300',
  },
  {
    name: 'Teal',
    circleClass: 'bg-teal-600 border-teal-800 text-white',
    ringClass: 'ring-teal-500/30',
    badgeTextClass: 'text-teal-700 dark:text-teal-300',
  },
  {
    name: 'Orange',
    circleClass: 'bg-orange-600 border-orange-800 text-white',
    ringClass: 'ring-orange-500/30',
    badgeTextClass: 'text-orange-700 dark:text-orange-300',
  },
  {
    name: 'Sky',
    circleClass: 'bg-sky-600 border-sky-800 text-white',
    ringClass: 'ring-sky-500/30',
    badgeTextClass: 'text-sky-700 dark:text-sky-300',
  },
  {
    name: 'Fuchsia',
    circleClass: 'bg-fuchsia-600 border-fuchsia-800 text-white',
    ringClass: 'ring-fuchsia-500/30',
    badgeTextClass: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
];

export interface GuidedLevelMeta {
  level: CEFRLevel;
  title: string;
  difficultyLabel: GuidedLevelDifficulty;
  pathCount: number;
  startPath: number;
  endPath: number;
}

export const GUIDED_LEVEL_SECTIONS: GuidedLevelMeta[] = [
  { level: 'A1', title: 'A1 · Easy', difficultyLabel: 'Easy', pathCount: 10, startPath: 1, endPath: 10 },
  { level: 'A2', title: 'A2 · Medium Easy', difficultyLabel: 'Medium Easy', pathCount: 10, startPath: 11, endPath: 20 },
  { level: 'B1', title: 'B1 · Mediumly Hard', difficultyLabel: 'Mediumly Hard', pathCount: 10, startPath: 21, endPath: 30 },
  { level: 'B2', title: 'B2 · Harder than B1', difficultyLabel: 'Harder than B1', pathCount: 10, startPath: 31, endPath: 40 },
  { level: 'C1', title: 'C1 · Harder', difficultyLabel: 'Harder', pathCount: 10, startPath: 41, endPath: 50 },
  { level: 'C2', title: 'C2 · Mastery & Accuracy', difficultyLabel: 'More Harder & Accurate', pathCount: 50, startPath: 51, endPath: 100 },
];

const C2_WORLD_THEMES = [
  'Editorial Studio World', 'Legal Chambers World', 'Diplomacy Summit World', 'Literature Salon World',
  'Broadcast Newsroom World', 'Economic Forum World', 'Civic Debate Hall World', 'University Seminar World',
  'Treaty Drafting World', 'Executive Boardroom World', 'Architectural Critique World', 'Scientific Review World',
];

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * 37 + i * 19 + 7) % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getLevelMetaForPath(pathNumber: number): GuidedLevelMeta {
  return (
    GUIDED_LEVEL_SECTIONS.find((s) => pathNumber >= s.startPath && pathNumber <= s.endPath) ||
    GUIDED_LEVEL_SECTIONS[0]
  );
}

function buildNearDistractors(
  targetText: string,
  correctRef: string,
  pool: string[],
  level: CEFRLevel,
  seed: number
): string[] {
  const distractors: string[] = [];
  for (let i = 0; i < pool.length && distractors.length < 3; i++) {
    const candidate = pool[(seed + i * 5) % pool.length];
    if (candidate && candidate !== targetText && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }
  if (distractors.length < 3 && (level === 'C1' || level === 'C2')) {
    const fallbacks = [
      `${correctRef} (informal variant)`,
      `${correctRef} (inverted conditional)`,
      `${correctRef} (passive register)`,
    ];
    for (const fb of fallbacks) {
      if (distractors.length < 3 && fb !== targetText && !distractors.includes(fb)) {
        distractors.push(fb);
      }
    }
  }
  while (distractors.length < 3) {
    distractors.push(`Variant option ${distractors.length + 1}`);
  }
  return distractors;
}

function extractWordMeanings(
  targetSentence: string,
  englishMeaning: string,
  extraPair?: WordMeaningPair
): WordMeaningPair[] {
  const targetParts = targetSentence
    .replace(/[.,!?¿¡।؟。、「」]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const englishParts = englishMeaning
    .replace(/[.,!?"]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const pairs: WordMeaningPair[] = [];
  if (extraPair) pairs.push(extraPair);

  const step = Math.max(1, Math.floor(targetParts.length / 3));
  for (let i = 0; i < targetParts.length && pairs.length < 4; i += step) {
    const tWord = targetParts[i];
    const engIdx = Math.min(
      Math.max(0, englishParts.length - 1),
      Math.round((i / Math.max(1, targetParts.length)) * englishParts.length)
    );
    const eWord = englishParts[engIdx] || englishMeaning;
    if (tWord && !pairs.some((p) => p.word === tWord)) {
      pairs.push({ word: tWord, meaning: eWord });
    }
  }
  return pairs;
}

function buildFormsForPromptWord(
  promptLangCode: string,
  promptWord: string,
  answerLangName: string,
  posHint: string
): WordFormItem[] {
  const cleaned = promptWord.replace(/[.,!?।]/g, '').trim();
  if (promptLangCode === 'en') {
    const plural = cleaned.endsWith('s') ? cleaned : `${cleaned}s`;
    return [
      { label: 'Base Form', form: cleaned, meaning: posHint },
      { label: 'Plural / Group Form', form: `${plural} (two or more)`, meaning: `Multiple ${cleaned.toLowerCase()}` },
      { label: 'Descriptive Form', form: `my ${cleaned.toLowerCase()} / the ${cleaned.toLowerCase()}`, meaning: `Ask ${answerLangName} meaning` },
    ];
  }
  if (promptLangCode === 'hi') {
    return [
      { label: 'मूल रूप (Base)', form: cleaned, meaning: posHint },
      { label: 'वाक्य प्रयोग (In Phrase)', form: `मेरा / यह ${cleaned}`, meaning: `${cleaned} in context` },
      { label: 'संदर्भ रूप (Related)', form: `${cleaned} वाला / वाली`, meaning: `Connected ${answerLangName} form` },
    ];
  }
  return [
    { label: 'Base Form', form: cleaned, meaning: posHint },
    { label: 'Plural / Extended', form: `${cleaned} (+)`, meaning: `Expanded form of ${cleaned}` },
    { label: 'Context Phrase', form: `"${cleaned}" in dialogue`, meaning: `Translate into ${answerLangName}` },
  ];
}

function buildHintClue(correctAnswer: string, phoneticHint?: string): string {
  const trimmed = correctAnswer.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const masked = words
    .map((w) => {
      if (w.length <= 2) return w[0] + '_';
      return `${w.slice(0, Math.min(2, w.length))}${'•'.repeat(Math.min(4, Math.max(1, w.length - 2)))}`;
    })
    .join(' ');
  return phoneticHint && phoneticHint !== trimmed
    ? `Starts with "${masked}" · Sound cue: ${phoneticHint}`
    : `Starts with "${masked}" (${words.length} ${words.length === 1 ? 'word' : 'words'})`;
}

interface UnifiedLexiconItem {
  wordTarget: string;
  wordKnown: string;
  phoneticTarget: string;
  phoneticKnown: string;
  sentenceTarget: string;
  sentenceKnown: string;
  englishSentence: string;
  worldTheme: string;
  pos: string;
}

function buildUnifiedPool(
  targetCourse: LanguageCourse,
  knownCourse: LanguageCourse
): UnifiedLexiconItem[] {
  const pool: UnifiedLexiconItem[] = [];

  for (const core of PROGRESSIVE_VOCAB_BANK) {
    pool.push({
      wordTarget: core.words[targetCourse.code] || core.english,
      wordKnown: core.words[knownCourse.code] || core.english,
      phoneticTarget: core.phonetic[targetCourse.code] || core.words[targetCourse.code] || core.english,
      phoneticKnown: core.phonetic[knownCourse.code] || core.words[knownCourse.code] || core.english,
      sentenceTarget: core.sentences[targetCourse.code] || core.englishSentence,
      sentenceKnown: core.sentences[knownCourse.code] || core.englishSentence,
      englishSentence: core.englishSentence,
      worldTheme: core.worldTheme,
      pos: 'Noun',
    });
  }

  for (const card of targetCourse.flashcards) {
    const knownMatch = knownCourse.flashcards.find(
      (k) => k.meaning.toLowerCase() === card.meaning.toLowerCase()
    );
    pool.push({
      wordTarget: card.term,
      wordKnown: knownMatch?.term || card.meaning,
      phoneticTarget: card.romanization || card.ipa || card.term,
      phoneticKnown: knownMatch?.romanization || card.meaning,
      sentenceTarget: card.exampleTarget,
      sentenceKnown:
        knownCourse.code === 'en'
          ? card.exampleEnglish
          : knownMatch?.exampleTarget || card.exampleEnglish,
      englishSentence: card.exampleEnglish,
      worldTheme: `${card.partOfSpeech} Studio`,
      pos: card.partOfSpeech,
    });
  }

  for (const concept of MULTILINGUAL_CONCEPTS.slice(0, 60)) {
    const tSent = concept.translations[targetCourse.code] || concept.english;
    const kSent = concept.translations[knownCourse.code] || concept.english;
    const tFirst = tSent.replace(/[.,!?।؟。]/g, '').split(/\s+/)[0] || tSent;
    const kFirst = kSent.replace(/[.,!?।؟。]/g, '').split(/\s+/)[0] || kSent;
    pool.push({
      wordTarget: tFirst,
      wordKnown: kFirst,
      phoneticTarget: tFirst,
      phoneticKnown: kFirst,
      sentenceTarget: tSent,
      sentenceKnown: kSent,
      englishSentence: concept.english,
      worldTheme: `${concept.category} World`,
      pos: concept.category,
    });
  }

  return pool;
}

export function generate100GuidedPaths(
  targetLangCode: string,
  knownLangCode: string
): GuidedPathItem[] {
  const targetCourse: LanguageCourse =
    LANGUAGES.find((l) => l.code === targetLangCode) || LANGUAGES[0];
  const rawKnown: LanguageCourse =
    LANGUAGES.find((l) => l.code === knownLangCode) ||
    LANGUAGES.find((l) => l.code === 'en') ||
    LANGUAGES[1];
  const knownCourse: LanguageCourse =
    rawKnown.code === targetCourse.code
      ? LANGUAGES.find((l) => l.code !== targetCourse.code) || rawKnown
      : rawKnown;

  const unifiedPool = buildUnifiedPool(targetCourse, knownCourse);
  const wordTargetPool = unifiedPool.map((u) => u.wordTarget);
  const wordKnownPool = unifiedPool.map((u) => u.wordKnown);
  const sentTargetPool = unifiedPool.map((u) => u.sentenceTarget);
  const sentKnownPool = unifiedPool.map((u) => u.sentenceKnown);

  const paths: GuidedPathItem[] = [];

  for (let pathNum = 1; pathNum <= 100; pathNum++) {
    const meta = getLevelMetaForPath(pathNum);
    const level = meta.level;
    const colorTheme = PATH_COLOR_PALETTE[(pathNum - 1) % PATH_COLOR_PALETTE.length];

    // Pick 10 distinct new words + 10 distinct sentences for this Guided Path
    const startIdx = pathNum === 1 ? 0 : ((pathNum - 1) * 3) % unifiedPool.length;
    const tenItems: UnifiedLexiconItem[] = [];
    const seenWords = new Set<string>();

    for (let k = 0; k < unifiedPool.length && tenItems.length < 10; k++) {
      const candidate = unifiedPool[(startIdx + k) % unifiedPool.length];
      if (!seenWords.has(candidate.wordTarget.toLowerCase())) {
        seenWords.add(candidate.wordTarget.toLowerCase());
        tenItems.push(candidate);
      }
    }
    while (tenItems.length < 10) {
      tenItems.push(unifiedPool[tenItems.length % unifiedPool.length]);
    }

    const leadItem = tenItems[0];
    const worldLabel =
      level === 'C2'
        ? C2_WORLD_THEMES[(pathNum - 51) % C2_WORLD_THEMES.length]
        : leadItem.worldTheme;

    const raw20Questions: GuidedPathQuestion[] = [];

    // PART A: 10 New Word Questions (with word forms shown in prompt language — NO answer shown!)
    tenItems.forEach((item, idx) => {
      const modeRoll = (pathNum + idx) % 4;
      const wTargetDistractors = buildNearDistractors(
        item.wordTarget,
        item.wordKnown,
        wordTargetPool,
        level,
        pathNum * 3 + idx
      );
      const wKnownDistractors = buildNearDistractors(
        item.wordKnown,
        item.wordTarget,
        wordKnownPool,
        level,
        pathNum * 5 + idx
      );

      if (modeRoll === 0) {
        // MCQ: Prompt in target word -> pick known meaning (Show target forms, NOT answer!)
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-w-${idx}`,
          questionNumber: idx + 1,
          isChallengeQuestion: false,
          kind: 'mcq',
          stageLabel: `New Word #${idx + 1} · Multiple Choice`,
          prompt: `Choose the ${knownCourse.name} meaning of "${item.wordTarget}"`,
          attachedSentence: item.wordTarget,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            targetCourse.code,
            item.wordTarget,
            knownCourse.name,
            item.pos
          ),
          hintClue: buildHintClue(item.wordKnown, item.phoneticKnown),
          answerLangCode: knownCourse.code,
          skippable: false,
          audioText: item.wordTarget,
          voiceLangCode: targetCourse.code,
          subHint: `Listen to ${targetCourse.name} pronunciation`,
          options: deterministicShuffle([item.wordKnown, ...wKnownDistractors], pathNum * 11 + idx),
          correctAnswer: item.wordKnown,
          acceptedAnswers: [item.wordKnown],
          explanation: `"${item.wordTarget}" means "${item.wordKnown}" in ${knownCourse.name}.`,
        });
      } else if (modeRoll === 1) {
        // Write Word: Prompt in known word -> user writes target word (Show known forms, NOT target answer!)
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-w-${idx}`,
          questionNumber: idx + 1,
          isChallengeQuestion: false,
          kind: 'write_answer',
          stageLabel: `New Word #${idx + 1} · Write the Word`,
          prompt: `Write the ${targetCourse.name} word for "${item.wordKnown}"`,
          attachedSentence: item.wordKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            item.pos
          ),
          hintClue: buildHintClue(item.wordTarget, item.phoneticTarget),
          answerLangCode: targetCourse.code,
          skippable: false,
          audioText: item.wordTarget,
          voiceLangCode: targetCourse.code,
          subHint: `Tap speaker if you want to hear the ${targetCourse.name} sound`,
          options: [item.wordTarget],
          correctAnswer: item.wordTarget,
          acceptedAnswers: [item.wordTarget, item.phoneticTarget],
          explanation: `In ${targetCourse.name}, "${item.wordKnown}" is written "${item.wordTarget}".`,
        });
      } else if (modeRoll === 2) {
        // Speak Word: Prompt asks to translate & speak into mic -> mic auto-writes & checks (NO answer shown!)
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-w-${idx}`,
          questionNumber: idx + 1,
          isChallengeQuestion: false,
          kind: 'speak_answer',
          stageLabel: `New Word #${idx + 1} · Speak in ${targetCourse.name}`,
          prompt: `Speak the ${targetCourse.name} word for "${item.wordKnown}" into the microphone`,
          attachedSentence: item.wordKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            item.pos
          ),
          hintClue: buildHintClue(item.wordTarget, item.phoneticTarget),
          answerLangCode: targetCourse.code,
          skippable: true,
          audioText: item.wordTarget,
          voiceLangCode: targetCourse.code,
          subHint: `Tap Microphone and say the ${targetCourse.name} translation`,
          options: [item.wordTarget],
          correctAnswer: item.wordTarget,
          acceptedAnswers: [item.wordTarget, item.phoneticTarget],
          explanation: `Spoken ${targetCourse.name}: "${item.wordTarget}" (${item.phoneticTarget}).`,
        });
      } else {
        // Hear Word: Listen and choose MCQ (Skippable)
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-w-${idx}`,
          questionNumber: idx + 1,
          isChallengeQuestion: false,
          kind: 'hear_answer',
          stageLabel: `New Word #${idx + 1} · Hear & Choose`,
          prompt: `Listen to the ${targetCourse.name} word and pick it below`,
          attachedSentence: '',
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            item.pos
          ),
          hintClue: buildHintClue(item.wordTarget, item.phoneticTarget),
          answerLangCode: targetCourse.code,
          skippable: true,
          audioText: item.wordTarget,
          voiceLangCode: targetCourse.code,
          subHint: `Tap speaker to hear the word (Skip if unable to listen)`,
          options: deterministicShuffle([item.wordTarget, ...wTargetDistractors], pathNum * 13 + idx),
          correctAnswer: item.wordTarget,
          acceptedAnswers: [item.wordTarget],
          explanation: `Audio word was "${item.wordTarget}" (${item.wordKnown}).`,
        });
      }
    });

    // PART B: 10 Sentence Questions built around those 10 words (random challenge formats)
    tenItems.forEach((item, idx) => {
      const sMode = (pathNum * 3 + idx) % 5;
      const sTargetDistractors = buildNearDistractors(
        item.sentenceTarget,
        item.englishSentence,
        sentTargetPool,
        level,
        pathNum * 7 + idx
      );
      const sKnownDistractors = buildNearDistractors(
        item.sentenceKnown,
        item.englishSentence,
        sentKnownPool,
        level,
        pathNum * 11 + idx
      );
      const tokens = item.sentenceTarget.split(/\s+/).filter(Boolean);
      const isLastSentence = idx === 9;

      if (isLastSentence || (sMode === 4 && tokens.length >= 3 && tokens.length <= 9)) {
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-s-${idx}`,
          questionNumber: 11 + idx,
          isChallengeQuestion: isLastSentence,
          kind: 'sentence_builder',
          stageLabel: isLastSentence
            ? `Final Challenge · Build Sentence`
            : `Sentence #${idx + 1} · Word Tiles`,
          prompt: `Arrange the words in exact ${targetCourse.name} order for "${item.sentenceKnown}"`,
          attachedSentence: item.sentenceKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            `Focus word: ${item.wordKnown}`
          ),
          hintClue: buildHintClue(item.sentenceTarget),
          answerLangCode: targetCourse.code,
          skippable: false,
          audioText: item.sentenceTarget,
          voiceLangCode: targetCourse.code,
          options: deterministicShuffle(tokens, pathNum * 17 + idx),
          correctAnswer: item.sentenceTarget,
          acceptedAnswers: [item.sentenceTarget],
          explanation: `Exact sentence: "${item.sentenceTarget}" = "${item.sentenceKnown}".`,
        });
      } else if (sMode === 0) {
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-s-${idx}`,
          questionNumber: 11 + idx,
          isChallengeQuestion: false,
          kind: 'mcq',
          stageLabel: `Sentence #${idx + 1} · Comprehension`,
          prompt: `What does "${item.sentenceTarget}" mean in ${knownCourse.name}?`,
          attachedSentence: item.sentenceTarget,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            targetCourse.code,
            item.wordTarget,
            knownCourse.name,
            `Key word in sentence`
          ),
          hintClue: buildHintClue(item.sentenceKnown),
          answerLangCode: knownCourse.code,
          skippable: false,
          audioText: item.sentenceTarget,
          voiceLangCode: targetCourse.code,
          options: deterministicShuffle([item.sentenceKnown, ...sKnownDistractors], pathNum * 19 + idx),
          correctAnswer: item.sentenceKnown,
          acceptedAnswers: [item.sentenceKnown],
          explanation: `"${item.sentenceTarget}" translates to "${item.sentenceKnown}".`,
        });
      } else if (sMode === 1) {
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-s-${idx}`,
          questionNumber: 11 + idx,
          isChallengeQuestion: false,
          kind: 'write_answer',
          stageLabel: `Sentence #${idx + 1} · Write Sentence`,
          prompt: `Write the ${targetCourse.name} sentence for "${item.sentenceKnown}"`,
          attachedSentence: item.sentenceKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            `Uses "${item.wordKnown}"`
          ),
          hintClue: buildHintClue(item.sentenceTarget),
          answerLangCode: targetCourse.code,
          skippable: false,
          audioText: item.sentenceTarget,
          voiceLangCode: targetCourse.code,
          options: [item.sentenceTarget],
          correctAnswer: item.sentenceTarget,
          acceptedAnswers: [item.sentenceTarget, item.englishSentence],
          explanation: `Expected sentence: "${item.sentenceTarget}".`,
        });
      } else if (sMode === 2) {
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-s-${idx}`,
          questionNumber: 11 + idx,
          isChallengeQuestion: false,
          kind: 'speak_answer',
          stageLabel: `Sentence #${idx + 1} · Speak Sentence`,
          prompt: `Speak the ${targetCourse.name} translation of "${item.sentenceKnown}"`,
          attachedSentence: item.sentenceKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            `Key word form`
          ),
          hintClue: buildHintClue(item.sentenceTarget),
          answerLangCode: targetCourse.code,
          skippable: true,
          audioText: item.sentenceTarget,
          voiceLangCode: targetCourse.code,
          subHint: `Tap Microphone, speak the sentence aloud, and let the system write & check`,
          options: [item.sentenceTarget],
          correctAnswer: item.sentenceTarget,
          acceptedAnswers: [item.sentenceTarget, item.wordTarget, item.phoneticTarget],
          explanation: `Correct spoken sentence: "${item.sentenceTarget}".`,
        });
      } else {
        raw20Questions.push({
          id: `${targetCourse.code}-gp-${pathNum}-s-${idx}`,
          questionNumber: 11 + idx,
          isChallengeQuestion: false,
          kind: 'mcq',
          stageLabel: `Sentence #${idx + 1} · Bridge Match`,
          prompt: `Select the accurate ${targetCourse.name} sentence for "${item.sentenceKnown}"`,
          attachedSentence: item.sentenceKnown,
          attachedSentenceKnown: '',
          wordMeanings: [],
          wordForms: buildFormsForPromptWord(
            knownCourse.code,
            item.wordKnown,
            targetCourse.name,
            `Focus word`
          ),
          hintClue: buildHintClue(item.sentenceTarget),
          answerLangCode: targetCourse.code,
          skippable: false,
          audioText: item.sentenceTarget,
          voiceLangCode: targetCourse.code,
          options: deterministicShuffle([item.sentenceTarget, ...sTargetDistractors], pathNum * 23 + idx),
          correctAnswer: item.sentenceTarget,
          acceptedAnswers: [item.sentenceTarget],
          explanation: `Matched ${targetCourse.name} sentence: "${item.sentenceTarget}".`,
        });
      }
    });

    // Randomize order of first 19 questions (mixing words + sentences randomly), keep #20 as final challenge
    const first19 = deterministicShuffle(raw20Questions.slice(0, 19), pathNum * 43 + targetCourse.code.charCodeAt(0));
    const final20 = raw20Questions[19];
    const numbered19 = first19.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    const challengeQuestion: GuidedPathQuestion = {
      ...final20,
      questionNumber: 20,
      isChallengeQuestion: true,
      wordMeanings: extractWordMeanings(leadItem.sentenceTarget, leadItem.englishSentence),
    };

    const mysteryGems = 25 + ((pathNum * 5) % 35);
    const mysteryXp = level === 'C2' ? 90 : level === 'C1' ? 75 : level === 'B2' ? 60 : 45;
    const streakFreeze = pathNum % 5 === 0;

    paths.push({
      id: `${targetCourse.code}-gp-${pathNum}`,
      pathNumber: pathNum,
      level,
      difficultyLabel: meta.difficultyLabel,
      title: `${worldLabel} · Path ${pathNum}`,
      subtitle: `10 New Words + 10 Sentences · 20 Questions`,
      newWordTarget: leadItem.wordTarget,
      newWordKnown: leadItem.wordKnown,
      worldLabel,
      colorTheme,
      commonQuestions: numbered19,
      challengeQuestion,
      mysteryBoxId: `${targetCourse.code}-mb-${pathNum}`,
      mysteryReward: {
        gems: mysteryGems,
        xp: mysteryXp,
        streakFreeze,
        label: streakFreeze
          ? `+${mysteryGems} Gems, +${mysteryXp} XP & +1 Streak Freeze`
          : `+${mysteryGems} Study Gems & +${mysteryXp} Bonus XP`,
      },
    });
  }

  return paths;
}
