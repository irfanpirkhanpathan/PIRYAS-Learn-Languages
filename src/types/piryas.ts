export type NavTab =
  | 'path'
  | 'challenges'
  | 'languages'
  | 'leaderboard'
  | 'refer'
  | 'subscription'
  | 'profile';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CEFRDifficulty = 'Foundation' | 'Intermediate' | 'Hard';

export type GuidedLevelDifficulty =
  | 'Easy'
  | 'Medium Easy'
  | 'Mediumly Hard'
  | 'Harder than B1'
  | 'Harder'
  | 'More Harder & Accurate';

export interface GuidedPathColorTheme {
  name: string;
  circleClass: string;
  ringClass: string;
  badgeTextClass: string;
}

export interface WordMeaningPair {
  word: string;
  meaning: string;
}

export interface WordFormItem {
  label: string;
  form: string;
  meaning: string;
}

export interface GuidedPathQuestion {
  id: string;
  questionNumber: number;
  isChallengeQuestion: boolean;
  kind: 'mcq' | 'hear_answer' | 'write_answer' | 'speak_answer' | 'sentence_builder';
  stageLabel?: string;
  prompt: string;
  attachedSentence: string;
  attachedSentenceKnown: string;
  wordMeanings: WordMeaningPair[];
  wordForms?: WordFormItem[];
  hintClue?: string;
  answerLangCode?: string;
  skippable: boolean;
  audioText: string;
  voiceLangCode: string;
  subHint?: string;
  phoneticHint?: string;
  options: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
}

export interface GuidedPathItem {
  id: string;
  pathNumber: number;
  level: CEFRLevel;
  difficultyLabel: GuidedLevelDifficulty;
  title: string;
  subtitle: string;
  newWordTarget: string;
  newWordKnown: string;
  worldLabel: string;
  colorTheme: GuidedPathColorTheme;
  commonQuestions: GuidedPathQuestion[];
  challengeQuestion: GuidedPathQuestion;
  mysteryBoxId: string;
  mysteryReward: {
    gems: number;
    xp: number;
    streakFreeze: boolean;
    label: string;
  };
}

export interface RealLifeEvidence {
  sourceType: string;
  contextLabel: string;
  targetExcerpt: string;
  knownExcerpt: string;
  usageTip: string;
}

export interface CEFRChallenge {
  id: string;
  index: number;
  phase: number;
  questionInPhase: number;
  phaseTitle: string;
  level: CEFRLevel;
  difficulty: CEFRDifficulty;
  category: string;
  direction: 'known_to_target' | 'target_to_known';
  promptQuestion: string;
  voiceText: string;
  voiceLangCode: string;
  options: string[];
  correctAnswer: string;
  englishReference: string;
  explanation: string;
  xpReward: number;
  imagePath: string;
  imageCaption: string;
  realLifeEvidence: RealLifeEvidence;
}

export type LanguageFamily = 'European' | 'East Asian' | 'Middle East & South Asia';

export interface FlashcardItem {
  id: string;
  term: string;
  romanization?: string;
  ipa: string;
  meaning: string;
  partOfSpeech: string;
  exampleTarget: string;
  exampleRomanization?: string;
  exampleEnglish: string;
  culturalNote: string;
}

export type GrammarExerciseType = 'fill_blank' | 'sentence_builder' | 'multiple_choice';

export interface GrammarExercise {
  id: string;
  type: GrammarExerciseType;
  topic: string;
  prompt: string;
  targetTemplate?: string;
  options: string[];
  correctAnswer: string;
  orderedTokens?: string[];
  explanation: string;
  audioSentence: string;
}

export interface LanguageCourse {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  family: LanguageFamily;
  script: string;
  cefrRange: string;
  speakers: string;
  greeting: string;
  voiceHint: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  flashcards: FlashcardItem[];
  grammar: GrammarExercise[];
}

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Obsidian';

export type SubscriptionPlanId = 'free' | 'hints_20' | 'ad_free' | 'monthly' | 'annual' | 'lifetime';

export interface AvatarFrame {
  id: string;
  name: string;
  description: string;
  unlockRequirement: string;
  ringClass: string;
  accentHex: string;
  minXp?: number;
  minStreak?: number;
  plusOnly?: boolean;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Study' | 'Streak' | 'Social' | 'Offline' | 'Plus';
  targetValue: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  xp: number;
  weeklyXp: number;
  monthlyXp: number;
  gems: number;
  streak: number;
  streakFreezes: number;
  dailyGoal: number;
  dailyXpToday: number;
  lastActiveDate: string;
  activeLanguage: string;
  knownLanguage: string;
  referralCode: string;
  referralsCount: number;
  referredBy?: string;
  activeFrameId: string;
  unlockedFrames: string[];
  earnedBadges: string[];
  subscriptionPlan: SubscriptionPlanId;
  subscriptionStatus: 'inactive' | 'active';
  freeHintsRemaining: number;
  unlimitedHints: boolean;
  weeklyHistory?: number[];
}

export interface LanguageProgressData {
  uid: string;
  langCode: string;
  xp: number;
  masteredCards: string[];
  completedGrammar: string[];
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  xp: number;
  weeklyXp: number;
  monthlyXp?: number;
  streak: number;
  activeFrameId: string;
  activeLanguage: string;
  badgesCount: number;
  league: LeagueTier;
  isPlus: boolean;
  isCoachBot?: boolean;
}

export interface XpDuel {
  id: string;
  challengerUid: string;
  challengerName: string;
  challengerFrame: string;
  opponentUid: string;
  opponentName: string;
  languageCode: string;
  targetXp: number;
  challengerXp: number;
  opponentXp: number;
  status: 'open' | 'active' | 'completed';
  winnerUid?: string;
}

export interface PurchaseReceipt {
  id?: string;
  uid: string;
  transactionId: string;
  planId: 'hints_20' | 'ad_free' | 'monthly' | 'annual' | 'lifetime';
  amountCents: number;
  currency: 'INR' | 'USD';
  paymentMethod: 'card' | 'upi' | 'wallet';
  cardLast4?: string;
  status: 'succeeded';
  createdAtIso?: string;
}

export interface OfflinePackMeta {
  langCode: string;
  downloadedAt: string;
  flashcardCount: number;
  grammarCount: number;
  audioClipsCount: number;
  sizeBytes: number;
}

export interface PendingSyncAction {
  id: string;
  type: 'xp_earned' | 'card_mastered' | 'grammar_completed';
  langCode: string;
  itemId?: string;
  xpDelta: number;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderLanguage: string;
  recipientUid: string;
  recipientName: string;
  languageCode: string;
  text: string;
  viaVoice: boolean;
  createdAtMs?: number;
}
