import type {
  PromptReference,
  ResourceReference,
} from "@modelcontextprotocol/sdk/types.js";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CompletionState {
  completions: Record<string, string[]>;
  loading: Record<string, boolean>;
}

export function useCompletionState(
  handleCompletion: (
    ref: PromptReference | ResourceReference,
    argName: string,
    value: string,
    signal?: AbortSignal,
  ) => Promise<string[]>,
  completionsSupported: boolean = true,
  debounceMs: number = 300,
) {
  const [state, setState] = useState<CompletionState>({
    completions: {},
    loading: {},
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const clearCompletions = useCallback(() => {
    cleanup();
    setState({
      completions: {},
      loading: {},
    });
  }, [cleanup]);

  const requestCompletions = useMemo(() => {
    return debounce(
      async (
        ref: PromptReference | ResourceReference,
        argName: string,
        value: string,
      ) => {
        if (!completionsSupported) {
          return;
        }

        cleanup();

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [argName]: true },
        }));

        try {
          const values = await handleCompletion(
            ref,
            argName,
            value,
            abortController.signal,
          );

          if (!abortController.signal.aborted) {
            setState((prev) => ({
              ...prev,
              completions: { ...prev.completions, [argName]: values },
              loading: { ...prev.loading, [argName]: false },
            }));
          }
        } catch {
          if (!abortController.signal.aborted) {
            setState((prev) => ({
              ...prev,
              loading: { ...prev.loading, [argName]: false },
            }));
          }
        } finally {
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
          }
        }
      },
      debounceMs,
    );
  }, [handleCompletion, completionsSupported, cleanup, debounceMs]);

  // Clear completions when support status changes
  useEffect(() => {
    if (!completionsSupported) {
      clearCompletions();
    }
  }, [completionsSupported, clearCompletions]);

  return {
    ...state,
    clearCompletions,
    completionsSupported,
    requestCompletions,
  };
}

function debounce<T extends (...args: Parameters<T>) => PromiseLike<void>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}
