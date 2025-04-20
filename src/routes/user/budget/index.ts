import { Router } from 'express';

import {
  findBudgetByMonthAndYear,
  getCurrentMonthBudget,
  validateBudgetById,
} from '@/services/user';

import { formatSuccessResponse } from '@/utils/response';
import { validateRequestBody, validateRequestID } from '@/middlewares/validate-request';
import { createBudgetSchema } from '@/schemas/user';
import { constructBudgetCatKey, getCurrencySymbol } from '@/utils/helpers';
import { BadRequestError, NotFoundError } from '@/config/error';
import Budget from '@/models/budget';
import RES_CODE_MAP from '@/constants/res-code-map';
import type { INewBudgetDefaultsResponse } from '@/types';

import userBudgetSourcesRouter from './sources';
import userBudgetCategoryRouter from './categories';

const userBudgetRouter = Router();

// Get current month budget
userBudgetRouter.get('/current-budget', async (_req, res) => {
  const budget = await getCurrentMonthBudget();

  if (!budget) {
    throw new NotFoundError('No budget created for this month.');
  }

  res.send(
    formatSuccessResponse({
      message: 'Budget retrieved successfully.',
      data: budget.toObject(),
    })
  );
});

// Get all recurring categories and the most recent budget sources
userBudgetRouter.get('/new-budget-defaults', async (req, res) => {
  const userId = req.user?._id;

  const budgetDefaults = await Budget.aggregate<INewBudgetDefaultsResponse>([
    { $match: { user: userId } },
    {
      $facet: {
        recurringCategories: [
          { $unwind: '$categories' },
          {
            $addFields: {
              categoryName: '$categories.name',
            },
          },
          { $sort: { year: -1, month: -1 } },
          {
            $group: {
              _id: '$categoryName',
              count: { $sum: 1 },
              mostRecentOccurrence: {
                $first: {
                  budgetId: '$_id',
                  year: '$year',
                  month: '$month',
                  categoryKey: '$categories.key',
                  amountBudgeted: '$categories.amountBudgeted',
                  amountSpent: '$categories.amountSpent',
                },
              },
            },
          },
          { $match: { count: { $gt: 1 } } },
          {
            $project: {
              _id: 0,
              categoryName: '$_id',
              totalOccurrences: '$count',
              mostRecentOccurrence: 1,
            },
          },
          { $sort: { categoryName: 1 } },
          { $limit: 5 },
        ],

        latestIncomeSources: [
          { $sort: { year: -1, month: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, budgetSources: 1 } },
        ],
      },
    },
  ]);

  const { recurringCategories, latestIncomeSources } = budgetDefaults[0];
  const mostRecentIncomeSources = latestIncomeSources?.[0]?.budgetSources ?? [];

  res.send(
    formatSuccessResponse({
      message: 'Retrieved budget defaults.',
      data: {
        recurringCategories,
        mostRecentIncomeSources,
      },
    })
  );
});

// Create a budget for current month
userBudgetRouter.post('/', validateRequestBody(createBudgetSchema), async (req, res) => {
  const user = req.user;
  const { year, month, categories, currency, ...otherNewBudgetProps } = createBudgetSchema.parse(
    req.body
  );

  const duplicateBudget = await findBudgetByMonthAndYear(year, month);

  // Return early if budget for a month already exists
  if (duplicateBudget && duplicateBudget.year === year && duplicateBudget.month === month) {
    throw new BadRequestError('A budget for selected month and year has already been created');
  }

  // Add precalculated keys to categories
  const updatedCategories = categories.map((category) => ({
    ...category,
    key: constructBudgetCatKey(year, month, category.name),
  }));

  // Create new budget
  const budget = new Budget({
    ...otherNewBudgetProps,
    year,
    month,
    user: user?._id,
    currency,
    currencySym: getCurrencySymbol(currency),
    categories: updatedCategories,
  });

  await budget.save();

  res.status(RES_CODE_MAP.CREATED).send(
    formatSuccessResponse({
      status: RES_CODE_MAP.CREATED,
      message: 'Budget created successfully.',
      data: budget.toObject(),
    })
  );
});

// Budget Details Route
userBudgetRouter.get('/d/:id', validateRequestID, async (req, res) => {
  const budget = await validateBudgetById(req.params.id);
  await budget.refreshCategoryStats();

  res.send(
    formatSuccessResponse({
      message: 'Budget retrieved successfully.',
      data: budget.toObject(),
    })
  );
});

// All Budget Categories Route
userBudgetRouter.get('/d/:id/all-categories', validateRequestID, async (req, res) => {
  const budget = await validateBudgetById(req.params.id);
  await budget.refreshCategoryStats();

  res.send(
    formatSuccessResponse({
      message: 'Budget categories retrieved successfully.',
      data: budget.toObject({ virtuals: true }).categories,
    })
  );
});

// All Budget Income sources Route
userBudgetRouter.get('/d/:id/income-sources', validateRequestID, async (req, res) => {
  const budget = await validateBudgetById(req.params.id);
  await budget.refreshCategoryStats();

  res.send(
    formatSuccessResponse({
      message: 'Budget income sources retrieved successfully.',
      data: budget.toObject().budgetSources,
    })
  );
});

// CRUD for income sources
userBudgetRouter.use('/d', userBudgetSourcesRouter);

// CRUD for categories
userBudgetRouter.use('/d', userBudgetCategoryRouter);

export default userBudgetRouter;
