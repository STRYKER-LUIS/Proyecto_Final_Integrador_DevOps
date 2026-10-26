import { z } from 'zod';

export const idParamSchema = z
  .object({
    id: z.coerce
      .number({ error: 'El identificador no es válido' })
      .int('El identificador no es válido')
      .positive('El identificador no es válido')
      .max(2_147_483_647),
  })
  .strict();

export type IdParam = z.infer<typeof idParamSchema>;

const booleanQuery = z.preprocess((value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}, z.boolean());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const optionalBooleanQuery = booleanQuery.optional();
