import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/utils/AppError';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt';
import type { AuthUser } from '../../src/types/auth';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Usuario de Prueba',
  email: 'test@incidenthub.dev',
  role: 'AGENT',
};

const sessionId = '22222222-2222-4222-8222-222222222222';

describe('servicio JWT', () => {
  it('firma y verifica un access token con sus claims', () => {
    const token = signAccessToken(user);
    const claims = verifyAccessToken(token);

    expect(claims).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });

  it('firma y verifica un refresh token', () => {
    const token = signRefreshToken(user.id, sessionId);
    const claims = verifyRefreshToken(token);

    expect(claims.sub).toBe(user.id);
    expect(claims.sid).toBe(sessionId);
    expect(claims.type).toBe('refresh');
  });

  it('rechaza un token manipulado', () => {
    const token = signAccessToken(user);
    const manipulated = `${token.slice(0, -2)}xx`;

    expect(() => verifyAccessToken(manipulated)).toThrowError(AppError);
  });

  it('no acepta refresh tokens como access tokens', () => {
    const refreshToken = signRefreshToken(user.id, sessionId);
    expect(() => verifyAccessToken(refreshToken)).toThrowError(AppError);
  });

  it('no acepta access tokens como refresh tokens', () => {
    const accessToken = signAccessToken(user);
    expect(() => verifyRefreshToken(accessToken)).toThrowError(AppError);
  });
});
