import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { isTest } from '../config/env';

function rateLimitResponse(request: Request, response: Response): void {
  response.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.',
      requestId: request.requestId ?? 'unknown',
    },
  });
}

export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  handler: rateLimitResponse,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isTest,
  handler: rateLimitResponse,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  handler: rateLimitResponse,
});
