import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const incoming = request.header('x-request-id');
  const requestId =
    incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();

  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
};
