import z from 'zod';

import {
  budgetMonthSchema,
  budgetYearSchema,
  nonEmptySchema,
  objectIDSchema,
  paginatedReqBaseQuerySchema,
} from '@/schemas/app';

import { CurrencyOptions } from '@/types';

// Budget category schema
export const budgetCategorySchema = z
  .object({
    name: z.string().min(1, 'Category name is required'),
    amountBudgeted: z.number().nonnegative('Amount budgeted must be a positive number'),
  })
  .strict();

export const budgetCategoriesSchema = z
  .array(nonEmptySchema({ schema: budgetCategorySchema }))
  .min(1, 'At least one category is required');

// Edit budget category params/props
export const editBudgetCatSchemaParams = objectIDSchema.extend({
  catId: objectIDSchema.shape.id,
});

export const editBudgetCatSchema = nonEmptySchema({
  schema: budgetCategorySchema.partial(),
});

// Income source schema
export const budgetIncomeSourceSchema = z
  .object({
    name: z.string().min(1, 'Budget source name is required'),
    amount: z.number().nonnegative('Amount must be a positive number'),
    description: z.string().optional(),
    recurring: z.boolean().optional().default(true),
    frequency: z.enum(['monthly', 'one-time']).default('monthly'),
  })
  .strict();

export const budgetISSchema = z
  .array(nonEmptySchema({ schema: budgetIncomeSourceSchema }))
  .min(1, 'At least one budget source is required');

// Edit budget income source params
export const editBudgetISParamsSchema = objectIDSchema.extend({
  sourceId: objectIDSchema.shape.id,
});

export const editBudgetISSchema = nonEmptySchema({
  schema: budgetIncomeSourceSchema.partial(),
});

// Schema for creating a new budget
export const budgetSchema = z
  .object({
    currency: z
      .nativeEnum(CurrencyOptions, { invalid_type_error: 'Invalid currency option' })
      .optional(),
    categories: budgetCategoriesSchema,
    year: budgetYearSchema,
    month: budgetMonthSchema,
    budgetSources: budgetISSchema,
  })
  .strict();

export const budgetByMonthAndYearSchema = z.object({
  year: budgetYearSchema,
  month: budgetMonthSchema,
});

export const createBudgetSchema = nonEmptySchema({ schema: budgetSchema });

// Schema for editing an existing budget
export const editBudgetSchema = nonEmptySchema({
  schema: budgetSchema.pick({ currency: true, year: true, month: true }).strict(),
});

// Schema for paginated budget query
export const budgetFilterStateSchema = z
  .object({
    sortField: z.enum(['year', 'budgeted', 'spent', 'remaining', 'percentage']),
    sortOrder: z.enum(['asc', 'desc']),
    budgetAmountFilter: z.enum(['all', 'over', 'under', 'unused']),

    yearFilter: z
      .string()
      .or(budgetYearSchema)
      .transform((val) => (val === 'all' ? null : val)),

    monthFilter: z
      .string()
      .or(budgetMonthSchema)
      .transform((val) => (val === 'all' ? null : val)),
  })
  .partial();

export const paginatedBudgetQuerySchema = paginatedReqBaseQuerySchema.and(budgetFilterStateSchema);
