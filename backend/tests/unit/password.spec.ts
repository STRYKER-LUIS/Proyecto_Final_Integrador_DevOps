import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('utilidades de contraseña', () => {
  it('genera un hash bcrypt y verifica la contraseña correcta', async () => {
    const hash = await hashPassword('S3gura!Password');

    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toContain('S3gura!Password');
    await expect(verifyPassword('S3gura!Password', hash)).resolves.toBe(true);
  });

  it('rechaza contraseñas incorrectas y hashes inválidos', async () => {
    const hash = await hashPassword('S3gura!Password');

    await expect(verifyPassword('incorrecta', hash)).resolves.toBe(false);
    await expect(verifyPassword('S3gura!Password', 'hash-invalido')).resolves.toBe(false);
    await expect(verifyPassword('', hash)).resolves.toBe(false);
  });
});
