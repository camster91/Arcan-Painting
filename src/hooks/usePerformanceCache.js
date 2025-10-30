import { useState, useEffect, useCallback, useRef } from "react";

// Simple in-memory cache for performance optimization
const cache = new Map();
const cacheTimestamps = new Map();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function usePerformanceCache(key, fetcher, options = {}) {
  const {
    cacheTime = CACHE_DURATION,
    staleWhileRevalidate = true,
    skipCache = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Check if cached data is still valid
  const isCacheValid = useCallback(
    (cacheKey) => {
      const timestamp = cacheTimestamps.get(cacheKey);
      if (!timestamp) return false;
      return Date.now() - timestamp < cacheTime;
    },
    [cacheTime],
  );

  // Get cached data
  const getCachedData = useCallback(
    (cacheKey) => {
      if (skipCache) return null;
      return cache.get(cacheKey);
    },
    [skipCache],
  );

  // Set cached data
  const setCachedData = useCallback(
    (cacheKey, value) => {
      if (skipCache) return;
      cache.set(cacheKey, value);
      cacheTimestamps.set(cacheKey, Date.now());
    },
    [skipCache],
  );

  // Fetch data function
  const fetchData = useCallback(
    async (showLoading = true) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Check cache first
        const cachedData = getCachedData(key);
        const cacheValid = isCacheValid(key);

        // If we have valid cached data, use it
        if (cachedData && cacheValid) {
          if (isMountedRef.current) {
            setData(cachedData);
            setLoading(false);
            setError(null);
          }
          return cachedData;
        }

        // If we have stale cached data and staleWhileRevalidate is true,
        // show the stale data while fetching fresh data
        if (cachedData && staleWhileRevalidate && !showLoading) {
          if (isMountedRef.current) {
            setData(cachedData);
            setLoading(false);
            setError(null);
          }
        } else if (showLoading && isMountedRef.current) {
          setLoading(true);
          setError(null);
        }

        // Fetch fresh data
        const freshData = await fetcher({ signal: controller.signal });

        if (isMountedRef.current && !controller.signal.aborted) {
          setData(freshData);
          setLoading(false);
          setError(null);
          setCachedData(key, freshData);
        }

        return freshData;
      } catch (err) {
        if (err.name === "AbortError") {
          return; // Request was cancelled
        }

        console.error(`Error fetching ${key}:`, err);

        if (isMountedRef.current) {
          setError(err);
          setLoading(false);

          // If we have cached data, fall back to it on error
          const cachedData = getCachedData(key);
          if (cachedData && !data) {
            setData(cachedData);
          }
        }

        throw err;
      }
    },
    [
      key,
      fetcher,
      getCachedData,
      isCacheValid,
      setCachedData,
      staleWhileRevalidate,
      data,
    ],
  );

  // Refetch function (bypasses cache)
  const refetch = useCallback(async () => {
    // Clear cache for this key
    cache.delete(key);
    cacheTimestamps.delete(key);

    return fetchData(true);
  }, [key, fetchData]);

  // Mutate function (optimistically update cache)
  const mutate = useCallback(
    (newData) => {
      if (isMountedRef.current) {
        setData(newData);
        setCachedData(key, newData);
      }
    },
    [key, setCachedData],
  );

  // Initial fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

// Utility to clear all cache
export function clearPerformanceCache() {
  cache.clear();
  cacheTimestamps.clear();
}

// Utility to clear specific cache key
export function clearCacheKey(key) {
  cache.delete(key);
  cacheTimestamps.delete(key);
}

// Utility to preload data
export async function preloadData(key, fetcher, cacheTime = CACHE_DURATION) {
  try {
    const data = await fetcher();
    cache.set(key, data);
    cacheTimestamps.set(key, Date.now());
    return data;
  } catch (error) {
    console.error(`Error preloading ${key}:`, error);
    return null;
  }
}
