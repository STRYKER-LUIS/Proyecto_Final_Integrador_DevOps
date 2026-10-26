import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, refreshSession } from '../services/auth.service';
import { setSessionExpiredHandler } from '../services/http';
import { tokenStore } from '../lib/token-store';
import type { LoginPayload, PublicUser } from '../types';
import { AuthContext, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    refreshSession()
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        tokenStore.clear();
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      tokenStore.clear();
      setUser(null);
      setStatus('anonymous');
      queryClient.clear();
    });

    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<PublicUser> => {
      const session = await authApi.login(payload);
      tokenStore.set(session.accessToken);
      queryClient.clear();
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [queryClient],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      queryClient.clear();
      setUser(null);
      setStatus('anonymous');
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
