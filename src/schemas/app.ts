import dayjs from 'dayjs';
import mongoose from 'mongoose';
import z from 'zod';

// Prevent sending empty json
export const nonEmptySchema = <T extends z.ZodSchema>({
  schema,
  message,
}: {
  schema: T;
  message?: string;
}): z.ZodEffects<T> =>
  schema.refine((data) => Object.keys(data).length > 0, {
    message: message || 'At least one field must be provided',
    path: ['_invalid'],
  });

// Object ID Schema
export const objectIDSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid request ID',
  }),
});

// For paginated routes
export const paginatedReqBodySchema = z
  .object({
    limit: z.number().int().nonnegative().min(1).max(100).default(10),
    page: z.number().int().nonnegative().min(1).default(1),
  })
  .strict();

export const paginatedReqQuerySchema = z
  .object({
    limit: z
      .string()
      .default('10')
      .transform((val) => parseInt(val)),

    page: z
      .string()
      .default('1')
      .transform((val) => parseInt(val)),
  })
  .strict()
  .partial()
  .transform((data) => ({ limit: data?.limit ?? 10, page: data?.page ?? 1 }))
  .refine(({ page }) => page > 0, { message: 'Page should be 1 or more', path: ['page'] })
  .refine(({ limit }) => limit > 0 && limit <= 100, {
    message: 'Limit must be between 1 and 100',
    path: ['limit'],
  });

// Year Schema
export const budgetYearSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .default(() => dayjs().year());

export const budgetMonthSchema = z
  .number()
  .int()
  .min(0)
  .max(11)
  .default(() => dayjs().month());
