import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';
import type { AppRole } from '../domain/types';

export const authenticate: RequestHandler = (request, _response, next) => {
  try {
    const authorization = request.headers.authorization;
    const match = authorization ? /^Bearer\s+(.+)$/i.exec(authorization) : null;

    if (!match || !match[1]) {
      throw AppError.unauthorized('Se requiere un token de acceso');
    }

    const claims = verifyAccessToken(match[1].trim());
    request.user = {
      id: claims.id,
      email: claims.email,
      name: claims.name,
      role: claims.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export function authorize(...roles: AppRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      next(AppError.unauthorized());
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(AppError.forbidden());
      return;
    }

    next();
  };
}
