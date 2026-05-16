'use client';

import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialLoading = false, onError, onSuccess } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting new operation
    }));
  }, []);

  const setError = useCallback(
    (error: string | null) => {
      setState((prev) => ({
        ...prev,
        error,
        isLoading: false,
      }));

      if (error && onError) {
        onError(error);
      }
    },
    [onError]
  );

  const setProgress = useCallback((progress: number) => {
    setState((prev) => ({
      ...prev,
      progress,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      progress: undefined,
    });
  }, []);

  const executeAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options: {
        showProgress?: boolean;
        progressSteps?: number;
        errorMessage?: string;
      } = {}
    ): Promise<T | null> => {
      const { showProgress = false, errorMessage = 'Operation failed' } =
        options;

      try {
        setLoading(true);

        if (showProgress) {
          // Removed artificial progress simulation; rely on real async completion
          const result = await asyncFn();
          setState((prev) => ({ ...prev, progress: undefined }));
          setLoading(false);
          if (onSuccess) onSuccess();
          return result;
        } else {
          const result = await asyncFn();
          setLoading(false);
          if (onSuccess) onSuccess();
          return result;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setError(errorMsg);
        return null;
      }
    },
    [setLoading, setError, onSuccess]
  );

  return {
    ...state,
    setLoading,
    setError,
    setProgress,
    reset,
    executeAsync,
  };
}

// Specialized hook for form submissions
export function useFormSubmission() {
  const loadingState = useLoadingState();

  const submitForm = useCallback(
    async <T>(
      submitFn: () => Promise<T>,
      options: {
        onSuccess?: (result: T) => void;
        onError?: (error: string) => void;
        successMessage?: string;
        errorMessage?: string;
      } = {}
    ) => {
      const {
        onSuccess,
        onError,
        errorMessage = 'Form submission failed',
      } = options;

      const result = await loadingState.executeAsync(submitFn, {
        errorMessage,
      });

      if (result && onSuccess) {
        onSuccess(result);
      } else if (loadingState.error && onError) {
        onError(loadingState.error);
      }

      return result;
    },
    [loadingState]
  );

  return {
    ...loadingState,
    submitForm,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates<T extends string>(keys: T[]) {
  const [states, setStates] = useState<Record<T, LoadingState>>(
    keys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: { isLoading: false, error: null },
      }),
      {} as Record<T, LoadingState>
    )
  );

  const setLoading = useCallback((key: T, loading: boolean) => {
    setStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: loading,
        error: loading ? null : prev[key].error,
      },
    }));
  }, []);

  const setError = useCallback((key: T, error: string | null) => {
    setStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false,
      },
    }));
  }, []);

  const reset = useCallback(
    (key?: T) => {
      if (key) {
        setStates((prev) => ({
          ...prev,
          [key]: { isLoading: false, error: null },
        }));
      } else {
        setStates(
          keys.reduce(
            (acc, k) => ({
              ...acc,
              [k]: { isLoading: false, error: null },
            }),
            {} as Record<T, LoadingState>
          )
        );
      }
    },
    [keys]
  );

  const executeAsync = useCallback(
    async <R>(
      key: T,
      asyncFn: () => Promise<R>,
      errorMessage = 'Operation failed'
    ): Promise<R | null> => {
      try {
        setLoading(key, true);
        const result = await asyncFn();
        setLoading(key, false);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setError(key, errorMsg);
        return null;
      }
    },
    [setLoading, setError]
  );

  return {
    states,
    setLoading,
    setError,
    reset,
    executeAsync,
    isAnyLoading: Object.values(states).some(
      (state) => (state as LoadingState).isLoading
    ),
    hasAnyError: Object.values(states).some(
      (state) => (state as LoadingState).error !== null
    ),
  };
}
