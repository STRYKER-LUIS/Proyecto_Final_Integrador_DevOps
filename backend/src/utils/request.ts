import type { Request } from 'express';
import { AppError } from './AppError';
import type { AuthUser } from '../types/auth';

export function getAuthUser(request: Request): AuthUser {
  if (!request.user) {
    throw AppError.unauthorized();
  }
  return request.user;
}

export function getValidatedBody<T>(request: Request): T {
  if (request.validatedBody === undefined) {
    throw new AppError(500, 'VALIDATION_CONTEXT_MISSING', 'El contexto de validación no está disponible');
  }
  return request.validatedBody as T;
}

export function getValidatedQuery<T>(request: Request): T {
  if (request.validatedQuery === undefined) {
    throw new AppError(500, 'VALIDATION_CONTEXT_MISSING', 'El contexto de validación no está disponible');
  }
  return request.validatedQuery as T;
}

export function getValidatedParams<T>(request: Request): T {
  if (request.validatedParams === undefined) {
    throw new AppError(500, 'VALIDATION_CONTEXT_MISSING', 'El contexto de validación no está disponible');
  }
  return request.validatedParams as T;
}
