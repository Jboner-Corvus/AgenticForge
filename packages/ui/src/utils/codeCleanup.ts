// Code cleanup utilities and type fixes
export const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Safe logging function
export const safeLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

export const safeWarn = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.warn(...args);
  }
};

export const safeError = (...args: unknown[]) => {
  console.error(...args);
};

// Type guards for better type safety
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

// Safe JSON operations
export const safeJSONParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch (error) {
    safeError('Failed to parse JSON:', error);
    return fallback;
  }
};

export const safeJSONStringify = (obj: unknown, fallback = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    safeError('Failed to stringify JSON:', error);
    return fallback;
  }
};

// Async error handling
export const asyncTryCatch = async <T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: Error) => T | Promise<T>
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    safeError('Async operation failed:', err);
    
    if (errorHandler) {
      return await errorHandler(err);
    }
    
    return null;
  }
};

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Type-safe localStorage operations
export const safeLocalStorageGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item);
  } catch (error) {
    safeError(`Failed to get localStorage item "${key}":`, error);
    return fallback;
  }
};

export const safeLocalStorageSet = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    safeError(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
};

// Cleanup function for event listeners
export const createCleanupManager = () => {
  const cleanupFunctions: (() => void)[] = [];
  
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup);
  };
  
  const runCleanup = () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        safeError('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.length = 0;
  };
  
  return { addCleanup, runCleanup };
};

// Performance measurement
export const measurePerformance = <T>(
  name: string,
  fn: () => T,
  threshold = 16 // 16ms = one frame at 60fps
): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  if (duration > threshold) {
    safeWarn(`🐌 Performance warning: ${name} took ${duration.toFixed(2)}ms`);
  } else if (DEBUG_MODE) {
    safeLog(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

// Async performance measurement
export const measureAsyncPerformance = async <T>(
  name: string,
  fn: () => Promise<T>,
  threshold = 1000 // 1 second for async operations
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  if (duration > threshold) {
    safeWarn(`🐌 Async performance warning: ${name} took ${duration.toFixed(2)}ms`);
  } else if (DEBUG_MODE) {
    safeLog(`⚡ Async performance: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

// Memory usage monitoring (development only)
export const logMemoryUsage = (label: string) => {
  if (!DEBUG_MODE || !(performance as unknown as { memory?: unknown }).memory) return;
  
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!memory) return;
  
  safeLog(`💾 Memory usage (${label}):`, {
    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
  });
};

// Error boundary utility
export class ErrorBoundaryHelper {
  static logError(error: Error, errorInfo?: unknown) {
    safeError('Error Boundary caught an error:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (!DEBUG_MODE) {
      // Example: Sentry.captureException(error);
    }
  }
  
  static createErrorFallback = (_componentName: string) => {
    return ({ error: _error, resetError: _resetError }: { error: Error; resetError: () => void }) => {
      // Return null for now to avoid JSX issues
      return null;
    };
  };
}