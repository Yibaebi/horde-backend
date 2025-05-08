import { paginatedReqBaseQuerySchema } from '@/schemas/app';
import { z } from 'zod';

// Get paginated notifications query schema
export const notifQuerySchema = paginatedReqBaseQuerySchema.and(
  z.object({
    read: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  })
);
