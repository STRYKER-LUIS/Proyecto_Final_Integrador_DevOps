import { afterEach, describe, expect, it } from 'vitest';
import { tokenStore } from './token-store';

afterEach(() => {
  tokenStore.clear();
});

describe('tokenStore', () => {
  it('inicia sin token', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('guarda y recupera el access token en memoria', () => {
    tokenStore.set('access-token-123');
    expect(tokenStore.get()).toBe('access-token-123');
  });

  it('permite limpiar el token', () => {
    tokenStore.set('access-token-123');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });

  it('permite reemplazar el token', () => {
    tokenStore.set('primero');
    tokenStore.set('segundo');
    expect(tokenStore.get()).toBe('segundo');
  });

  it('acepta null para limpiar el token', () => {
    tokenStore.set('access-token-123');
    tokenStore.set(null);
    expect(tokenStore.get()).toBeNull();
  });
});
