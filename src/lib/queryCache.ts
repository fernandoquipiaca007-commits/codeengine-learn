/**
 * CodeEngine 1 - Ultra-Premium Query Cache Manager (SWR & Request Deduplication Engine)
 * Engineered by Senior Principal Web Architects for High-Scale Instant Navigation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type Subscriber = (data: any) => void;

class QueryCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<Subscriber>>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('ce_cache_')) {
            const val = sessionStorage.getItem(key);
            if (val) {
              const entry = JSON.parse(val);
              const cleanKey = key.substring(9); // remove 'ce_cache_'
              this.cache.set(cleanKey, entry);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[QueryCache] Failed to hydrate cache from sessionStorage:', e);
    }
  }

  /**
   * Retrieves data from cache if fresh, otherwise fetches with stale-while-revalidate (SWR) support.
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; revalidate?: boolean }
  ): Promise<T> {
    const ttl = options?.ttl ?? 120000; // Default: 2 minutes fresh TTL
    const revalidate = options?.revalidate ?? true;
    const now = Date.now();

    const cached = this.cache.get(key);

    // 1. Fresh cache hit: Return immediately
    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    // 2. Stale cache hit (SWR): Return stale immediately, trigger fetch in background
    if (cached && revalidate) {
      void this.triggerFetch(key, fetcher).catch(() => {
        // Silent fail in background to avoid breaking UI
      });
      return cached.data;
    }

    // 3. Cache miss: Fetch and await
    return this.triggerFetch(key, fetcher);
  }

  /**
   * Triggers a fetch and handles request deduplication.
   */
  private triggerFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const pending = this.pendingRequests.get(key);
    if (pending) return pending; // Deduplication: Reuse in-flight request promise

    const promise = fetcher()
      .then((data) => {
        const entry = { data, timestamp: Date.now() };
        this.cache.set(key, entry);
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem(`ce_cache_${key}`, JSON.stringify(entry));
          }
        } catch (e) {
          // Silent catch in case of quota exceeded or private mode
        }
        this.pendingRequests.delete(key);
        this.notify(key, data);
        return data;
      })
      .catch((err) => {
        this.pendingRequests.delete(key);
        throw err;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Subscribes a listener to receive cached/revalidated updates.
   */
  subscribe(key: string, callback: Subscriber): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Call subscriber immediately with current cache if it exists
    const cached = this.cache.get(key);
    if (cached) {
      callback(cached.data);
    }

    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Notifies subscribers of key revalidations.
   */
  private notify(key: string, data: any) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[QueryCache] Subscriber callback error:', e);
        }
      });
    }
  }

  /**
   * Invalidates a specific key to force a fresh query.
   */
  invalidate(key: string) {
    this.cache.delete(key);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(`ce_cache_${key}`);
      }
    } catch (e) {}
  }

  /**
   * Invalidates all keys starting with the specified prefix to force fresh queries.
   */
  invalidatePrefix(prefix: string) {
    // 1. Clear from memory cache
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    // 2. Clear from sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(`ce_cache_${prefix}`)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      }
    } catch (e) {}
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('ce_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      }
    } catch (e) {}
  }
}

export const queryCache = new QueryCacheManager();
