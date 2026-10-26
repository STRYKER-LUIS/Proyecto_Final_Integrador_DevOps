import axios from 'axios';
import { tokenStore } from '../lib/token-store';
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  PublicUser,
} from '../types';

const authClient = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<AuthResponse> | null = null;

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await authClient.post<AuthResponse>('/login', payload);
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await authClient.post<AuthResponse>('/refresh');
    return data;
  },

  async logout(): Promise<void> {
    await authClient.post('/logout');
  },

  async me(): Promise<PublicUser> {
    const { data } = await authClient.get<MeResponse>('/me', {
      headers: tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : undefined,
    });
    return data.user;
  },
};

/**
 * Refresco con una única petición en vuelo. Evita que varias respuestas 401
 * simultáneas roten el refresh token más de una vez y activen la detección
 * de reutilización del backend.
 */
export function refreshSession(): Promise<AuthResponse> {
  refreshPromise ??= authApi
    .refresh()
    .then((session) => {
      tokenStore.set(session.accessToken);
      return session;
    })
    .catch((error: unknown) => {
      tokenStore.clear();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
