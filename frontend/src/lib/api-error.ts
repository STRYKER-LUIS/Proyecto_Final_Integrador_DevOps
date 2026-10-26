import { isAxiosError } from 'axios';
import type { ApiErrorBody, ApiErrorDetail } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorBody(value: unknown): ApiErrorBody['error'] | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;

  const { code, message, details, requestId } = value.error;
  if (typeof code !== 'string' || typeof message !== 'string') return null;

  return {
    code,
    message,
    details,
    requestId: typeof requestId === 'string' ? requestId : '',
  };
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string'
  );
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'No se pudo completar la operación. Inténtalo nuevamente.',
): string {
  if (!isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (error.code === 'ECONNABORTED') {
    return 'La solicitud tardó demasiado. Verifica tu conexión e inténtalo de nuevo.';
  }

  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
  }

  const body = readErrorBody(error.response.data);
  return body?.message ?? fallback;
}

export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;

  const body = readErrorBody(error.response?.data);
  return body?.code ?? null;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) return {};

  const body = readErrorBody(error.response?.data);
  if (!body || !Array.isArray(body.details)) return {};

  return body.details.reduce<Record<string, string>>((accumulator, detail) => {
    if (isApiErrorDetail(detail) && detail.field && !accumulator[detail.field]) {
      accumulator[detail.field] = detail.message;
    }

    return accumulator;
  }, {});
}

export function getApiRequestId(error: unknown): string | null {
  if (!isAxiosError(error)) return null;

  const body = readErrorBody(error.response?.data);
  return body?.requestId || null;
}
