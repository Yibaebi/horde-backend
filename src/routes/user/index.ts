import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import { validateRequestBody } from '@/middlewares/validate-request';
import { paginatedReqQuerySchema } from '@/schemas/app';
import { Theme, CurrencyOptions, DateFormat, TimeFormat, type IUserProps } from '@/types';
import Budget from '@/models/budget';

import userSettingsRouter from './settings';
import userBudgetRouter from './budget';
import userExpensesRouter from './expense';

const userRouter = Router();

// Retrieves the currently authenticated user's information.
userRouter.get('/me', (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Successfully retrieved authenticated user profile.',
      data: req.user,
    })
  )
);

// User preferences route
userRouter.get('/preferences', async (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Preferences retrieved successfully.',
      data: (req.user as IUserProps).preferences,
    })
  )
);

// Get user config defaults
userRouter.get('/config-options', async (_req, res) => {
  const userDefaultConfigs = {
    themes: Theme,
    currencies: CurrencyOptions,
    dateFormats: DateFormat,
    timeFormats: TimeFormat,
  };

  const configOptions = Object.keys(userDefaultConfigs).reduce(
    (configs, currKey) => ({
      ...configs,
      [currKey]: Object.values(userDefaultConfigs[currKey as keyof typeof userDefaultConfigs]),
    }),
    {}
  );

  return res.json(
    formatSuccessResponse({
      message: 'Retrieved User Config Successfully.',
      data: configOptions,
    })
  );
});

// User settings route
userRouter.use('/settings', userSettingsRouter);

// User Budget route
userRouter.use('/budget', userBudgetRouter);

// User Expenses route
userRouter.use('/expense', userExpensesRouter);

// Get paginated user budgets
userRouter.get('/budgets', validateRequestBody(paginatedReqQuerySchema), async (req, res) => {
  const userId = req.user?._id;
  const { limit, page } = paginatedReqQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const result = await Budget.aggregate([
    { $match: { user: userId } },
    {
      $addFields: {
        // Calculate amountBudgeted from budgetSources
        amountBudgeted: {
          $reduce: {
            input: '$budgetSources',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.amount'] },
          },
        },

        // Calculate amountSpent from categories
        amountSpent: {
          $reduce: {
            input: '$categories',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.amountSpent'] },
          },
        },
      },
    },

    // Calculate budgetVariance based on the fields above
    {
      $addFields: {
        budgetVariance: { $subtract: ['$amountBudgeted', '$amountSpent'] },
      },
    },
    {
      $facet: {
        budgets: [
          { $sort: { year: -1, month: -1 } },
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $project: { budgetSources: 0, categories: 0, __v: 0, user: 0, createdAt: 0 },
          },
        ],
        meta: [{ $count: 'totalCount' }],
      },
    },
  ]);

  const budgets = result[0].budgets;
  const { totalCount } = result[0].meta[0] as { totalCount: number };

  res.send(
    formatSuccessResponse({
      message: 'Budget retrieved successfully.',
      data: {
        budgets,
        pagination: {
          totalItemsCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPageCount: budgets.length,
          page,
          limit,
        },
      },
    })
  );
});

export default userRouter;
