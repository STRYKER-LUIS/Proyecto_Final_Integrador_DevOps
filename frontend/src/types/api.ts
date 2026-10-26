import type { PublicUser } from './domain';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
}

export interface MeResponse {
  user: PublicUser;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
    requestId: string;
  };
}
