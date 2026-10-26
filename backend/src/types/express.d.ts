import type { AuthUser } from '../types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId: string;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};
