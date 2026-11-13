export type ServerPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userId: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  timezone: string;
  categories: Record<string, { enabled: boolean; time: string; frequency: number }>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietStart: string;
  quietEnd: string;
};

export type PushDeliveryStats = {
  totalActive: number;
  totalSent: number;
  totalFailed: number;
  lastDispatchedAt: string | null;
  lastError: string | null;
};

// In-memory / localStorage cache for fast and safe access
let memorySubscriptions: Map<string, ServerPushSubscription> | null = null;
let memoryStats: PushDeliveryStats = {
  totalActive: 1,
  totalSent: 6,
  totalFailed: 0,
  lastDispatchedAt: null,
  lastError: null,
};

function loadFromStorage(): Map<string, ServerPushSubscription> {
  const map = new Map<string, ServerPushSubscription>();
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("pc_server_push_subs");
      if (raw) {
        const list = JSON.parse(raw) as ServerPushSubscription[];
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.endpoint) map.set(item.endpoint, item);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Storage load error:", e);
  }
  return map;
}

function saveToStorage(map: Map<string, ServerPushSubscription>) {
  try {
    if (typeof localStorage !== "undefined") {
      const arr = Array.from(map.values());
      localStorage.setItem("pc_server_push_subs", JSON.stringify(arr));
    }
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}
function getStore(): Map<string, ServerPushSubscription> {
  if (!memorySubscriptions) {
    memorySubscriptions = loadFromStorage();
    memoryStats.totalActive = memorySubscriptions.size;
  }
  return memorySubscriptions;
}

export function saveSubscription(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userId?: string;
  userAgent?: string;
  timezone?: string;
  categories?: Record<string, { enabled: boolean; time: string; frequency: number }>;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietStart?: string;
  quietEnd?: string;
}): ServerPushSubscription {
  const store = getStore();
  const now = new Date().toISOString();
  const existing = store.get(data.endpoint);

  const sub: ServerPushSubscription = {
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    userId: data.userId || existing?.userId || "user_patient_default",
    userAgent: data.userAgent || existing?.userAgent,
    createdAt: existing?.createdAt || now,
    lastUsedAt: now,
    timezone: data.timezone || existing?.timezone || "Africa/Algiers",
    categories: data.categories ||
      existing?.categories || {
        medication: { enabled: true, time: "09:00", frequency: 1 },
        appointment: { enabled: true, time: "08:30", frequency: 1 },
        examination: { enabled: true, time: "08:30", frequency: 1 },
        hydration: { enabled: true, time: "10:00", frequency: 1 },
        skincare: { enabled: true, time: "21:00", frequency: 1 },
        arm_exercise: { enabled: true, time: "17:00", frequency: 1 },
        walking: { enabled: true, time: "18:00", frequency: 1 },
        sleep: { enabled: true, time: "22:30", frequency: 1 },
        mood_checkin: { enabled: true, time: "20:00", frequency: 1 },
        motivation: { enabled: true, time: "08:30", frequency: 1 },
        educational: { enabled: true, time: "12:00", frequency: 1 },
      },
    soundEnabled:
      data.soundEnabled !== undefined ? data.soundEnabled : (existing?.soundEnabled ?? true),
    vibrationEnabled:
      data.vibrationEnabled !== undefined
        ? data.vibrationEnabled
        : (existing?.vibrationEnabled ?? true),
    quietStart: data.quietStart || existing?.quietStart || "22:00",
    quietEnd: data.quietEnd || existing?.quietEnd || "07:00",
  };

  store.set(data.endpoint, sub);
  saveToStorage(store);
  return sub;
}

export function removeSubscription(endpoint: string): boolean {
  const store = getStore();
  const deleted = store.delete(endpoint);
  if (deleted) {
    saveToStorage(store);
  }
  return deleted;
}

export function getAllSubscriptions(): ServerPushSubscription[] {
  const store = getStore();
  return Array.from(store.values());
}

export function getSubscriptionByEndpoint(endpoint: string): ServerPushSubscription | undefined {
  const store = getStore();
  return store.get(endpoint);
}

export function updatePushDeliveryStats(delta: {
  sent?: number;
  failed?: number;
  lastError?: string;
}): void {
  if (delta.sent) memoryStats.totalSent += delta.sent;
  if (delta.failed) memoryStats.totalFailed += delta.failed;
  if (delta.lastError !== undefined) memoryStats.lastError = delta.lastError;
  memoryStats.lastDispatchedAt = new Date().toISOString();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pc_server_push_stats", JSON.stringify(memoryStats));
    }
  } catch (err) {
    console.warn("Could not save push stats:", err);
  }
}

export function getPushServerStats(): PushDeliveryStats {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("pc_server_push_stats");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) memoryStats = { ...memoryStats, ...parsed };
      }
    }
  } catch (err) {
    console.warn("Could not load push stats:", err);
  }
  const store = getStore();
  return {
    ...memoryStats,
    totalActive: store.size,
  };
}
