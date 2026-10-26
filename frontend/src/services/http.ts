import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from '../lib/token-store';
import { refreshSession } from './auth.service';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) return Promise.reject(error);

    const config = error.config as RetryableRequestConfig | undefined;

    if (
      !config ||
      config._retry ||
      error.response?.status !== 401 ||
      isAuthEndpoint(config.url)
    ) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const session = await refreshSession();
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return await apiClient.request(config);
    } catch {
      sessionExpiredHandler?.();
      return Promise.reject(error);
    }
  },
);
