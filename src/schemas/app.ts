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

export const paginatedReqBaseQuerySchema = z
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
  .partial()
  .transform((data) => ({ limit: data?.limit ?? 10, page: data?.page ?? 1 }))
  .refine(({ page }) => page > 0, { message: 'Page should be 1 or more', path: ['page'] })
  .refine(({ limit }) => limit > 0 && limit <= 100, {
    message: 'Limit must be between 1 and 100',
    path: ['limit'],
  });

// Year Schema - 2000 to current year
export const budgetYearSchema = z
  .string()
  .transform((val) => parseInt(val))
  .refine((val) => val >= 2000 && val <= dayjs().year(2099).year(), {
    message: 'Year must be between 2000 and 2099',
    path: ['year'],
  })
  .optional()
  .default(() => dayjs().year().toString());

// Month Schema - 0 to 11
export const budgetMonthSchema = z
  .string()
  .transform((val) => parseInt(val))
  .refine((val) => val >= 0 && val <= 11, {
    message: 'Month must be between 0 and 11',
    path: ['month'],
  })
  .optional()
  .default(() => dayjs().month().toString());
