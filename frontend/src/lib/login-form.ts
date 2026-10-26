export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = 'El correo es obligatorio.';
  } else if (!EMAIL_PATTERN.test(email) || email.length > 180) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (values.password.length > 128) {
    errors.password = 'La contraseña es demasiado larga.';
  }

  return errors;
}
