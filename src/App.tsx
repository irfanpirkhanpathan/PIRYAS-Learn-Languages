import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ChallengesHub, type ChallengeSubMode } from './components/ChallengesHub';
import { GoogleAdSlot } from './components/GoogleAdSlot';
import { GuidedLessonModal } from './components/GuidedLessonModal';
import { GuidedPathView } from './components/GuidedPathView';
import { Header } from './components/Header';
import { KnownLanguageModal } from './components/KnownLanguageModal';
import { LanguagesHub } from './components/LanguagesHub';
import { LeaderboardChatHub } from './components/LeaderboardChatHub';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PaymentGatewayModal, type PaidPlanChoice } from './components/PaymentGatewayModal';
import { ProfileHub } from './components/ProfileHub';
import { ReferHub } from './components/ReferHub';
import { SubscriptionHub } from './components/SubscriptionHub';
import { AVATAR_FRAMES, computeLeague } from './data/gamification';
import { getLanguageByCode } from './data/languages';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { playFeedbackTone } from './lib/audio';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from './lib/firebase';
import {
  getAllOfflinePacks,
  loadLocalState,
  saveLocalState,
} from './lib/offlineDb';
import type {
  ChatMessage,
  GuidedPathItem,
  LanguageProgressData,
  LeaderboardEntry,
  NavTab,
  OfflinePackMeta,
  PendingSyncAction,
  PurchaseReceipt,
  UserProfile,
  XpDuel,
} from './types/piryas';

const MAX_HEARTS = 5;
const HEART_RECOVERY_MS = 3600_000; // 1 hour per heart
const HEARTS_STORAGE_KEY = 'piryas_hearts_v1';

interface HeartStoreState {
  hearts: number;
  nextRecoveryAt: number | null;
}

