import { describe, expect, it } from 'vitest';
import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('devuelve una lista vacía cuando no hay páginas', () => {
    expect(getPageItems(1, 0)).toEqual([]);
    expect(getPageItems(1, -2)).toEqual([]);
  });

  it('muestra todas las páginas cuando hay siete o menos', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('muestra un bloque inicial con elipsis', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
    expect(getPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('muestra un bloque central con elipsis en ambos lados', () => {
    expect(getPageItems(5, 20)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]);
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
  });

  it('muestra un bloque final con elipsis', () => {
    expect(getPageItems(17, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
    expect(getPageItems(20, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });

  it('no repite números de página', () => {
    const items = getPageItems(10, 20).filter((item): item is number => item !== 'ellipsis');
    expect(new Set(items).size).toBe(items.length);
  });
});
