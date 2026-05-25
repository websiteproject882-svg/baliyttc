interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    return null;
  }
  const entry = cacheMap.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttlMs) {
    cacheMap.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  cacheMap.set(key, {
    data,
    timestamp: Date.now(),
    ttlMs: ttlSeconds * 1000,
  });
}

export function invalidateCache(key: string): void {
  cacheMap.delete(key);
}

export function invalidateCacheByPrefix(prefix: string): void {
  cacheMap.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
    }
  });
}

export function clearAllCache(): void {
  cacheMap.clear();
}
