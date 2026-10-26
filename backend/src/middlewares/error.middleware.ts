import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { DomainError } from '../domain/errors';
import { AppError } from '../utils/AppError';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${request.method} ${request.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof DomainError) {
    statusCode = 409;
    code = error.code;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Los datos enviados no son válidos';
    details = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'payload',
      message: issue.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      code = 'RESOURCE_CONFLICT';
      message = 'El recurso ya existe';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'El recurso solicitado no existe';
    } else {
      statusCode = 400;
      code = 'DATABASE_REQUEST_ERROR';
      message = 'No se pudo completar la operación solicitada';
    }
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'El cuerpo de la petición no contiene JSON válido';
  }

  const requestId = request.requestId ?? 'unknown';

  if (statusCode >= 500) {
    logger.error({ err: error, requestId, path: request.originalUrl }, 'Unhandled request error');
  }

  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId,
    },
  };

  response.status(statusCode).json(body);
};
