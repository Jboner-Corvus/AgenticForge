import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // For cache invalidation by tags
}

export interface CacheState {
  // Cache storage
  cache: Record<string, CacheEntry>;
  
  // Cache configuration
  defaultTTL: number; // Default 5 minutes
  maxEntries: number; // Max cache entries
  
  // Actions
  set: <T>(key: string, data: T, ttl?: number, tags?: string[]) => void;
  get: <T>(key: string) => T | null;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  
  // Advanced operations
  invalidateByTag: (tag: string) => void;
  invalidateExpired: () => void;
  getStats: () => {
    totalEntries: number;
    expiredEntries: number;
    sizeEstimate: string;
  };
  
  // Utilities
  isExpired: (key: string) => boolean;
  getRemainingTTL: (key: string) => number;
}

const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_ENTRIES: 500,
  CLEANUP_INTERVAL: 60 * 1000 // 1 minute
};

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      // Initial state
      cache: {},
      defaultTTL: CACHE_CONFIG.DEFAULT_TTL,
      maxEntries: CACHE_CONFIG.MAX_ENTRIES,

      // Basic operations
      set: <T>(key: string, data: T, ttl?: number, tags?: string[]) => {
        const now = Date.now();
        const entryTTL = ttl || get().defaultTTL;
        
        const entry: CacheEntry<T> = {
          data,
          timestamp: now,
          ttl: entryTTL,
          tags
        };

        set((state) => {
          const newCache = { ...state.cache };
          newCache[key] = entry;

          // Cleanup if we exceed max entries
          const entries = Object.entries(newCache);
          if (entries.length > state.maxEntries) {
            // Remove oldest entries first
            const sortedEntries = entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
            const entriesToKeep = sortedEntries.slice(-state.maxEntries);
            
            const cleanedCache: Record<string, CacheEntry> = {};
            entriesToKeep.forEach(([k, v]) => {
              cleanedCache[k] = v;
            });
            
            console.log(`🧹 Cache cleanup: removed ${entries.length - entriesToKeep.length} entries`);
            return { cache: cleanedCache };
          }

          return { cache: newCache };
        });

        console.log(`💾 Cache set: ${key} (TTL: ${entryTTL}ms)`);
      },

      get: <T>(key: string): T | null => {
        const state = get();
        const entry = state.cache[key] as CacheEntry<T> | undefined;
        
        if (!entry) {
          return null;
        }

        // Check if expired
        const now = Date.now();
        const isExpired = entry.ttl && (now - entry.timestamp) > entry.ttl;
        
        if (isExpired) {
          // Remove expired entry
          get().delete(key);
          return null;
        }

        console.log(`📖 Cache hit: ${key}`);
        return entry.data;
      },

      has: (key: string) => {
        const state = get();
        const entry = state.cache[key];
        
        if (!entry) return false;
        
        // Check if expired
        if (get().isExpired(key)) {
          get().delete(key);
          return false;
        }
        
        return true;
      },

      delete: (key: string) => {
        set((state) => {
          const newCache = { ...state.cache };
          delete newCache[key];
          console.log(`🗑️ Cache delete: ${key}`);
          return { cache: newCache };
        });
      },

      clear: () => {
        set({ cache: {} });
        console.log('🧹 Cache cleared');
      },

      // Advanced operations
      invalidateByTag: (tag: string) => {
        set((state) => {
          const newCache: Record<string, CacheEntry> = {};
          let removedCount = 0;
          
          Object.entries(state.cache).forEach(([key, entry]) => {
            if (!entry.tags || !entry.tags.includes(tag)) {
              newCache[key] = entry;
            } else {
              removedCount++;
            }
          });
          
          console.log(`🏷️ Cache invalidated by tag "${tag}": ${removedCount} entries removed`);
          return { cache: newCache };
        });
      },

      invalidateExpired: () => {
        const now = Date.now();
        
        set((state) => {
          const newCache: Record<string, CacheEntry> = {};
          let removedCount = 0;
          
          Object.entries(state.cache).forEach(([key, entry]) => {
            const isExpired = entry.ttl && (now - entry.timestamp) > entry.ttl;
            
            if (!isExpired) {
              newCache[key] = entry;
            } else {
              removedCount++;
            }
          });
          
          if (removedCount > 0) {
            console.log(`⏰ Cache cleanup: ${removedCount} expired entries removed`);
          }
          
          return { cache: newCache };
        });
      },

      getStats: () => {
        const state = get();
        const entries = Object.entries(state.cache);
        const now = Date.now();
        
        let expiredCount = 0;
        entries.forEach(([, entry]) => {
          if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
            expiredCount++;
          }
        });

        // Rough size estimate (not perfect but gives an idea)
        const sizeBytes = JSON.stringify(state.cache).length;
        const sizeEstimate = sizeBytes < 1024 ? `${sizeBytes}B` :
                           sizeBytes < 1024 * 1024 ? `${Math.round(sizeBytes / 1024)}KB` :
                           `${Math.round(sizeBytes / (1024 * 1024))}MB`;

        return {
          totalEntries: entries.length,
          expiredEntries: expiredCount,
          sizeEstimate
        };
      },

      // Utilities
      isExpired: (key: string) => {
        const state = get();
        const entry = state.cache[key];
        
        if (!entry || !entry.ttl) return false;
        
        const now = Date.now();
        return (now - entry.timestamp) > entry.ttl;
      },

      getRemainingTTL: (key: string) => {
        const state = get();
        const entry = state.cache[key];
        
        if (!entry || !entry.ttl) return -1;
        
        const now = Date.now();
        const elapsed = now - entry.timestamp;
        return Math.max(0, entry.ttl - elapsed);
      }
    }),
    {
      name: 'agenticforge-cache-store',
      partialize: (state) => ({
        // Only persist non-expired cache entries with long TTL
        cache: Object.fromEntries(
          Object.entries(state.cache).filter(([, entry]) => {
            const now = Date.now();
            // Keep entries that are not expired and have more than 1 minute left
            return !entry.ttl || (now - entry.timestamp) < (entry.ttl - 60000);
          })
        )
      })
    }
  )
);

// Auto cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().invalidateExpired();
  }, CACHE_CONFIG.CLEANUP_INTERVAL);
}