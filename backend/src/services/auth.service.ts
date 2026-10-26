import { randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import type { AuthUser, PublicUser } from '../types/auth';
import type { LoginInput } from '../schemas/auth.schema';
import { AppError } from '../utils/AppError';
import { hashPassword, verifyPassword } from '../utils/password';
import { serializeUser } from '../utils/serializers';
import {
  getRefreshTokenExpiry,
  hashToken,
  safeTokenComparison,
} from '../utils/token';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../config/logger';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface RefreshedSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

let dummyPasswordHashPromise: Promise<string> | undefined;

function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHashPromise ??= hashPassword('timing-protection-placeholder');
  return dummyPasswordHashPromise;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function createSession(user: User): Promise<AuthSession> {
  const sessionId = randomUUID();
  const refreshToken = signRefreshToken(user.id, sessionId);

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    accessToken: signAccessToken(toAuthUser(user)),
    refreshToken,
    user: serializeUser(user),
  };
}

export const authService = {
  login: async (input: LoginInput): Promise<AuthSession> => {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const hashToCompare = user?.passwordHash ?? (await getDummyPasswordHash());
    const passwordIsValid = await verifyPassword(input.password, hashToCompare);

    if (!user || !passwordIsValid || !user.isActive) {
      throw AppError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    return createSession(user);
  },

  refresh: async (rawToken: string): Promise<RefreshedSession> => {
    const claims = verifyRefreshToken(rawToken);
    const now = new Date();

    const session = await prisma.refreshSession.findUnique({
      where: { id: claims.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= now.getTime() ||
      !session.user.isActive
    ) {
      throw AppError.unauthorized('Sesión inválida o expirada', 'INVALID_REFRESH_SESSION');
    }

    const presentedHash = hashToken(rawToken);
    if (!safeTokenComparison(presentedHash, session.tokenHash)) {
      // Un token válido criptográficamente pero ya rotado indica posible reutilización.
      await prisma.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
      logger.warn(
        { userId: session.userId, sessionId: session.id },
        'Refresh token reuse detected; session revoked',
      );
      throw AppError.unauthorized('Sesión inválida o expirada', 'INVALID_REFRESH_SESSION');
    }

    const newRefreshToken = signRefreshToken(session.user.id, session.id);
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        tokenHash: hashToken(newRefreshToken),
        expiresAt: getRefreshTokenExpiry(now),
      },
    });

    return {
      accessToken: signAccessToken(toAuthUser(session.user)),
      refreshToken: newRefreshToken,
      user: serializeUser(session.user),
    };
  },

  logout: async (rawToken: string | undefined): Promise<void> => {
    if (!rawToken) return;

    try {
      const claims = verifyRefreshToken(rawToken);
      await prisma.refreshSession.updateMany({
        where: {
          id: claims.sid,
          userId: claims.sub,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } catch {
      // El cierre de sesión es idempotente aunque el token ya no sea válido.
    }
  },

  getCurrentUser: async (userId: string): Promise<PublicUser> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('La cuenta no está disponible', 'ACCOUNT_UNAVAILABLE');
    }

    return serializeUser(user);
  },

  accessTokenTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
};
