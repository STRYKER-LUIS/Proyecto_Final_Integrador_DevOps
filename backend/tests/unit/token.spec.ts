import { describe, expect, it } from 'vitest';
import { hashToken, safeTokenComparison } from '../../src/utils/token';

describe('hash de tokens de sesión', () => {
  it('genera un SHA-256 determinista en hexadecimal', () => {
    const digest = hashToken('un-token-de-alta-entropía');

    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[a-f0-9]+$/);
    expect(hashToken('un-token-de-alta-entropía')).toBe(digest);
  });

  it('produce hashes diferentes para tokens diferentes', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('compara tokens en tiempo constante de forma segura', () => {
    const hash = hashToken('token-a');

    expect(safeTokenComparison(hash, hash)).toBe(true);
    expect(safeTokenComparison(hash, hashToken('token-b'))).toBe(false);
    expect(safeTokenComparison(hash, `${hash}0`)).toBe(false);
  });
});
