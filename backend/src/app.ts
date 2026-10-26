import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalApiLimiter } from './middlewares/rateLimit.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { apiRouter } from './routes';
import { healthRouter } from './routes/health.routes';
import { AppError } from './utils/AppError';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.disable('etag');
  app.set('query parser', 'simple');

  if (env.TRUST_PROXY > 0) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      logger,
      genReqId: (request) => {
        const instrumentedRequest = request as IncomingMessage & { requestId?: string };
        return instrumentedRequest.requestId ?? randomUUID();
      },
      autoLogging: {
        ignore: (request) =>
          typeof request.url === 'string' &&
          (request.url.startsWith('/health') || request.url.startsWith('/api/health')),
      },
      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) return 'error';
        if (response.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(
          new AppError(403, 'CORS_ORIGIN_DENIED', 'El origen de la petición no está permitido'),
        );
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 86_400,
      optionsSuccessStatus: 204,
    }),
  );

  app.use(express.json({ limit: '256kb', strict: true }));
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);

  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('Pragma', 'no-cache');
    next();
  });
  app.use('/api', globalApiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { env };
