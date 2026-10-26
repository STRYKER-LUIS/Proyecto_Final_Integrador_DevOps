import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

/**
 * Hash determinista para almacenar refresh tokens de alta entropía.
 * No se usa para contraseñas: para eso se emplea bcrypt.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function safeTokenComparison(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getRefreshTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
