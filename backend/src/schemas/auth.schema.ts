import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z
      .string({ error: 'El correo es obligatorio' })
      .trim()
      .email('El correo no es válido')
      .max(180)
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ error: 'La contraseña es obligatoria' })
      .min(1, 'La contraseña es obligatoria')
      .max(128, 'La contraseña es demasiado larga'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
