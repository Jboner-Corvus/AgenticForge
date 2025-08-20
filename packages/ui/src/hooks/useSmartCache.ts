import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCacheStore } from '../store/cacheStore';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for bulk invalidation
  staleWhileRevalidate?: boolean; // Return stale data while fetching new data
  background?: boolean; // Fetch in background without blocking UI
  retry?: number; // Number of retries
  dedupe?: boolean; // Deduplicate concurrent requests
}

interface CacheResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  isStale: boolean;
  mutate: (data?: T, revalidate?: boolean) => Promise<void>;
  revalidate: () => Promise<void>;
}

// Global request deduplication map
const requestMap = new Map<string, Promise<unknown>>();

export const useSmartCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): CacheResult<T> => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    tags = [],
    staleWhileRevalidate = true,
    background = false,
    retry = 3,
    dedupe = true
  } = options;

  const cacheStore = useCacheStore();
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  // State
  const cachedEntry = cacheStore.get<T>(key);
  const isExpired = cacheStore.isExpired(key);
  const hasData = cachedEntry !== null;
  const isStale = isExpired && hasData;

  const initialState = useMemo(() => ({
    data: cachedEntry,
    error: null as Error | null,
    isLoading: !hasData,
    isValidating: false,
    isStale
  }), [cachedEntry, hasData, isStale]);

  const [state, setState] = useState(initialState);

  // Update fetcher ref
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch function with retry logic
  const fetchWithRetry = useCallback(async (attempt = 1): Promise<T> => {
    try {
      return await fetcherRef.current();
    } catch (error) {
      if (attempt < retry) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  }, [retry]);

  // Main fetch function
  const fetchData = useCallback(async (force = false): Promise<T | null> => {
    const cacheKey = `${key}_fetch`;
    
    // Deduplicate requests
    if (dedupe && requestMap.has(cacheKey) && !force) {
      try {
        return await requestMap.get(cacheKey)! as T | null;
      } catch (error) {
        // If shared request fails, continue with individual request
      }
    }

    const fetchPromise = fetchWithRetry().then(
      (data) => {
        requestMap.delete(cacheKey);
        return data;
      },
      (error) => {
        requestMap.delete(cacheKey);
        throw error;
      }
    );

    if (dedupe) {
      requestMap.set(cacheKey, fetchPromise);
      // Clean up after request completes
      fetchPromise.finally(() => {
        requestMap.delete(cacheKey);
      });
    }

    return fetchPromise;
  }, [key, dedupe, fetchWithRetry]);

  // Revalidate function
  const revalidate = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      isValidating: true,
      error: null
    }));

    try {
      await fetchData(true);
    } catch (error) {
      // Error is already handled in fetchData
    }
  }, [fetchData]);

  // Mutate function (optimistic updates)
  const mutate = useCallback(async (data?: T, revalidateAfter = true) => {
    if (!mountedRef.current) return;

    if (data !== undefined) {
      // Optimistic update
      cacheStore.set(key, data, ttl, tags);
      setState(prev => ({
        ...prev,
        data,
        error: null,
        isStale: false
      }));
    }

    if (revalidateAfter) {
      // Revalidate in background
      try {
        await revalidate();
      } catch (error) {
        // Revalidation error is handled in revalidate function
      }
    }
  }, [key, ttl, tags, cacheStore, revalidate]);

  // Initial fetch effect
  useEffect(() => {
    if (!hasData || (isExpired && !staleWhileRevalidate)) {
      // No data or expired without stale-while-revalidate
      setState(prev => ({ ...prev, isLoading: true }));
      fetchData();
    } else if (isExpired && staleWhileRevalidate) {
      // Stale data available, fetch in background
      if (background) {
        // Non-blocking background fetch
        setTimeout(() => fetchData(), 0);
      } else {
        setState(prev => ({ ...prev, isValidating: true }));
        fetchData();
      }
    }
  }, [key, background, fetchData, hasData, isExpired, staleWhileRevalidate]); // Include all dependencies

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    isStale: state.isStale,
    mutate,
    revalidate
  };
};

// Preload function for prefetching
export const preloadCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const cacheStore = useCacheStore.getState();
  const { ttl = 5 * 60 * 1000, tags = [] } = options;

  // Only preload if not already cached
  if (!cacheStore.has(key)) {
    fetcher()
      .then(data => {
        cacheStore.set(key, data, ttl, tags);
        console.log(`📦 Preloaded cache: ${key}`);
      })
      .catch(error => {
        console.warn(`⚠️ Failed to preload cache: ${key}`, error);
      });
  }
};

// Hook for cache invalidation
export const useCacheInvalidation = () => {
  const cacheStore = useCacheStore();
  
  const invalidateByTag = useCallback((tag: string) => {
    cacheStore.invalidateByTag(tag);
    console.log(`🏷️ Invalidated cache by tag: ${tag}`);
  }, [cacheStore]);

  const invalidateByKey = useCallback((key: string) => {
    cacheStore.delete(key);
    console.log(`🗑️ Invalidated cache key: ${key}`);
  }, [cacheStore]);

  const invalidateAll = useCallback(() => {
    cacheStore.clear();
    console.log('🧹 Invalidated all cache');
  }, [cacheStore]);

  return {
    invalidateByTag,
    invalidateByKey,
    invalidateAll
  };
};

// Hook for cache warming (prefetch related data)
export const useCacheWarming = (patterns: string[]) => {
  useCacheStore();

  useEffect(() => {
    // Warm cache by prefetching related data patterns
    patterns.forEach(pattern => {
      // This would be implemented based on your specific prefetch logic
      console.log(`🔥 Warming cache for pattern: ${pattern}`);
    });
  }, [patterns]);
};

// Custom hook for API endpoints with smart caching
export const useApiCache = <T>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options: CacheOptions = {}
) => {
  const key = `api_${endpoint}_${JSON.stringify(params)}`;
  
  const fetcher = useCallback(async () => {
    const searchParams = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }, [endpoint, params]);

  return useSmartCache<T>(key, fetcher, {
    ttl: 2 * 60 * 1000, // 2 minutes for API calls
    tags: [endpoint.split('/')[1] || endpoint], // Tag by resource type
    staleWhileRevalidate: true,
    ...options
  });
};