import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { ROLES } from '../domain/types';
import type { AuthUser } from '../types/auth';
import { AppError } from './AppError';

const JWT_ISSUER = 'incident-hub-api';
const JWT_AUDIENCE = 'incident-hub-web';
const ALGORITHM = 'HS256';

const accessClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(ROLES),
  type: z.literal('access'),
  jti: z.string().uuid(),
  iat: z.number().int(),
  exp: z.number().int(),
});

const refreshClaimsSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
  type: z.literal('refresh'),
  jti: z.string().uuid(),
  iat: z.number().int(),
  exp: z.number().int(),
});

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  role: AuthUser['role'];
  type: 'access';
}

export interface RefreshTokenClaims {
  sub: string;
  sid: string;
  type: 'refresh';
}

interface VerifiedAccessClaims {
  id: string;
  email: string;
  name: string;
  role: AuthUser['role'];
}

const baseOptions: SignOptions = {
  algorithm: ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenClaims = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    ...baseOptions,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    jwtid: randomUUID(),
  });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  const payload: RefreshTokenClaims = {
    sub: userId,
    sid: sessionId,
    type: 'refresh',
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    ...baseOptions,
    expiresIn: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60,
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string): VerifiedAccessClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (typeof decoded === 'string') {
      throw new Error('Formato de token inválido');
    }

    const parsed = accessClaimsSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new Error('Claims de acceso inválidos');
    }

    return {
      id: parsed.data.sub,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    };
  } catch {
    throw AppError.unauthorized('Sesión inválida o expirada', 'INVALID_ACCESS_TOKEN');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: [ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (typeof decoded === 'string') {
      throw new Error('Formato de token inválido');
    }

    const parsed = refreshClaimsSchema.safeParse(decoded);
    if (!parsed.success) {
      throw new Error('Claims de refresco inválidos');
    }

    return {
      sub: parsed.data.sub,
      sid: parsed.data.sid,
      type: parsed.data.type,
    };
  } catch {
    throw AppError.unauthorized('Sesión inválida o expirada', 'INVALID_REFRESH_TOKEN');
  }
}