function loadInitialHeartState(): HeartStoreState {
  if (typeof window === 'undefined') {
    return { hearts: MAX_HEARTS, nextRecoveryAt: null };
  }
  try {
    const raw = localStorage.getItem(HEARTS_STORAGE_KEY);
    if (!raw) return { hearts: MAX_HEARTS, nextRecoveryAt: null };
    const parsed = JSON.parse(raw) as Partial<HeartStoreState>;
    let h = typeof parsed.hearts === 'number' ? Math.max(0, Math.min(MAX_HEARTS, parsed.hearts)) : MAX_HEARTS;
    let nextAt = typeof parsed.nextRecoveryAt === 'number' ? parsed.nextRecoveryAt : null;
    if (h < MAX_HEARTS && nextAt !== null) {
      const now = Date.now();
      if (now >= nextAt) {
        const gained = 1 + Math.floor((now - nextAt) / HEART_RECOVERY_MS);
        h = Math.min(MAX_HEARTS, h + gained);
        nextAt = h >= MAX_HEARTS ? null : nextAt + gained * HEART_RECOVERY_MS;
      }
    } else if (h >= MAX_HEARTS) {
      nextAt = null;
    }
    return { hearts: h, nextRecoveryAt: nextAt };
  } catch {
    return { hearts: MAX_HEARTS, nextRecoveryAt: null };
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function generateReferralCode(uid?: string): string {
  const seed = (uid || `${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const tail = (seed.slice(0, 5) || 'LEARN').padEnd(5, 'X');
  return `PIRYAS-${tail}`;
}

function createDefaultProfile(user?: User | null): UserProfile {
  return {
    uid: user?.uid || 'local-learner',
    displayName: user?.displayName || 'Polyglot Learner',
    email: user?.email || undefined,
    xp: 0,
    weeklyXp: 0,
    monthlyXp: 0,
    gems: 50,
    streak: 1,
    streakFreezes: 1,
    dailyGoal: 50,
    dailyXpToday: 0,
    lastActiveDate: todayIsoDate(),
    activeLanguage: 'en',
    knownLanguage: 'hi',
    referralCode: generateReferralCode(user?.uid),
    referralsCount: 0,
    activeFrameId: 'slate',
    unlockedFrames: ['slate'],
    earnedBadges: [],
    subscriptionPlan: 'free',
    subscriptionStatus: 'inactive',
    freeHintsRemaining: 10,
    unlimitedHints: false,
    weeklyHistory: [0, 0, 0, 0, 0, 0, 0],
  };
}

function evaluateUnlockedRewards(
  profile: UserProfile,
  progressMap: Record<string, LanguageProgressData>,
  offlinePacksCount: number,
  hasDuelActivity: boolean
): { unlockedFrames: string[]; earnedBadges: string[]; newlyEarned: boolean } {
  const frameSet = new Set(profile.unlockedFrames);
  AVATAR_FRAMES.forEach((frame) => {
    if (frame.plusOnly && profile.subscriptionStatus === 'active') frameSet.add(frame.id);
    if (!frame.plusOnly) {
      const xpOk = frame.minXp !== undefined && profile.xp >= frame.minXp;
      const streakOk = frame.minStreak !== undefined && profile.streak >= frame.minStreak;
      if (xpOk || streakOk) frameSet.add(frame.id);
    }
  });

  const badgeSet = new Set(profile.earnedBadges);
  const allMastered = Object.values(progressMap).reduce((s, p) => s + p.masteredCards.length, 0);
  const allGrammar = Object.values(progressMap).reduce((s, p) => s + p.completedGrammar.length, 0);
  const activeLanguagesCount = Object.values(progressMap).filter(
    (p) => p.xp > 0 || p.masteredCards.length > 0 || p.completedGrammar.length > 0
  ).length;

  if (allMastered >= 1) badgeSet.add('first_word');
  if (allGrammar >= 5) badgeSet.add('grammar_architect');
  if (profile.dailyXpToday >= profile.dailyGoal) badgeSet.add('daily_goal_hit');
  if (profile.streak >= 3) badgeSet.add('streak_three');
  if (profile.streak >= 7) badgeSet.add('streak_seven');
  if (activeLanguagesCount >= 3) badgeSet.add('polyglot_trio');
  if (profile.xp >= 500) badgeSet.add('xp_500');
  if (offlinePacksCount >= 1) badgeSet.add('offline_explorer');
  if (hasDuelActivity) badgeSet.add('social_duelist');
  if (profile.subscriptionStatus === 'active') badgeSet.add('plus_patron');

  const unlockedFrames = Array.from(frameSet);
  const earnedBadges = Array.from(badgeSet);
  const newlyEarned =
    unlockedFrames.length > profile.unlockedFrames.length ||
    earnedBadges.length > profile.earnedBadges.length;

  return { unlockedFrames, earnedBadges, newlyEarned };
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<NavTab>('path');
  const [challengeSubMode, setChallengeSubMode] = useState<ChallengeSubMode>('phases');
  const [forcedOffline, setForcedOffline] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('piryas_theme') === 'dark';
    }
    return false;
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => createDefaultProfile(null));
  const [progressMap, setProgressMap] = useState<Record<string, LanguageProgressData>>({});
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [offlinePacks, setOfflinePacks] = useState<OfflinePackMeta[]>([]);
  const [pendingQueue, setPendingQueue] = useState<PendingSyncAction[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [duels, setDuels] = useState<XpDuel[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [plusModalOpen, setPlusModalOpen] = useState(false);
  const [paymentInitialPlan, setPaymentInitialPlan] = useState<PaidPlanChoice>('ad_free');
  const [knownModalOpen, setKnownModalOpen] = useState(false);

  const openCheckout = useCallback((planId: PaidPlanChoice = 'ad_free') => {
    setPaymentInitialPlan(planId);
    setPlusModalOpen(true);
  }, []);
  const [activeGuidedPath, setActiveGuidedPath] = useState<GuidedPathItem | null>(null);
  const [heartState, setHeartState] = useState<HeartStoreState>(() => loadInitialHeartState());
  const [secondsUntilNextHeart, setSecondsUntilNextHeart] = useState<number | null>(() => {
    const init = loadInitialHeartState();
    return init.hearts < MAX_HEARTS && init.nextRecoveryAt
      ? Math.max(1, Math.ceil((init.nextRecoveryAt - Date.now()) / 1000))
      : null;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [celebrateStreakKey, setCelebrateStreakKey] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((cur) => (cur === msg ? null : cur)), 3500);
  }, []);

  const triggerStreakCelebrationIfHit = useCallback(
    (prevDailyXp: number, prevDate: string, nextDailyXp: number, goal: number, today: string) => {
      const crossedGoalToday = (prevDate !== today || prevDailyXp < goal) && nextDailyXp >= goal;
      let alreadyCelebratedToday = false;
      try {
        alreadyCelebratedToday = localStorage.getItem('piryas_streak_celebrated_date') === today;
      } catch {
        // ignore storage errors
      }
      if (crossedGoalToday && !alreadyCelebratedToday) {
        try {
          localStorage.setItem('piryas_streak_celebrated_date', today);
        } catch {
          // ignore storage errors
        }
        setCelebrateStreakKey((k) => k + 1);
        playFeedbackTone('levelup');
        showToast('Daily Streak Milestone Completed!');
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (celebrateStreakKey === 0) return;
    const timer = setTimeout(() => setCelebrateStreakKey(0), 5500);
    return () => clearTimeout(timer);
  }, [celebrateStreakKey]);

  // Persist hearts + run live 1-hour heart recovery ticker
  useEffect(() => {
    try {
      localStorage.setItem(HEARTS_STORAGE_KEY, JSON.stringify(heartState));
    } catch {
      // ignore storage quota errors
    }

    if (heartState.hearts >= MAX_HEARTS || heartState.nextRecoveryAt === null) {
      setSecondsUntilNextHeart(null);
      return;
    }

    const updateTick = () => {
      const now = Date.now();
      const target = heartState.nextRecoveryAt;
      if (target === null) {
        setSecondsUntilNextHeart(null);
        return;
      }
      if (now >= target) {
        const gained = 1 + Math.floor((now - target) / HEART_RECOVERY_MS);
        const nextHearts = Math.min(MAX_HEARTS, heartState.hearts + gained);
        const nextAt = nextHearts >= MAX_HEARTS ? null : target + gained * HEART_RECOVERY_MS;
        setHeartState({ hearts: nextHearts, nextRecoveryAt: nextAt });
        showToast('+1 Heart recovered!');
      } else {
        setSecondsUntilNextHeart(Math.max(1, Math.ceil((target - now) / 1000)));
      }
    };

    updateTick();
    const id = setInterval(updateTick, 1000);
    return () => clearInterval(id);
  }, [heartState, showToast]);

  // Theme class sync
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('piryas_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('piryas_theme', 'light');
    }
  }, [darkMode]);

  const refreshOfflinePacks = useCallback(async () => {
    const packs = await getAllOfflinePacks();
    setOfflinePacks(packs);
  }, []);

  // Boot: load local state & test Firestore connectivity
  useEffect(() => {
    testConnection();
    refreshOfflinePacks();
    loadLocalState().then((local) => {
      if (local.profile) setProfile(local.profile);
      if (local.progressMap) setProgressMap(local.progressMap);
      if (local.receipts) setReceipts(local.receipts);
      if (local.pendingQueue) setPendingQueue(local.pendingQueue);
    });
  }, [refreshOfflinePacks]);

  // Helper to sync user profile & leaderboard entry to Firestore
  const persistProfileToCloud = useCallback(
    async (nextProfile: UserProfile, isCreate = false) => {
      if (!firebaseUser || !isOnline || forcedOffline) return;
      const userPath = `users/${firebaseUser.uid}`;
      const lbPath = `leaderboard/${firebaseUser.uid}`;

      const userPayload: Record<string, unknown> = {
        uid: firebaseUser.uid,
        displayName: nextProfile.displayName.slice(0, 80) || 'Polyglot Learner',
        xp: nextProfile.xp,
        weeklyXp: nextProfile.weeklyXp,
        monthlyXp: nextProfile.monthlyXp ?? nextProfile.weeklyXp,
        gems: nextProfile.gems,
        streak: nextProfile.streak,
        streakFreezes: nextProfile.streakFreezes,
        dailyGoal: nextProfile.dailyGoal,
        dailyXpToday: nextProfile.dailyXpToday,
        lastActiveDate: nextProfile.lastActiveDate,
        activeLanguage: nextProfile.activeLanguage,
        knownLanguage: nextProfile.knownLanguage || 'en',
        referralCode: nextProfile.referralCode || generateReferralCode(firebaseUser.uid),
        referralsCount: nextProfile.referralsCount || 0,
        activeFrameId: nextProfile.activeFrameId,
        unlockedFrames: nextProfile.unlockedFrames.slice(0, 20),
        earnedBadges: nextProfile.earnedBadges.slice(0, 30),
        subscriptionPlan: nextProfile.subscriptionPlan,
        subscriptionStatus: nextProfile.subscriptionStatus,
        freeHintsRemaining: Math.max(0, nextProfile.freeHintsRemaining ?? 10),
        unlimitedHints: Boolean(nextProfile.unlimitedHints),
        updatedAt: serverTimestamp(),
      };
      if (firebaseUser.email) {
        userPayload.email = firebaseUser.email;
      }
      if (nextProfile.referredBy) {
        userPayload.referredBy = nextProfile.referredBy;
      }

      try {
        if (isCreate) {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...userPayload,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            displayName: userPayload.displayName,
            xp: userPayload.xp,
            weeklyXp: userPayload.weeklyXp,
            monthlyXp: userPayload.monthlyXp,
            gems: userPayload.gems,
            streak: userPayload.streak,
            streakFreezes: userPayload.streakFreezes,
            dailyGoal: userPayload.dailyGoal,
            dailyXpToday: userPayload.dailyXpToday,
            lastActiveDate: userPayload.lastActiveDate,
            activeLanguage: userPayload.activeLanguage,
            knownLanguage: userPayload.knownLanguage,
            referralCode: userPayload.referralCode,
            referralsCount: userPayload.referralsCount,
            ...(userPayload.referredBy ? { referredBy: userPayload.referredBy } : {}),
            activeFrameId: userPayload.activeFrameId,
            unlockedFrames: userPayload.unlockedFrames,
            earnedBadges: userPayload.earnedBadges,
            freeHintsRemaining: userPayload.freeHintsRemaining,
            unlimitedHints: userPayload.unlimitedHints,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, isCreate ? OperationType.CREATE : OperationType.UPDATE, userPath);
      }

      try {
        await setDoc(doc(db, 'leaderboard', firebaseUser.uid), {
          uid: firebaseUser.uid,
          displayName: nextProfile.displayName.slice(0, 80) || 'Polyglot Learner',
          xp: nextProfile.xp,
          weeklyXp: nextProfile.weeklyXp,
          monthlyXp: nextProfile.monthlyXp ?? nextProfile.weeklyXp,
          streak: nextProfile.streak,
          activeFrameId: nextProfile.activeFrameId,
          activeLanguage: nextProfile.activeLanguage,
          badgesCount: nextProfile.earnedBadges.length,
          league: computeLeague(nextProfile.weeklyXp),
          isPlus: nextProfile.subscriptionStatus === 'active',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, lbPath);
      }
    },
    [firebaseUser, isOnline, forcedOffline]
  );

  // Firebase Auth listener & initial profile hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<UserProfile>;
          const today = todayIsoDate();
          const sameDay = data.lastActiveDate === today;
          const hydrated: UserProfile = {
            ...createDefaultProfile(user),
            ...data,
            uid: user.uid,
            monthlyXp: data.monthlyXp ?? data.weeklyXp ?? 0,
            freeHintsRemaining: data.freeHintsRemaining ?? 10,
            unlimitedHints: Boolean(data.unlimitedHints),
            dailyXpToday: sameDay ? data.dailyXpToday || 0 : 0,
          };
          setProfile(hydrated);
          await saveLocalState({ profile: hydrated });
        } else {
          const fresh = createDefaultProfile(user);
          // Merge any local XP earned before signing in
          setProfile((prev) => {
            const merged: UserProfile = {
              ...fresh,
              xp: prev.xp,
              weeklyXp: prev.weeklyXp,
              monthlyXp: prev.monthlyXp ?? prev.weeklyXp,
              gems: Math.max(fresh.gems, prev.gems),
              dailyXpToday: prev.dailyXpToday,
              activeLanguage: prev.activeLanguage,
              earnedBadges: prev.earnedBadges,
              unlockedFrames: prev.unlockedFrames,
            };
            persistProfileToCloud(merged, true);
            saveLocalState({ profile: merged });
            return merged;
          });
        }

        // Load languageProgress subcollection
        const lpSnap = await getDocs(
          query(collection(db, `users/${user.uid}/languageProgress`), where('uid', '==', user.uid))
        );
        const loadedMap: Record<string, LanguageProgressData> = {};
        lpSnap.forEach((d) => {
          const val = d.data() as LanguageProgressData;
          loadedMap[val.langCode] = val;
        });
        if (Object.keys(loadedMap).length > 0) {
          setProgressMap(loadedMap);
          await saveLocalState({ progressMap: loadedMap });
        }

        // Load purchase receipts subcollection
        const purSnap = await getDocs(
          query(collection(db, `users/${user.uid}/purchases`), where('uid', '==', user.uid))
        );
        const loadedReceipts: PurchaseReceipt[] = [];
        purSnap.forEach((d) => {
          loadedReceipts.push({ id: d.id, ...(d.data() as PurchaseReceipt) });
        });
        if (loadedReceipts.length > 0) {
          setReceipts(loadedReceipts);
          await saveLocalState({ receipts: loadedReceipts });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }
    });
    return () => unsub();
  }, [persistProfileToCloud]);

  // Firestore real-time Leaderboard & Social Duels listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setLeaderboardEntries([]);
      setDuels([]);
      setChatMessages([]);
      return;
    }

    const lbQuery = query(
      collection(db, 'leaderboard'),
      where('xp', '>=', 0),
      orderBy('xp', 'desc'),
      limit(50)
    );
    const unsubLb = onSnapshot(
      lbQuery,
      (snap) => {
        const list: LeaderboardEntry[] = [];
        snap.forEach((d) => list.push(d.data() as LeaderboardEntry));
        setLeaderboardEntries(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'leaderboard')
    );

    const openDuelsQ = query(
      collection(db, 'duels'),
      where('status', '==', 'open'),
      limit(20)
    );
    const myChallengerQ = query(
      collection(db, 'duels'),
      where('challengerUid', '==', firebaseUser.uid),
      limit(20)
    );
    const myOpponentQ = query(
      collection(db, 'duels'),
      where('opponentUid', '==', firebaseUser.uid),
      limit(20)
    );

    const duelBuckets: Record<string, Map<string, XpDuel>> = {
      open: new Map(),
      challenger: new Map(),
      opponent: new Map(),
    };

    const emitMergedDuels = () => {
      const merged = new Map<string, XpDuel>();
      Object.values(duelBuckets).forEach((bucket) => {
        bucket.forEach((val, key) => merged.set(key, val));
      });
      setDuels(Array.from(merged.values()));
    };

    const unsubOpen = onSnapshot(
      openDuelsQ,
      (snap) => {
        duelBuckets.open.clear();
        snap.forEach((d) => duelBuckets.open.set(d.id, { id: d.id, ...(d.data() as Omit<XpDuel, 'id'>) }));
        emitMergedDuels();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'duels')
    );

    const unsubChal = onSnapshot(
      myChallengerQ,
      (snap) => {
        duelBuckets.challenger.clear();
        snap.forEach((d) => duelBuckets.challenger.set(d.id, { id: d.id, ...(d.data() as Omit<XpDuel, 'id'>) }));
        emitMergedDuels();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'duels')
    );

    const unsubOpp = onSnapshot(
      myOpponentQ,
      (snap) => {
        duelBuckets.opponent.clear();
        snap.forEach((d) => duelBuckets.opponent.set(d.id, { id: d.id, ...(d.data() as Omit<XpDuel, 'id'>) }));
        emitMergedDuels();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'duels')
    );

    // Real-time chatMessages across Lobby, Sent by Me, and Direct to Me
    const chatLobbyQ = query(
      collection(db, 'chatMessages'),
      where('recipientUid', '==', 'lobby'),
      limit(50)
    );
    const chatSentQ = query(
      collection(db, 'chatMessages'),
      where('senderUid', '==', firebaseUser.uid),
      limit(50)
    );
    const chatRecvQ = query(
      collection(db, 'chatMessages'),
      where('recipientUid', '==', firebaseUser.uid),
      limit(50)
    );

    const chatBuckets: Record<string, Map<string, ChatMessage>> = {
      lobby: new Map(),
      sent: new Map(),
      recv: new Map(),
    };

    const parseChatSnap = (
      bucketKey: 'lobby' | 'sent' | 'recv',
      snap: { forEach: (cb: (d: { id: string; data: () => Record<string, unknown> }) => void) => void }
    ) => {
      chatBuckets[bucketKey].clear();
      snap.forEach((d) => {
        const raw = d.data();
        const ts = raw.createdAt as { toMillis?: () => number } | undefined;
        chatBuckets[bucketKey].set(d.id, {
          id: d.id,
          senderUid: String(raw.senderUid || ''),
          senderName: String(raw.senderName || 'Learner'),
          senderLanguage: String(raw.senderLanguage || 'en'),
          recipientUid: String(raw.recipientUid || 'lobby'),
          recipientName: String(raw.recipientName || 'All Learners Lobby'),
          languageCode: String(raw.languageCode || 'en'),
          text: String(raw.text || ''),
          viaVoice: Boolean(raw.viaVoice),
          createdAtMs: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now(),
        });
      });

      const merged = new Map<string, ChatMessage>();
      Object.values(chatBuckets).forEach((bucket) => {
        bucket.forEach((val, key) => merged.set(key, val));
      });
      const sorted = Array.from(merged.values()).sort(
        (a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0)
      );
      setChatMessages(sorted);
    };

    const unsubChatLobby = onSnapshot(
      chatLobbyQ,
      (snap) => parseChatSnap('lobby', snap),
      (err) => handleFirestoreError(err, OperationType.LIST, 'chatMessages')
    );
    const unsubChatSent = onSnapshot(
      chatSentQ,
      (snap) => parseChatSnap('sent', snap),
      (err) => handleFirestoreError(err, OperationType.LIST, 'chatMessages')
    );
    const unsubChatRecv = onSnapshot(
      chatRecvQ,
      (snap) => parseChatSnap('recv', snap),
      (err) => handleFirestoreError(err, OperationType.LIST, 'chatMessages')
    );

    return () => {
      unsubLb();
      unsubOpen();
      unsubChal();
      unsubOpp();
      unsubChatLobby();
      unsubChatSent();
      unsubChatRecv();
    };
  }, [authReady, firebaseUser]);

  // Sync offline queue automatically when online
  const syncPendingQueue = useCallback(async () => {
    if (!firebaseUser || !isOnline || forcedOffline || pendingQueue.length === 0) return;

    try {
      await persistProfileToCloud(profile);
      for (const lp of Object.values(progressMap)) {
        const ref = doc(db, `users/${firebaseUser.uid}/languageProgress`, lp.langCode);
        await setDoc(ref, {
          uid: firebaseUser.uid,
          langCode: lp.langCode,
          xp: lp.xp,
          masteredCards: lp.masteredCards.slice(0, 750),
          completedGrammar: lp.completedGrammar.slice(0, 750),
          updatedAt: serverTimestamp(),
        });
      }
      setPendingQueue([]);
      await saveLocalState({ pendingQueue: [] });
      showToast('Offline progress synced to cloud.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/languageProgress`);
    }
  }, [firebaseUser, isOnline, forcedOffline, pendingQueue.length, persistProfileToCloud, profile, progressMap, showToast]);

  useEffect(() => {
    if (isOnline && !forcedOffline && firebaseUser && pendingQueue.length > 0) {
      syncPendingQueue();
    }
  }, [isOnline, forcedOffline, firebaseUser, pendingQueue.length, syncPendingQueue]);

  // Core progression mutator (works both online & offline)
  const recordLearningProgress = useCallback(
    async (kind: 'card' | 'grammar', langCode: string, itemId: string, xpEarned: number) => {
      const today = todayIsoDate();
      const currentLp: LanguageProgressData = progressMap[langCode] || {
        uid: profile.uid,
        langCode,
        xp: 0,
        masteredCards: [],
        completedGrammar: [],
      };

      const nextCards =
        kind === 'card' && itemId && !currentLp.masteredCards.includes(itemId)
          ? [...currentLp.masteredCards, itemId]
          : currentLp.masteredCards;
      const nextGrammar =
        kind === 'grammar' && itemId && !currentLp.completedGrammar.includes(itemId)
          ? [...currentLp.completedGrammar, itemId]
          : currentLp.completedGrammar;

      const updatedLp: LanguageProgressData = {
        ...currentLp,
        uid: profile.uid,
        xp: currentLp.xp + xpEarned,
        masteredCards: nextCards,
        completedGrammar: nextGrammar,
      };
      const nextProgressMap = { ...progressMap, [langCode]: updatedLp };

      // Streak computation
      let nextStreak = profile.streak;
      let nextDailyXp = profile.dailyXpToday;
      if (profile.lastActiveDate !== today) {
        nextStreak = profile.lastActiveDate === yesterdayIsoDate() ? profile.streak + 1 : Math.max(1, profile.streak);
        nextDailyXp = xpEarned;
      } else {
        nextDailyXp += xpEarned;
      }

      const candidateProfile: UserProfile = {
        ...profile,
        xp: profile.xp + xpEarned,
        weeklyXp: profile.weeklyXp + xpEarned,
        monthlyXp: (profile.monthlyXp ?? profile.weeklyXp) + xpEarned,
        gems: profile.gems + (xpEarned >= 20 ? 5 : 2),
        streak: nextStreak,
        dailyXpToday: nextDailyXp,
        lastActiveDate: today,
        activeLanguage: langCode,
      };

      const rewards = evaluateUnlockedRewards(
        candidateProfile,
        nextProgressMap,
        offlinePacks.length,
        duels.some((d) => d.challengerUid === profile.uid || d.opponentUid === profile.uid)
      );
      if (rewards.newlyEarned) {
        playFeedbackTone('levelup');
        showToast('New badge or avatar frame unlocked!');
      }

      const finalProfile: UserProfile = {
        ...candidateProfile,
        unlockedFrames: rewards.unlockedFrames,
        earnedBadges: rewards.earnedBadges,
      };

      setProgressMap(nextProgressMap);
      setProfile(finalProfile);
      triggerStreakCelebrationIfHit(
        profile.dailyXpToday,
        profile.lastActiveDate,
        finalProfile.dailyXpToday,
        finalProfile.dailyGoal,
        today
      );

      if (!isOnline || forcedOffline || !firebaseUser) {
        const queued: PendingSyncAction[] = [
          ...pendingQueue,
          {
            id: `${Date.now()}-${Math.random()}`,
            type: kind === 'card' ? 'card_mastered' : 'grammar_completed',
            langCode,
            itemId,
            xpDelta: xpEarned,
            timestamp: new Date().toISOString(),
          },
        ];
        setPendingQueue(queued);
        await saveLocalState({
          profile: finalProfile,
          progressMap: nextProgressMap,
          pendingQueue: queued,
        });
      } else {
        await saveLocalState({ profile: finalProfile, progressMap: nextProgressMap });
        await persistProfileToCloud(finalProfile);

        try {
          await setDoc(doc(db, `users/${firebaseUser.uid}/languageProgress`, langCode), {
            uid: firebaseUser.uid,
            langCode,
            xp: updatedLp.xp,
            masteredCards: updatedLp.masteredCards.slice(0, 750),
            completedGrammar: updatedLp.completedGrammar.slice(0, 750),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/languageProgress/${langCode}`);
        }

        // Advance active XP duels matching this language
        const activeDuels = duels.filter(
          (d) =>
            d.status === 'active' &&
            d.languageCode === langCode &&
            (d.challengerUid === firebaseUser.uid || d.opponentUid === firebaseUser.uid)
        );
        for (const duel of activeDuels) {
          const isChallenger = duel.challengerUid === firebaseUser.uid;
          const nextScore = (isChallenger ? duel.challengerXp : duel.opponentXp) + xpEarned;
          const finished = nextScore >= duel.targetXp;
          const patch: Record<string, unknown> = {
            [isChallenger ? 'challengerXp' : 'opponentXp']: nextScore,
            status: finished ? 'completed' : 'active',
            updatedAt: serverTimestamp(),
          };
          if (finished) {
            patch.winnerUid = firebaseUser.uid;
          }
          try {
            await updateDoc(doc(db, 'duels', duel.id), patch);
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `duels/${duel.id}`);
          }
        }
      }
    },
    [
      progressMap,
      profile,
      offlinePacks.length,
      duels,
      isOnline,
      forcedOffline,
      firebaseUser,
      pendingQueue,
      persistProfileToCloud,
      showToast,
      triggerStreakCelebrationIfHit,
    ]
  );

  // Re-evaluate offline explorer badge when packs change
  useEffect(() => {
    if (offlinePacks.length > 0 && !profile.earnedBadges.includes('offline_explorer')) {
      const nextBadges = [...profile.earnedBadges, 'offline_explorer'];
      const next = { ...profile, earnedBadges: nextBadges };
      setProfile(next);
      saveLocalState({ profile: next });
      if (firebaseUser && isOnline && !forcedOffline) {
        persistProfileToCloud(next);
      }
    }
  }, [offlinePacks.length, profile, firebaseUser, isOnline, forcedOffline, persistProfileToCloud]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Signed in with Google.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled';
      showToast(msg);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    const local = createDefaultProfile(null);
    setProfile(local);
    setProgressMap({});
    setReceipts([]);
    await saveLocalState({ profile: local, progressMap: {}, receipts: [] });
    showToast('Signed out.');
  };

  const handleSelectLanguageAndOpenChallenges = (langCode: string) => {
    const next = { ...profile, activeLanguage: langCode };
    setProfile(next);
    saveLocalState({ profile: next });
    setChallengeSubMode('phases');
    setActiveTab('challenges');
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleSaveLanguagePair = (knownCode: string, targetCode: string) => {
    localStorage.setItem('piryas_pair_chosen', '1');
    const next = { ...profile, knownLanguage: knownCode, activeLanguage: targetCode };
    setProfile(next);
    saveLocalState({ profile: next });
    setKnownModalOpen(false);
    showToast(`Attached ${getLanguageByCode(knownCode).name} ↔ ${getLanguageByCode(targetCode).name}`);
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleSwapLanguages = () => {
    const nextKnown = profile.activeLanguage;
    const nextTarget = profile.knownLanguage || 'en';
    const next = { ...profile, knownLanguage: nextKnown, activeLanguage: nextTarget };
    setProfile(next);
    saveLocalState({ profile: next });
    showToast(`Reversed bridge: ${getLanguageByCode(nextKnown).name} → ${getLanguageByCode(nextTarget).name}`);
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleRedeemReferral = (rawCode: string): { ok: boolean; message: string } => {
    const code = rawCode.trim().toUpperCase();
    if (profile.referredBy) {
      return { ok: false, message: 'Referral bonus already claimed for this account.' };
    }
    if (code === profile.referralCode) {
      return { ok: false, message: 'You cannot redeem your own referral code.' };
    }
    if (!/^PIRYAS-[A-Z0-9]{4,12}$/.test(code)) {
      return { ok: false, message: 'Enter a valid referral code (e.g., PIRYAS-WELCOME).' };
    }
    const next: UserProfile = {
      ...profile,
      xp: profile.xp + 150,
      weeklyXp: profile.weeklyXp + 150,
      monthlyXp: (profile.monthlyXp ?? profile.weeklyXp) + 150,
      gems: profile.gems + 50,
      referralsCount: (profile.referralsCount || 0) + 1,
      referredBy: code,
    };
    setProfile(next);
    saveLocalState({ profile: next });
    playFeedbackTone('chest');
    showToast('Referral claimed! +150 XP & +50 Study Gems earned.');
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
    return { ok: true, message: 'Success! +150 XP and +50 Gems added to your account.' };
  };

  const handleToggleForcedOffline = () => {
    if (!forcedOffline && profile.subscriptionStatus !== 'active') {
      showToast('Offline App Access starts at ₹200/mo (Ad-Free + AI Coach).');
      setPlusModalOpen(true);
      return;
    }
    setForcedOffline((prev) => !prev);
  };

  const handleUpdateDisplayName = (name: string) => {
    const next = { ...profile, displayName: name };
    setProfile(next);
    saveLocalState({ profile: next });
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleUpdateDailyGoal = (goal: number) => {
    const next = { ...profile, dailyGoal: goal };
    setProfile(next);
    saveLocalState({ profile: next });
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleSelectFrame = (frameId: string) => {
    if (!profile.unlockedFrames.includes(frameId)) return;
    const next = { ...profile, activeFrameId: frameId };
    setProfile(next);
    saveLocalState({ profile: next });
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
  };

  const handleCreateDuel = async (languageCode: string, targetXp: number) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'duels'), {
        challengerUid: firebaseUser.uid,
        challengerName: profile.displayName.slice(0, 80),
        challengerFrame: profile.activeFrameId,
        opponentUid: '',
        opponentName: '',
        languageCode,
        targetXp,
        challengerXp: 0,
        opponentXp: 0,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (!profile.earnedBadges.includes('social_duelist')) {
        const next = { ...profile, earnedBadges: [...profile.earnedBadges, 'social_duelist'] };
        setProfile(next);
        await persistProfileToCloud(next);
      }
      showToast('Open XP duel posted to the arena!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'duels');
    }
  };

  const handleJoinDuel = async (duelId: string) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'duels', duelId), {
        opponentUid: firebaseUser.uid,
        opponentName: profile.displayName.slice(0, 80),
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      if (!profile.earnedBadges.includes('social_duelist')) {
        const next = { ...profile, earnedBadges: [...profile.earnedBadges, 'social_duelist'] };
        setProfile(next);
        await persistProfileToCloud(next);
      }
      showToast('Duel accepted! Earn XP in Challenges to advance.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `duels/${duelId}`);
    }
  };

  const handleSendChatMessage = async (payload: {
    recipientUid: string;
    recipientName: string;
    languageCode: string;
    text: string;
    viaVoice: boolean;
  }) => {
    if (!firebaseUser) return;
    const cleanText = payload.text.trim().slice(0, 500);
    if (!cleanText) return;
    try {
      await addDoc(collection(db, 'chatMessages'), {
        senderUid: firebaseUser.uid,
        senderName: profile.displayName.slice(0, 80) || 'Polyglot Learner',
        senderLanguage: profile.activeLanguage,
        recipientUid: payload.recipientUid,
        recipientName: payload.recipientName.slice(0, 80) || 'All Learners Lobby',
        languageCode: payload.languageCode,
        text: cleanText,
        viaVoice: payload.viaVoice,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chatMessages');
    }
  };

  const handleSuccessPurchase = async (receipt: PurchaseReceipt) => {
    const isHintsOnly = receipt.planId === 'hints_20';
    const framesSet = isHintsOnly
      ? new Set(profile.unlockedFrames)
      : new Set([...profile.unlockedFrames, 'obsidian_crown']);
    const badgesSet = isHintsOnly
      ? new Set(profile.earnedBadges)
      : new Set([...profile.earnedBadges, 'plus_patron']);

    const upgraded: UserProfile = {
      ...profile,
      subscriptionPlan:
        isHintsOnly && profile.subscriptionStatus === 'active'
          ? profile.subscriptionPlan
          : receipt.planId,
      subscriptionStatus: isHintsOnly ? profile.subscriptionStatus : 'active',
      unlimitedHints: true,
      streakFreezes: isHintsOnly ? profile.streakFreezes : profile.streakFreezes + 3,
      unlockedFrames: Array.from(framesSet),
      earnedBadges: Array.from(badgesSet),
      activeFrameId: isHintsOnly ? profile.activeFrameId : 'obsidian_crown',
    };

    const nextReceipts = [receipt, ...receipts];
    setProfile(upgraded);
    setReceipts(nextReceipts);
    await saveLocalState({ profile: upgraded, receipts: nextReceipts });
    playFeedbackTone('levelup');
    showToast(
      isHintsOnly
        ? 'Unlimited Hints Pass (₹20) unlocked across all Guided Paths!'
        : 'Subscription active: Zero Ads, AI Coach, Offline Packs & Unlimited Hints unlocked!'
    );

    if (firebaseUser && isOnline) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          subscriptionPlan: upgraded.subscriptionPlan,
          subscriptionStatus: upgraded.subscriptionStatus,
          unlimitedHints: true,
          unlockedFrames: upgraded.unlockedFrames.slice(0, 20),
          earnedBadges: upgraded.earnedBadges.slice(0, 30),
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, `users/${firebaseUser.uid}/purchases`, receipt.transactionId), {
          uid: firebaseUser.uid,
          transactionId: receipt.transactionId,
          planId: receipt.planId,
          amountCents: receipt.amountCents,
          currency: receipt.currency,
          paymentMethod: receipt.paymentMethod,
          ...(receipt.cardLast4 ? { cardLast4: receipt.cardLast4 } : {}),
          status: 'succeeded',
          createdAt: serverTimestamp(),
        });

        await persistProfileToCloud(upgraded);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/purchases`);
      }
    }
  };

  const handleUseHint = useCallback((): boolean => {
    if (profile.unlimitedHints || profile.subscriptionStatus === 'active') {
      return true;
    }
    const currentRemaining = profile.freeHintsRemaining ?? 10;
    if (currentRemaining <= 0) {
      return false;
    }
    const nextRemaining = currentRemaining - 1;
    const nextProfile: UserProfile = {
      ...profile,
      freeHintsRemaining: nextRemaining,
    };
    setProfile(nextProfile);
    saveLocalState({ profile: nextProfile });
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(nextProfile);
    }
    if (nextRemaining === 0) {
      showToast('Last free hint used! Unlock Unlimited Hints for ₹20.');
    }
    return true;
  }, [profile, firebaseUser, isOnline, forcedOffline, persistProfileToCloud, showToast]);

  const handleLoseHeart = useCallback(() => {
    setHeartState((prev) => {
      const nextHearts = Math.max(0, prev.hearts - 1);
      const nextAt =
        nextHearts < MAX_HEARTS
          ? prev.nextRecoveryAt ?? Date.now() + HEART_RECOVERY_MS
          : null;
      return { hearts: nextHearts, nextRecoveryAt: nextAt };
    });
  }, []);

  const handleClaimMysteryBox = async (item: GuidedPathItem) => {
    const langCode = profile.activeLanguage;
    const currentLp: LanguageProgressData = progressMap[langCode] || {
      uid: profile.uid,
      langCode,
      xp: 0,
      masteredCards: [],
      completedGrammar: [],
    };
    if (currentLp.masteredCards.includes(item.mysteryBoxId)) return;

    const updatedLp: LanguageProgressData = {
      ...currentLp,
      uid: profile.uid,
      xp: currentLp.xp + item.mysteryReward.xp,
      masteredCards: [...currentLp.masteredCards, item.mysteryBoxId],
    };
    const nextProgressMap = { ...progressMap, [langCode]: updatedLp };
    const nextProfile: UserProfile = {
      ...profile,
      xp: profile.xp + item.mysteryReward.xp,
      weeklyXp: profile.weeklyXp + item.mysteryReward.xp,
      monthlyXp: (profile.monthlyXp ?? profile.weeklyXp) + item.mysteryReward.xp,
      gems: profile.gems + item.mysteryReward.gems,
      streakFreezes: profile.streakFreezes + (item.mysteryReward.streakFreeze ? 1 : 0),
    };

    setProgressMap(nextProgressMap);
    setProfile(nextProfile);
    await saveLocalState({ profile: nextProfile, progressMap: nextProgressMap });
    showToast(`Mystery Box Opened: ${item.mysteryReward.label}!`);

    if (firebaseUser && isOnline && !forcedOffline) {
      await persistProfileToCloud(nextProfile);
      try {
        await setDoc(doc(db, `users/${firebaseUser.uid}/languageProgress`, langCode), {
          uid: firebaseUser.uid,
          langCode,
          xp: updatedLp.xp,
          masteredCards: updatedLp.masteredCards.slice(0, 750),
          completedGrammar: updatedLp.completedGrammar.slice(0, 750),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/languageProgress/${langCode}`);
      }
    }
  };

  const handleCompleteLesson = async (result: {
    langCode: string;
    pathId: string;
    xpEarned: number;
    gemsEarned: number;
    accuracyPct: number;
  }) => {
    const today = todayIsoDate();
    const currentLp: LanguageProgressData = progressMap[result.langCode] || {
      uid: profile.uid,
      langCode: result.langCode,
      xp: 0,
      masteredCards: [],
      completedGrammar: [],
    };
    const mergedGrammar = Array.from(new Set([...currentLp.completedGrammar, result.pathId]));
    const updatedLp: LanguageProgressData = {
      ...currentLp,
      uid: profile.uid,
      xp: currentLp.xp + result.xpEarned,
      completedGrammar: mergedGrammar,
    };
    const nextProgressMap = { ...progressMap, [result.langCode]: updatedLp };

    let nextStreak = profile.streak;
    let nextDailyXp = profile.dailyXpToday;
    if (profile.lastActiveDate !== today) {
      nextStreak = profile.lastActiveDate === yesterdayIsoDate() ? profile.streak + 1 : Math.max(1, profile.streak);
      nextDailyXp = result.xpEarned;
    } else {
      nextDailyXp += result.xpEarned;
    }

    const candidateProfile: UserProfile = {
      ...profile,
      xp: profile.xp + result.xpEarned,
      weeklyXp: profile.weeklyXp + result.xpEarned,
      monthlyXp: (profile.monthlyXp ?? profile.weeklyXp) + result.xpEarned,
      gems: profile.gems + result.gemsEarned,
      streak: nextStreak,
      dailyXpToday: nextDailyXp,
      lastActiveDate: today,
      activeLanguage: result.langCode,
    };

    const rewards = evaluateUnlockedRewards(
      candidateProfile,
      nextProgressMap,
      offlinePacks.length,
      duels.some((d) => d.challengerUid === profile.uid || d.opponentUid === profile.uid)
    );
    const finalProfile: UserProfile = {
      ...candidateProfile,
      unlockedFrames: rewards.unlockedFrames,
      earnedBadges: rewards.earnedBadges,
    };

    setProgressMap(nextProgressMap);
    setProfile(finalProfile);
    triggerStreakCelebrationIfHit(
      profile.dailyXpToday,
      profile.lastActiveDate,
      finalProfile.dailyXpToday,
      finalProfile.dailyGoal,
      today
    );

    if (!isOnline || forcedOffline || !firebaseUser) {
      const queued: PendingSyncAction[] = [
        ...pendingQueue,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'xp_earned',
          langCode: result.langCode,
          xpDelta: result.xpEarned,
          timestamp: new Date().toISOString(),
        },
      ];
      setPendingQueue(queued);
      await saveLocalState({ profile: finalProfile, progressMap: nextProgressMap, pendingQueue: queued });
    } else {
      await saveLocalState({ profile: finalProfile, progressMap: nextProgressMap });
      await persistProfileToCloud(finalProfile);
      try {
        await setDoc(doc(db, `users/${firebaseUser.uid}/languageProgress`, result.langCode), {
          uid: firebaseUser.uid,
          langCode: result.langCode,
          xp: updatedLp.xp,
          masteredCards: updatedLp.masteredCards.slice(0, 750),
          completedGrammar: updatedLp.completedGrammar.slice(0, 750),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/languageProgress/${result.langCode}`);
      }
    }

    if (finalProfile.subscriptionStatus !== 'active') {
      setTimeout(() => {
        showToast('Tip: Go Ad-Free for ₹200/mo to unlock AI Coach, Offline Mode & Unlimited Hearts.');
      }, 1600);
    }
  };

  const handleRefillHearts = () => {
    if (profile.gems < 20) return false;
    const next = { ...profile, gems: profile.gems - 20 };
    setProfile(next);
    setHeartState({ hearts: MAX_HEARTS, nextRecoveryAt: null });
    saveLocalState({ profile: next });
    if (firebaseUser && isOnline && !forcedOffline) {
      persistProfileToCloud(next);
    }
    showToast('Refilled 5 Hearts!');
    return true;
  };

  const activePathLangProgress = progressMap[profile.activeLanguage];
  const isActiveMysteryClaimed = Boolean(
    activeGuidedPath &&
      activePathLangProgress?.masteredCards.includes(activeGuidedPath.mysteryBoxId)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPlusActive={profile.subscriptionStatus === 'active'}
        streak={profile.streak}
        dailyGoalReached={profile.dailyXpToday >= profile.dailyGoal}
        celebrateStreakKey={celebrateStreakKey}
        onOpenPlusModal={() => setPlusModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'path' && (
          <GuidedPathView
            profile={profile}
            progressMap={progressMap}
            hearts={heartState.hearts}
            maxHearts={MAX_HEARTS}
            secondsUntilNextHeart={secondsUntilNextHeart}
            onStartGuidedPath={(item) => setActiveGuidedPath(item)}
            onClaimMysteryBox={handleClaimMysteryBox}
            onOpenPlusModal={() => setPlusModalOpen(true)}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesHub
            profile={profile}
            initialSubMode={challengeSubMode}
            progressMap={progressMap}
            hearts={heartState.hearts}
            forcedOffline={forcedOffline}
            onSavePair={handleSaveLanguagePair}
            onSwapLanguages={handleSwapLanguages}
            onOpenSubscriptionTab={() => setActiveTab('subscription')}
            onOpenPlusModal={() => setPlusModalOpen(true)}
            onCardMastered={(lang, cardId, xp) => recordLearningProgress('card', lang, cardId, xp)}
            onGrammarCompleted={(lang, gId, xp) => recordLearningProgress('grammar', lang, gId, xp)}
          />
        )}

        {activeTab === 'languages' && (
          <LanguagesHub
            profile={profile}
            progressMap={progressMap}
            offlinePacks={offlinePacks}
            pendingQueue={pendingQueue}
            forcedOffline={forcedOffline}
            onSavePair={handleSaveLanguagePair}
            onSwapLanguages={handleSwapLanguages}
            onStartLanguageChallenges={handleSelectLanguageAndOpenChallenges}
            onToggleForcedOffline={handleToggleForcedOffline}
            onRefreshPacks={refreshOfflinePacks}
            onSyncPending={syncPendingQueue}
            onOpenPlusModal={() => setPlusModalOpen(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardChatHub
            profile={profile}
            isSignedIn={Boolean(firebaseUser)}
            leaderboardEntries={leaderboardEntries}
            chatMessages={chatMessages}
            forcedOffline={forcedOffline}
            onSignIn={handleSignIn}
            onSendChatMessage={handleSendChatMessage}
          />
        )}

        {activeTab === 'refer' && (
          <ReferHub
            profile={profile}
            isSignedIn={Boolean(firebaseUser)}
            duels={duels}
            onSignIn={handleSignIn}
            onCreateDuel={handleCreateDuel}
            onJoinDuel={handleJoinDuel}
            onRedeemReferral={handleRedeemReferral}
            onOpenPlusModal={() => setPlusModalOpen(true)}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionHub
            profile={profile}
            receipts={receipts}
            onOpenPlusModal={(planId) => openCheckout(planId || 'ad_free')}
            onGoOfflinePacks={() => setActiveTab('languages')}
            onGoAICoach={() => {
              setChallengeSubMode('coach');
              setActiveTab('challenges');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileHub
            profile={profile}
            isSignedIn={Boolean(firebaseUser)}
            darkMode={darkMode}
            receipts={receipts}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onUpdateDisplayName={handleUpdateDisplayName}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onSelectFrame={handleSelectFrame}
            onToggleTheme={() => setDarkMode((prev) => !prev)}
            onOpenPlusModal={() => setPlusModalOpen(true)}
            onOpenKnownLanguageModal={() => setKnownModalOpen(true)}
            onSwapLanguages={handleSwapLanguages}
          />
        )}
      </main>

      {activeTab !== 'path' && activeTab !== 'challenges' && activeTab !== 'leaderboard' && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>PIRYAS · 15 Languages · 100 Guided Paths · 500 Challenges · AI Coach</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTab('path')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                Guided Path
              </button>
              <button onClick={() => setActiveTab('challenges')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                Challenges
              </button>
              <button onClick={() => setActiveTab('languages')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                Languages
              </button>
              <button onClick={() => setActiveTab('refer')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                Refer & Earn
              </button>
              <button onClick={() => setActiveTab('subscription')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                Subscription
              </button>
            </div>
          </div>
        </footer>
      )}

      {!activeGuidedPath && (
        <GoogleAdSlot
          variant="bottom"
          isAdFree={profile.subscriptionStatus === 'active'}
          onUpgradeAdFree={() => setPlusModalOpen(true)}
        />
      )}

      <OfflineIndicator forcedOffline={forcedOffline} />

      <KnownLanguageModal
        isOpen={knownModalOpen}
        initialKnownCode={profile.knownLanguage || 'hi'}
        initialTargetCode={profile.activeLanguage}
        allowClose={true}
        onSavePair={handleSaveLanguagePair}
        onClose={() => {
          localStorage.setItem('piryas_pair_chosen', '1');
          setKnownModalOpen(false);
        }}
      />

      <PaymentGatewayModal
        isOpen={plusModalOpen}
        uid={profile.uid}
        currentPlan={profile.subscriptionPlan}
        initialPlanId={paymentInitialPlan}
        onClose={() => setPlusModalOpen(false)}
        onSuccessPurchase={handleSuccessPurchase}
      />

      <GuidedLessonModal
        isOpen={Boolean(activeGuidedPath)}
        course={getLanguageByCode(profile.activeLanguage)}
        guidedPath={activeGuidedPath}
        hearts={heartState.hearts}
        maxHearts={MAX_HEARTS}
        secondsUntilNextHeart={secondsUntilNextHeart}
        gems={profile.gems}
        isPlusActive={profile.subscriptionStatus === 'active'}
        freeHintsRemaining={profile.freeHintsRemaining ?? 10}
        hasUnlimitedHints={Boolean(profile.unlimitedHints) || profile.subscriptionStatus === 'active'}
        isMysteryClaimed={isActiveMysteryClaimed}
        forcedOffline={forcedOffline}
        onLoseHeart={handleLoseHeart}
        onRefillHearts={handleRefillHearts}
        onUseHint={handleUseHint}
        onOpenHintsUpgradeModal={() => {
          openCheckout('hints_20');
        }}
        onOpenPlusModal={() => {
          setActiveGuidedPath(null);
          openCheckout('ad_free');
        }}
        onCompleteLesson={handleCompleteLesson}
        onClaimMysteryBox={handleClaimMysteryBox}
        onClose={() => setActiveGuidedPath(null)}
      />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
