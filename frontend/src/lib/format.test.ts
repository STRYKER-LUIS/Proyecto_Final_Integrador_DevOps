import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatShortDate,
  formatTicketNumber,
  getInitials,
  pluralize,
  truncate,
} from './format';

const NOW = new Date('2026-10-24T12:00:00');

describe('formatDate', () => {
  it('formatea una fecha ISO con el locale es-CO', () => {
    expect(formatDate('2026-10-24')).toMatch(/24.*oct.*2026/i);
  });

  it('ancla las fechas sin hora al mediodía para no desplazar el día', () => {
    expect(formatDate('2026-01-01')).toMatch(/01.*ene.*2026/i);
  });

  it('acepta objetos Date', () => {
    expect(formatDate(NOW)).toMatch(/24.*oct.*2026/i);
  });
});

describe('formatDateTime y formatShortDate', () => {
  it('incluye la hora en el formato largo', () => {
    expect(formatDateTime(NOW)).toMatch(/24.*oct.*2026.*12:00/i);
  });

  it('omite el año en el formato corto', () => {
    expect(formatShortDate(NOW)).toMatch(/24.*oct/i);
    expect(formatShortDate(NOW)).not.toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  it('devuelve "ahora" para diferencias menores a 45 segundos', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 30_000), NOW)).toBe('ahora');
    expect(formatRelativeTime(new Date(NOW.getTime() + 30_000), NOW)).toBe('ahora');
  });

  it('expresa minutos, horas y días en español', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 5 * 60_000), NOW)).toBe('hace 5 minutos');
    expect(formatRelativeTime(new Date(NOW.getTime() + 2 * 3_600_000), NOW)).toBe(
      'dentro de 2 horas',
    );
    expect(formatRelativeTime(new Date(NOW.getTime() - 2 * 86_400_000), NOW)).toBe('anteayer');
  });

  it('usa la fecha absoluta cuando supera una semana', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 30 * 86_400_000), NOW)).toMatch(
      /sep.*2026/i,
    );
  });
});

describe('formatNumber, formatPercent y formatHours', () => {
  it('formatea números con separadores de miles', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('formatea porcentajes con decimales opcionales', () => {
    expect(formatPercent(12.34)).toBe('12,3 %');
    expect(formatPercent(100)).toBe('100 %');
    expect(formatPercent(12.34, 0)).toBe('12 %');
  });

  it('devuelve un guion para porcentajes inválidos', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(Number.NaN)).toBe('—');
  });

  it('convierte fracciones de hora a minutos', () => {
    expect(formatHours(0.5)).toBe('30 min');
    expect(formatHours(2.5)).toBe('2,5 h');
    expect(formatHours(0)).toBe('0 min');
    expect(formatHours(null)).toBe('—');
  });
});

describe('getInitials', () => {
  it('toma las iniciales de los dos primeros nombres', () => {
    expect(getInitials('Ana María López')).toBe('AM');
    expect(getInitials('  diego   agente ')).toBe('DA');
  });

  it('usa las dos primeras letras cuando hay un solo nombre', () => {
    expect(getInitials('Soporte')).toBe('SO');
  });

  it('devuelve un signo de interrogación cuando el nombre está vacío', () => {
    expect(getInitials('   ')).toBe('?');
  });
});

describe('truncate', () => {
  it('no modifica textos cortos', () => {
    expect(truncate('Incidente corto', 40)).toBe('Incidente corto');
  });

  it('recorta y agrega puntos suspensivos respetando el límite', () => {
    expect(truncate('La VPN corporativa no responde', 12)).toBe('La VPN corp…');
    expect(truncate('La VPN corporativa no responde', 12)).toHaveLength(12);
  });

  it('devuelve vacío para límites no positivos', () => {
    expect(truncate('texto', 0)).toBe('');
    expect(truncate('texto', -3)).toBe('');
  });
});

describe('formatTicketNumber y pluralize', () => {
  it('genera el número de ticket con seis dígitos', () => {
    expect(formatTicketNumber(1)).toBe('INC-000001');
    expect(formatTicketNumber(123456)).toBe('INC-123456');
  });

  it('selecciona singular o plural según la cantidad', () => {
    expect(pluralize(1, 'incidente', 'incidentes')).toBe('incidente');
    expect(pluralize(0, 'incidente', 'incidentes')).toBe('incidentes');
    expect(pluralize(5, 'incidente', 'incidentes')).toBe('incidentes');
  });
});
