import { describe, expect, it } from 'vitest';
import { validateLoginForm } from './login-form';

describe('validateLoginForm', () => {
  it('acepta credenciales válidas', () => {
    expect(
      validateLoginForm({
        email: 'admin@incidenthub.dev',
        password: 'Admin123!',
      }),
    ).toEqual({});
  });

  it('exige correo y contraseña', () => {
    expect(validateLoginForm({ email: '', password: '' })).toEqual({
      email: 'El correo es obligatorio.',
      password: 'La contraseña es obligatoria.',
    });
  });

  it('rechaza correos con formato inválido', () => {
    for (const email of ['sin-arroba', 'a@b', '@dominio.com', 'a b@dominio.com']) {
      expect(validateLoginForm({ email, password: 'secreta' }).email).toBe(
        'Ingresa un correo válido.',
      );
    }
  });

  it('limita la longitud del correo a 180 caracteres', () => {
    const email = `${'a'.repeat(170)}@incidenthub.dev`;

    expect(validateLoginForm({ email, password: 'secreta' }).email).toBe(
      'Ingresa un correo válido.',
    );
  });

  it('limita la longitud de la contraseña a 128 caracteres', () => {
    expect(
      validateLoginForm({ email: 'admin@incidenthub.dev', password: 'x'.repeat(129) }).password,
    ).toBe('La contraseña es demasiado larga.');
  });

  it('recorta espacios del correo antes de validar', () => {
    expect(
      validateLoginForm({ email: '  admin@incidenthub.dev  ', password: 'Admin123!' }),
    ).toEqual({});
  });
});
