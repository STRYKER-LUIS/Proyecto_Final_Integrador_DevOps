import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('une clases verdaderas con un espacio', () => {
    expect(cn('base', 'activa', 'destacada')).toBe('base activa destacada');
  });

  it('descarta valores falsy', () => {
    expect(cn('base', false, null, undefined, '', 'extra')).toBe('base extra');
  });

  it('devuelve una cadena vacía sin valores', () => {
    expect(cn()).toBe('');
    expect(cn(false, null, undefined)).toBe('');
  });
});
