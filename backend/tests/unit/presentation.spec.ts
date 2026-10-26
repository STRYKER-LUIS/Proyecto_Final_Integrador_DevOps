import { describe, expect, it } from 'vitest';
import { buildPagination } from '../../src/utils/pagination';
import { formatTicketNumber } from '../../src/utils/ticket';

describe('utilidades de presentación', () => {
  it('calcula metadatos de paginación', () => {
    expect(buildPagination(1, 10, 25)).toEqual({
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('maneja resultados vacíos sin páginas fantasma', () => {
    expect(buildPagination(1, 20, 0).totalPages).toBe(0);
  });

  it('formatea el número de ticket con seis dígitos', () => {
    expect(formatTicketNumber(1)).toBe('INC-000001');
    expect(formatTicketNumber(42)).toBe('INC-000042');
    expect(formatTicketNumber(1234567)).toBe('INC-1234567');
  });
});
