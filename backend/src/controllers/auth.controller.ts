import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import type { LoginInput } from '../schemas/auth.schema';
import {
  clearRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from '../utils/cookies';
import { AppError } from '../utils/AppError';
import { getAuthUser, getValidatedBody } from '../utils/request';

export const authController = {
  login: async (request: Request, response: Response): Promise<void> => {
    const input = getValidatedBody<LoginInput>(request);
    const session = await authService.login(input);

    setRefreshCookie(response, session.refreshToken);

    response.status(200).json({
      accessToken: session.accessToken,
      expiresIn: authService.accessTokenTtlSeconds,
      user: session.user,
    });
  },

  refresh: async (request: Request, response: Response): Promise<void> => {
    const refreshToken = getRefreshCookie(request);

    if (!refreshToken) {
      throw AppError.unauthorized('No hay una sesión activa', 'REFRESH_TOKEN_MISSING');
    }

    try {
      const session = await authService.refresh(refreshToken);
      setRefreshCookie(response, session.refreshToken);

      response.status(200).json({
        accessToken: session.accessToken,
        expiresIn: authService.accessTokenTtlSeconds,
        user: session.user,
      });
    } catch (error) {
      clearRefreshCookie(response);
      throw error;
    }
  },

  logout: async (request: Request, response: Response): Promise<void> => {
    const refreshToken = getRefreshCookie(request);
    await authService.logout(refreshToken);
    clearRefreshCookie(response);
    response.status(204).send();
  },

  me: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const freshUser = await authService.getCurrentUser(user.id);
    response.status(200).json({ user: freshUser });
  },
};
