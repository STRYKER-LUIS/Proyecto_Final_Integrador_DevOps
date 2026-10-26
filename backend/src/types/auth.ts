import type { AppRole } from '../domain/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}
