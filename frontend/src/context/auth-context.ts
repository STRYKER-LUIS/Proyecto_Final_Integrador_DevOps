import { createContext } from 'react';
import type { LoginPayload, PublicUser } from '../types';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
