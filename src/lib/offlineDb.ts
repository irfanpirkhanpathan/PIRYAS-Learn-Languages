import type {
  LanguageCourse,
  LanguageProgressData,
  OfflinePackMeta,
  PendingSyncAction,
  PurchaseReceipt,
  UserProfile,
} from '../types/piryas';

const DB_NAME = 'piryas_offline_db';
const DB_VERSION = 1;

const STORE_PACKS = 'language_packs';
const STORE_AUDIO = 'audio_cache';
const STORE_KV = 'kv_state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PACKS)) {
        db.createObjectStore(STORE_PACKS, { keyPath: 'langCode' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'cacheKey' });
      }
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCachedAudio(cacheKey: string, audioBase64: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      tx.objectStore(STORE_AUDIO).put({ cacheKey, audioBase64, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore IndexedDB quota errors gracefully
  }
}

export async function getCachedAudio(cacheKey: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const req = tx.objectStore(STORE_AUDIO).get(cacheKey);
      req.onsuccess = () => {
        const result = req.result as { audioBase64?: string } | undefined;
        resolve(result?.audioBase64 ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveOfflineLanguagePack(
  course: LanguageCourse,
  audioClipsCount: number,
  extraAudioBytes: number
): Promise<OfflinePackMeta> {
  const payload = JSON.stringify(course);
  const sizeBytes = new Blob([payload]).size + extraAudioBytes;
  const meta: OfflinePackMeta = {
    langCode: course.code,
    downloadedAt: new Date().toISOString(),
    flashcardCount: course.flashcards.length,
    grammarCount: course.grammar.length,
    audioClipsCount,
    sizeBytes,
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PACKS, 'readwrite');
    tx.objectStore(STORE_PACKS).put({ ...meta, course });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return meta;
}

export async function getAllOfflinePacks(): Promise<OfflinePackMeta[]> {
  try {
    const db = await openDb();
    return await new Promise<OfflinePackMeta[]>((resolve) => {
      const tx = db.transaction(STORE_PACKS, 'readonly');
      const req = tx.objectStore(STORE_PACKS).getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as (OfflinePackMeta & { course?: LanguageCourse })[];
        resolve(
          items.map(({ langCode, downloadedAt, flashcardCount, grammarCount, audioClipsCount, sizeBytes }) => ({
            langCode,
            downloadedAt,
            flashcardCount,
            grammarCount,
            audioClipsCount,
            sizeBytes,
          }))
        );
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeOfflinePack(langCode: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PACKS, 'readwrite');
    tx.objectStore(STORE_PACKS).delete(langCode);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putKv<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      tx.objectStore(STORE_KV).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB blocked
    try {
      localStorage.setItem(`piryas_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}

async function getKv<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    const val = await new Promise<T | null>((resolve) => {
      const tx = db.transaction(STORE_KV, 'readonly');
      const req = tx.objectStore(STORE_KV).get(key);
      req.onsuccess = () => {
        const res = req.result as { value?: T } | undefined;
        resolve(res?.value ?? null);
      };
      req.onerror = () => resolve(null);
    });
    if (val !== null) return val;
  } catch {
    // ignore
  }
  try {
    const raw = localStorage.getItem(`piryas_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function loadLocalState(): Promise<{
  profile: UserProfile | null;
  progressMap: Record<string, LanguageProgressData>;
  receipts: PurchaseReceipt[];
  pendingQueue: PendingSyncAction[];
}> {
  const [profile, progressMap, receipts, pendingQueue] = await Promise.all([
    getKv<UserProfile>('profile'),
    getKv<Record<string, LanguageProgressData>>('progressMap'),
    getKv<PurchaseReceipt[]>('receipts'),
    getKv<PendingSyncAction[]>('pendingQueue'),
  ]);

  return {
    profile,
    progressMap: progressMap || {},
    receipts: receipts || [],
    pendingQueue: pendingQueue || [],
  };
}

export async function saveLocalState(data: {
  profile?: UserProfile;
  progressMap?: Record<string, LanguageProgressData>;
  receipts?: PurchaseReceipt[];
  pendingQueue?: PendingSyncAction[];
}): Promise<void> {
  const ops: Promise<void>[] = [];
  if (data.profile) ops.push(putKv('profile', data.profile));
  if (data.progressMap) ops.push(putKv('progressMap', data.progressMap));
  if (data.receipts) ops.push(putKv('receipts', data.receipts));
  if (data.pendingQueue) ops.push(putKv('pendingQueue', data.pendingQueue));
  await Promise.all(ops);
}
