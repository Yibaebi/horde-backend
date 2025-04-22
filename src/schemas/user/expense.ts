import { z } from 'zod';
import dayjs from 'dayjs';

import {
  budgetMonthSchema,
  budgetYearSchema,
  nonEmptySchema,
  objectIDSchema,
  paginatedReqBodySchema,
} from '../app';
import _ from 'lodash';

// Base schema for expense validation
const baseExpenseSchema = z
  .object({
    amount: z.number().nonnegative().gt(0, { message: 'Amount must be greater than zero' }),
    description: z.string(),
    expenseDate: z
      .string()
      .or(z.date())
      .default(dayjs().toDate())
      .transform((val) => dayjs(val).toDate())
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid transaction date',
      }),
  })
  .strict();

// Schema for creating a new expense
const createExpenseModels = z
  .object({
    budget: objectIDSchema.shape.id,
    category: objectIDSchema.shape.id,
  })
  .strict();

export const createExpenseSchema = nonEmptySchema({
  schema: baseExpenseSchema.extend(createExpenseModels.shape),
});

// Schema for updating an expense
export const editExpenseSchema = nonEmptySchema({
  schema: baseExpenseSchema.partial().extend(createExpenseModels.shape),
});

// Schema for deleting multiple expenses
export const deleteMultipleExpenseSchema = nonEmptySchema({
  schema: createExpenseModels
    .pick({ budget: true })
    .extend({ category: objectIDSchema.shape.id.optional() }),
});

// Query expenses data
export const expenseQuerySchema = z
  .object({
    // Year and month Schema
    year: budgetYearSchema,
    month: budgetMonthSchema,

    // Optional amount filters
    minAmount: z.number().nonnegative(),
    maxAmount: z.number().nonnegative(),
    exactAmount: z.number().nonnegative(),

    // Text search for description
    description: z.string(),

    // Date range filters
    startDate: z
      .string()
      .or(z.date())
      .transform((val) => (val ? dayjs(val).startOf('day').toDate() : undefined)),

    endDate: z
      .string()
      .or(z.date())
      .transform((val) => (val ? dayjs(val).endOf('day').toDate() : undefined)),

    // Budget and category filters (optional to allow querying across all)
    budget: objectIDSchema.shape.id,
    category: objectIDSchema.shape.id,

    // Sorting
    sortBy: z.enum(['amount', 'expenseDate', 'createdAt']).default('expenseDate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .partial()
  .extend(paginatedReqBodySchema.shape)
  .strict()
  .refine(
    ({ minAmount, maxAmount }) =>
      !_.every([_.isNumber(minAmount) && _.isNumber(maxAmount), _.gt(minAmount, maxAmount)]),
    {
      message: 'Minimum amount cannot be greater than maximum amount',
      path: ['minAmount'],
    }
  )
  .refine(
    (data) =>
      !(data.startDate && data.endDate && dayjs(data.startDate).isAfter(dayjs(data.endDate))),
    {
      message: 'Start date cannot be after end date',
      path: ['startDate'],
    }
  );
