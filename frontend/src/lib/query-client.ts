import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;

  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
      return false;
    }
  }

  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
