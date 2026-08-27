// Simple in-memory cache for dashboard stats
// For production, consider using Redis or a dedicated caching service

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const cache = new Cache();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 300000);
}

export default cache;

// Helper function to get or set cache
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 60000 // default 60 seconds
): Promise<T> {
  const cached = cache.get<T>(key);

  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data, ttlMs);
  return data;
}

// Invalidate cache by pattern
export function invalidateCache(pattern: string): void {
  cache.clear(); // Simple implementation - clear all
  // For production, implement pattern matching
}
