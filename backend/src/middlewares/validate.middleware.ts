import type { RequestHandler } from 'express';
import type { z } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

function validate(
  schema: z.ZodTypeAny,
  part: RequestPart,
): RequestHandler {
  return (request, _response, next) => {
    try {
      const parsed: unknown = schema.parse(request[part]);

      if (part === 'body') request.validatedBody = parsed;
      if (part === 'query') request.validatedQuery = parsed;
      if (part === 'params') request.validatedParams = parsed;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBody(schema: z.ZodTypeAny): RequestHandler {
  return validate(schema, 'body');
}

export function validateQuery(schema: z.ZodTypeAny): RequestHandler {
  return validate(schema, 'query');
}

export function validateParams(schema: z.ZodTypeAny): RequestHandler {
  return validate(schema, 'params');
}
