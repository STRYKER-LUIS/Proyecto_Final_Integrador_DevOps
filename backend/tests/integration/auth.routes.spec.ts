import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { AppError } from '../../src/utils/AppError';
import { REFRESH_COOKIE_NAME } from '../../src/utils/cookies';
import { adminUser, agentUser, authHeader, publicUser } from '../fixtures';

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    accessTokenTtlSeconds: 900,
  },
}));

const app = createApp();
const service = vi.mocked(authService);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('API de autenticación', () => {
  it('rechaza credenciales con formato inválido antes de llamar al servicio', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-correo', password: '' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(service.login).not.toHaveBeenCalled();
  });

  it('inicia sesión, normaliza el correo y emite cookie HttpOnly', async () => {
    service.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: publicUser(adminUser),
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ADMIN@INCIDENTHUB.DEV', password: 'Admin123!' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accessToken: 'access-token',
      expiresIn: 900,
      user: { role: 'ADMIN' },
    });
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(service.login).toHaveBeenCalledWith({
      email: 'admin@incidenthub.dev',
      password: 'Admin123!',
    });

    const cookie = response.headers['set-cookie'];
    const serializedCookie = Array.isArray(cookie) ? cookie.join(';') : String(cookie);
    expect(serializedCookie).toContain(`${REFRESH_COOKIE_NAME}=refresh-token`);
    expect(serializedCookie).toContain('HttpOnly');
    expect(serializedCookie).toContain('SameSite=Lax');
    expect(serializedCookie).toContain('Path=/api/auth');
  });

  it('no revela si el correo existe cuando las credenciales fallan', async () => {
    service.login.mockRejectedValue(
      AppError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS'),
    );

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@incidenthub.dev', password: 'incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenciales inválidas');
  });

  it('rechaza refresh sin cookie', async () => {
    const response = await request(app).post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('REFRESH_TOKEN_MISSING');
    expect(service.refresh).not.toHaveBeenCalled();
  });

  it('rota la sesión desde la cookie de refresco', async () => {
    service.refresh.mockResolvedValue({
      accessToken: 'nuevo-access',
      refreshToken: 'nuevo-refresh',
      user: publicUser(agentUser),
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=refresh-anterior`);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBe('nuevo-access');
    expect(service.refresh).toHaveBeenCalledWith('refresh-anterior');

    const cookie = response.headers['set-cookie'];
    const serializedCookie = Array.isArray(cookie) ? cookie.join(';') : String(cookie);
    expect(serializedCookie).toContain(`${REFRESH_COOKIE_NAME}=nuevo-refresh`);
  });

  it('limpia la cookie cuando el refresco es inválido', async () => {
    service.refresh.mockRejectedValue(
      AppError.unauthorized('Sesión inválida', 'INVALID_REFRESH_SESSION'),
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=invalido`);

    expect(response.status).toBe(401);
    const cookie = response.headers['set-cookie'];
    const serializedCookie = Array.isArray(cookie) ? cookie.join(';') : String(cookie);
    expect(serializedCookie).toContain(`${REFRESH_COOKIE_NAME}=;`);
  });

  it('cierra sesión de forma idempotente', async () => {
    service.logout.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=token`);

    expect(response.status).toBe(204);
    expect(service.logout).toHaveBeenCalledWith('token');
  });

  it('devuelve el perfil autenticado desde la base de datos', async () => {
    service.getCurrentUser.mockResolvedValue(publicUser(agentUser));

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader(agentUser));

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(agentUser.email);
    expect(service.getCurrentUser).toHaveBeenCalledWith(agentUser.id);
  });
});
