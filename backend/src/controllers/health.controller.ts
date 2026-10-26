import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

const startedAt = Date.now();

export const healthController = {
  live: (_request: Request, response: Response): void => {
    response.status(200).json({
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  },

  ready: async (_request: Request, response: Response): Promise<void> => {
    try {
      await prisma.user.count();
      response.status(200).json({
        status: 'ready',
        checks: { database: 'up' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn({ err: error }, 'Readiness check failed');
      response.status(503).json({
        status: 'not_ready',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      });
    }
  },
};
