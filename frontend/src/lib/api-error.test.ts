import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
  getApiRequestId,
} from './api-error';

function responseWith(data: unknown): AxiosResponse {
  return {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
}

function axiosError(
  data: unknown,
  options: { code?: string; withResponse?: boolean } = {},
): AxiosError {
  return new AxiosError(
    'Request failed',
    options.code ?? 'ERR_BAD_REQUEST',
    undefined,
    undefined,
    options.withResponse === false ? undefined : responseWith(data),
  );
}

const ERROR_BODY = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Los datos enviados no son válidos.',
    requestId: 'req-123',
    details: [
      { field: 'title', message: 'El título es obligatorio.' },
      { field: 'description', message: 'La descripción es obligatoria.' },
      { field: 'title', message: 'Mensaje duplicado que debe ignorarse.' },
      { field: 'not-a-valid-detail' },
    ],
  },
};

describe('getApiErrorMessage', () => {
  it('devuelve el mensaje del backend', () => {
    expect(getApiErrorMessage(axiosError(ERROR_BODY))).toBe(
      'Los datos enviados no son válidos.',
    );
  });

  it('devuelve el fallback cuando la respuesta no tiene el formato esperado', () => {
    expect(getApiErrorMessage(axiosError({ message: 'otro formato' }))).toBe(
      'No se pudo completar la operación. Inténtalo nuevamente.',
    );
  });

  it('informa cuando la solicitud excede el tiempo de espera', () => {
    expect(getApiErrorMessage(axiosError(ERROR_BODY, { code: 'ECONNABORTED' }))).toBe(
      'La solicitud tardó demasiado. Verifica tu conexión e inténtalo de nuevo.',
    );
  });

  it('informa cuando no hay conexión con el servidor', () => {
    expect(getApiErrorMessage(axiosError(ERROR_BODY, { withResponse: false }))).toBe(
      'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
    );
  });

  it('usa el mensaje de un Error normal', () => {
    expect(getApiErrorMessage(new Error('Falla local'))).toBe('Falla local');
  });

  it('usa el fallback para valores desconocidos', () => {
    expect(getApiErrorMessage(null)).toBe(
      'No se pudo completar la operación. Inténtalo nuevamente.',
    );
    expect(getApiErrorMessage('error')).toBe(
      'No se pudo completar la operación. Inténtalo nuevamente.',
    );
  });

  it('acepta un fallback personalizado', () => {
    expect(getApiErrorMessage(null, 'Correo o contraseña incorrectos.')).toBe(
      'Correo o contraseña incorrectos.',
    );
  });
});

describe('getApiErrorCode', () => {
  it('devuelve el código del error', () => {
    expect(getApiErrorCode(axiosError(ERROR_BODY))).toBe('VALIDATION_ERROR');
  });

  it('devuelve null para errores que no son de Axios o sin cuerpo válido', () => {
    expect(getApiErrorCode(new Error('local'))).toBeNull();
    expect(getApiErrorCode(axiosError({ foo: 'bar' }))).toBeNull();
  });
});

describe('getApiFieldErrors', () => {
  it('convierte los detalles en un mapa de errores por campo', () => {
    expect(getApiFieldErrors(axiosError(ERROR_BODY))).toEqual({
      title: 'El título es obligatorio.',
      description: 'La descripción es obligatoria.',
    });
  });

  it('devuelve un objeto vacío cuando no hay detalles válidos', () => {
    expect(getApiFieldErrors(axiosError({ error: { code: 'X', message: 'Y' } }))).toEqual({});
    expect(getApiFieldErrors(new Error('local'))).toEqual({});
  });
});

describe('getApiRequestId', () => {
  it('devuelve el identificador de la solicitud', () => {
    expect(getApiRequestId(axiosError(ERROR_BODY))).toBe('req-123');
  });

  it('devuelve null cuando no existe', () => {
    expect(
      getApiRequestId(axiosError({ error: { code: 'X', message: 'Y', requestId: '' } })),
    ).toBeNull();
    expect(getApiRequestId(null)).toBeNull();
  });
});
