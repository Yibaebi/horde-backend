import { Router } from 'express';
import dayjs from 'dayjs';

import {
  findBudgetByMonthAndYear,
  getCurrentMonthBudget,
  validateBudgetById,
} from '@/services/user';

import { formatSuccessResponse } from '@/utils/response';
import {
  validateRequestBody,
  validateRequestID,
  validateRequestQuery,
} from '@/middlewares/validate-request';

import {
  budgetByMonthAndYearSchema,
  createBudgetSchema,
  paginatedBudgetQuerySchema,
} from '@/schemas/user';

import { constructBudgetCatKey, getCurrencySymbol, getEndAndStartOfMonth } from '@/utils/helpers';
import { BadRequestError, NotFoundError } from '@/config/error';
import { sendNotificationToUser } from '@/config/socket';
import Budget from '@/models/budget';
import Notification from '@/models/notification';
import ExpenseModel from '@/models/expense';
import RES_CODE_MAP from '@/constants/res-code-map';

import type {
  CurrencyOptions,
  ICurrentMonthAnalyticsData,
  ICurrentMonthAnalyticsResponse,
  INewBudgetDefaultsResponse,
} from '@/types';

import userBudgetCategoryRouter from './categories';
import userBudgetSourcesRouter from './sources';

const userBudgetRouter = Router();

// Get paginated user budgets
userBudgetRouter.get(
  '/get-all',
  validateRequestBody(paginatedBudgetQuerySchema),
  async (req, res) => {
    const userId = req.user?._id;

    const {
      limit,
      page,
      yearFilter,
      monthFilter,
      sortField = 'year',
      sortOrder = 'desc',
      budgetAmountFilter = 'all',
    } = paginatedBudgetQuerySchema.parse(req.query);

    const skip = (page - 1) * limit;

    // Build match conditions
    const matchConditions: { user?: string; year?: number; month?: number } = {
      user: userId,
    };

    // Add year filter if provided
    if (yearFilter) {
      matchConditions.year = Number(yearFilter);
    }

    // Add month filter if provided
    if (monthFilter) {
      matchConditions.month = Number(monthFilter);
    }

    console.log({ matchConditions });

    const result = await Budget.aggregate([
      { $match: matchConditions },
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
          // Add percentage spent for filtering
          percentageSpent: {
            $cond: {
              if: { $eq: ['$amountBudgeted', 0] },
              then: 0,
              else: { $multiply: [{ $divide: ['$amountSpent', '$amountBudgeted'] }, 100] },
            },
          },
        },
      },

      // Apply budget amount filter
      ...(budgetAmountFilter !== 'all'
        ? [
            {
              $match: {
                $expr: {
                  [budgetAmountFilter === 'over'
                    ? '$lt'
                    : budgetAmountFilter === 'under'
                      ? '$gt'
                      : budgetAmountFilter === 'unused'
                        ? '$eq'
                        : '$exists']: [
                    [budgetAmountFilter === 'unused' ? '$amountSpent' : '$budgetVariance'],
                    [budgetAmountFilter === 'unused' ? 0 : 0],
                  ],
                },
              },
            },
          ]
        : []),

      // Add most used category for each budget (simplified to max spending)
      {
        $addFields: {
          mostUsedCategory: {
            $cond: {
              if: { $gt: [{ $size: '$categories' }, 0] },
              then: {
                $reduce: {
                  input: '$categories',
                  initialValue: { name: 'No category', amountSpent: 0, amountBudgeted: 0 },
                  in: {
                    $cond: {
                      if: { $gt: ['$$this.amountSpent', '$$value.amountSpent'] },
                      then: {
                        name: '$$this.name',
                        amountSpent: '$$this.amountSpent',
                        amountBudgeted: '$$this.amountBudgeted',
                      },
                      else: '$$value',
                    },
                  },
                },
              },
              else: { name: 'No category', amountSpent: 0, amountBudgeted: 0 },
            },
          },
        },
      },
      {
        $facet: {
          budgets: [
            {
              $sort: {
                [sortField === 'year'
                  ? 'year'
                  : sortField === 'budgeted'
                    ? 'amountBudgeted'
                    : sortField === 'spent'
                      ? 'amountSpent'
                      : sortField === 'remaining'
                        ? 'budgetVariance'
                        : 'percentageSpent']: sortOrder === 'asc' ? 1 : -1,
                // Secondary sort by year and month for consistency
                ...(sortField !== 'year' ? { year: -1, month: -1 } : {}),
              },
            },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $project: {
                _id: 1,
                name: 1,
                year: 1,
                month: 1,
                currency: 1,
                currencySym: 1,
                amountBudgeted: 1,
                amountSpent: 1,
                budgetVariance: 1,
                percentageSpent: 1,
                mostUsedCategory: 1,
                updatedAt: 1,
              },
            },
          ],
          meta: [{ $count: 'totalCount' }],
        },
      },
    ]);

    const budgets = result[0].budgets;
    const { totalCount } = (result[0].meta[0] as { totalCount: number }) || { totalCount: 0 };

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
          filters: {
            year: yearFilter,
            month: monthFilter,
            budgetAmountFilter,
            sortField,
            sortOrder,
          },
        },
      })
    );
  }
);

// Get current month budget
userBudgetRouter.get('/current-budget', async (req, res) => {
  const userId = req.user?._id;
  const budget = await getCurrentMonthBudget(String(userId));

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

// Get budget by month and year
userBudgetRouter.get(
  '/get-by-month-and-year',
  validateRequestQuery(budgetByMonthAndYearSchema),
  async (req, res) => {
    const userId = req.user?._id;
    const { year, month } = budgetByMonthAndYearSchema.parse(req.query);

    const budget = await findBudgetByMonthAndYear(String(userId), year, month);

    res.send(
      formatSuccessResponse({
        message: 'Budget retrieved successfully.',
        data: budget.toObject(),
      })
    );
  }
);
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

// Delete Budget
userBudgetRouter.delete('/:id', validateRequestID, async (req, res) => {
  const userId = req.user?._id as string;
  const budgetId = req.params.id;
  const budget = await Budget.findByIdAndDelete(budgetId);

  if (!budget) {
    throw new NotFoundError('No budget found for this id.');
  }

  const { year, month } = budget;

  // Delete all budget related expenses
  await ExpenseModel.deleteMany({ budget: budgetId });

  // Archive the notification for the budget
  await Notification.updateMany({ user: userId, year, month }, { is_active: false });

  // Create a new notification for the budget deletion
  const notifMessage = await Notification.createBudgetDeletedNotification(userId, year, month);
  sendNotificationToUser(userId, 'notification', notifMessage);

  res.send(
    formatSuccessResponse({
      message: 'Budget deleted successfully.',
      data: budget.toObject({ virtuals: true }),
    })
  );
});

// Create a new budget
userBudgetRouter.post('/', validateRequestBody(createBudgetSchema), async (req, res) => {
  const userId = req.user?._id as string;
  const userCurrencyPref = req.user?.preferences?.currency;

  const {
    year,
    month,
    categories,
    currency = userCurrencyPref,
    ...otherNewProps
  } = createBudgetSchema.parse(req.body);

  const duplicateBudget = await findBudgetByMonthAndYear(userId, year, month);

  // Return early if budget for a month already exists
  if (duplicateBudget && duplicateBudget.year === year && duplicateBudget.month === month) {
    throw new BadRequestError('A budget for selected month and year has already been created', {
      duplicateBudget,
    });
  }

  // Add precalculated keys to categories
  const updatedCategories = categories.map((category) => ({
    ...category,
    key: constructBudgetCatKey(year, month, category.name),
  }));

  // Create new budget
  const budget = new Budget({
    ...otherNewProps,
    year,
    month,
    user: userId,
    currency,
    currencySym: getCurrencySymbol(currency as CurrencyOptions),
    categories: updatedCategories,
  });

  await budget.save();

  // Create a new notification for the budget creation
  const notifMessage = await Notification.createBudgetNotification(
    userId,
    budget._id.toString(),
    year,
    month
  );

  sendNotificationToUser(userId, 'notification', notifMessage);

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

// Get current month analytics
userBudgetRouter.get(
  '/current-month-analytics',
  validateRequestQuery(budgetByMonthAndYearSchema),
  async (req, res) => {
    const userId = req.user?._id;

    // Get current month's budget
    let currentMonth = dayjs().month();
    let currentYear = dayjs().year();

    const { year, month } = budgetByMonthAndYearSchema.parse(req.query);
    const currentBudget = await findBudgetByMonthAndYear(String(userId), year, month);

    if (!currentBudget) {
      throw new NotFoundError(
        year === currentYear && month === currentMonth
          ? 'No budget created for this month.'
          : 'No budget found for this month and year.'
      );
    }

    currentYear = currentBudget.year;
    currentMonth = currentBudget.month;
    const [currentMonthStart, currentMonthEnd] = getEndAndStartOfMonth(currentYear, currentMonth);

    // Get simplified analytics
    const analyticsResponse = await ExpenseModel.aggregate<ICurrentMonthAnalyticsResponse>([
      {
        $match: {
          user: userId,
          expenseDate: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
        },
      },
      {
        $lookup: {
          from: 'budgets',
          localField: 'budget',
          foreignField: '_id',
          as: 'budgetDetails',
        },
      },
      {
        $addFields: {
          budgetInfo: { $arrayElemAt: ['$budgetDetails', 0] },
          // More precisely calculate week number based on day of month
          // Week 1: days 1-7, Week 2: days 8-14, Week 3: days 15-21, Week 4: days 22-28, Week 5: days 29-31
          week: {
            $switch: {
              branches: [
                { case: { $lte: [{ $dayOfMonth: '$expenseDate' }, 7] }, then: 1 },
                { case: { $lte: [{ $dayOfMonth: '$expenseDate' }, 14] }, then: 2 },
                { case: { $lte: [{ $dayOfMonth: '$expenseDate' }, 21] }, then: 3 },
                { case: { $lte: [{ $dayOfMonth: '$expenseDate' }, 28] }, then: 4 },
              ],
              default: 5,
            },
          },
          dateString: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } },
        },
      },
      {
        $facet: {
          // Weekly spending stats
          weeklySpending: [
            {
              $group: {
                _id: '$week',
                totalSpent: { $sum: '$amount' },
                count: { $sum: 1 },
                expenseDates: { $push: '$expenseDate' },
                firstDate: { $min: '$expenseDate' },
                lastDate: { $max: '$expenseDate' },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                week: '$_id',
                _id: 0,
                totalSpent: 1,
                count: 1,
                dateRange: {
                  start: { $dateToString: { format: '%Y-%m-%d', date: '$firstDate' } },
                  end: { $dateToString: { format: '%Y-%m-%d', date: '$lastDate' } },
                },
              },
            },
          ],

          // Top spending category
          topCategory: [
            {
              $addFields: {
                // Find matching category in the budget's categories array
                categoryInfo: {
                  $let: {
                    vars: {
                      matchedCategories: {
                        $filter: {
                          input: '$budgetInfo.categories',
                          as: 'cat',
                          cond: { $eq: ['$$cat._id', '$category'] },
                        },
                      },
                    },
                    in: { $arrayElemAt: ['$$matchedCategories', 0] },
                  },
                },
              },
            },
            {
              $addFields: {
                categoryName: '$categoryInfo.name',
              },
            },
            {
              $group: {
                _id: '$category',
                categoryName: { $first: '$categoryName' },
                totalSpent: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 1 },
          ],

          // Daily transaction stats
          dailyStats: [
            {
              $group: {
                _id: '$dateString',
                totalSpent: { $sum: '$amount' },
                count: { $sum: 1 },
                date: { $first: '$expenseDate' },
                description: { $first: '$description' },
              },
            },
            { $sort: { date: 1 } },
          ],

          // Overall stats
          overallStats: [
            {
              $group: {
                _id: null,
                totalExpensesCount: { $sum: 1 },
                totalExpensesSum: { $sum: '$amount' },
                avgExpenseAmount: { $avg: '$amount' },
                largestTransaction: { $max: '$amount' },
                uniqueDays: { $addToSet: '$dateString' },
              },
            },
            {
              $project: {
                _id: 0,
                totalExpensesCount: 1,
                totalExpensesSum: 1,
                avgExpenseAmount: 1,
                largestTransaction: 1,
                totalDayCount: { $size: '$uniqueDays' },
              },
            },
          ],
        },
      },
    ]);

    const analytics = analyticsResponse[0];

    // Extract data from analytics results
    const weeklySpending = analytics.weeklySpending || [];
    const weekCount = weeklySpending.length;

    // Create an array of all weeks in the month using dayjs
    const currentDate = dayjs().month(currentMonth).year(currentYear);
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = startOfMonth.endOf('month');
    const daysInMonth = endOfMonth.date();

    // Create week boundaries using dayjs
    const weekBoundaries = [];
    let currentDay = 1;
    let weekNumber = 1;

    while (currentDay <= daysInMonth) {
      // Start of week is the current day
      const startDate = currentDate.date(currentDay);

      // End of week is either 7 days later or the last day of month, whichever comes first
      const weekEndDay = Math.min(currentDay + 6, daysInMonth);
      const endDate = currentDate.date(weekEndDay);

      weekBoundaries.push({
        week: weekNumber,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        startDay: currentDay,
        endDay: weekEndDay,
      });

      // Move to next week
      currentDay = weekEndDay + 1;
      weekNumber++;
    }

    const formatDate = (date: Date) => {
      return dayjs(date).format('YYYY-MM-DD');
    };

    // Map expense data to the week boundaries
    const allWeeks = weekBoundaries.map((boundary) => {
      const existingWeekData = weeklySpending.find((w) => {
        return w.week === boundary.week;
      });

      if (existingWeekData) {
        // Use expense data but with consistent date ranges
        return {
          ...existingWeekData,
          dateRange: {
            start: formatDate(boundary.startDate),
            end: formatDate(boundary.endDate),
          },
        };
      }

      // Create default data for weeks with no expenses
      return {
        week: boundary.week,
        totalSpent: 0,
        count: 0,
        dateRange: {
          start: formatDate(boundary.startDate),
          end: formatDate(boundary.endDate),
        },
      };
    });

    // Calculate weekly averages
    const totalWeeklySpending = weeklySpending.reduce((total, week) => total + week.totalSpent, 0);
    const averageWeeklySpending = weekCount > 0 ? totalWeeklySpending / weekCount : 0;

    // Find peak spending week
    const peakSpendingWeek =
      weeklySpending.length > 0
        ? weeklySpending.reduce(
            (max, week) => (week.totalSpent > max.totalSpent ? week : max),
            weeklySpending[0]
          )
        : null;

    // Get overall stats
    const overallStats = analytics.overallStats[0] || {
      totalExpensesCount: 0,
      totalExpensesSum: 0,
      avgExpenseAmount: 0,
      largestTransaction: 0,
      totalDayCount: 0,
      uniqueDays: [],
    };

    const totalExpensesSum = overallStats.totalExpensesSum;

    // Top category
    const topCategory = analytics.topCategory[0] || null;

    // Calculate monthly trend if previous budget exists
    let monthlyTrend = 0;

    // Get previous month's expenses and budget in one aggregation
    const previousBudget = await Budget.aggregate([
      {
        $match: {
          user: userId,
          $or: [
            { year: currentBudget.year, month: { $lt: currentMonth } },
            { year: { $lt: currentBudget.year } },
          ],
        },
      },
      { $sort: { year: -1, month: -1 } },
      { $limit: 1 },
    ]);

    const [previousMonthStart, previousMonthEnd] = getEndAndStartOfMonth(
      previousBudget[0].year,
      previousBudget[0].month
    );

    // Get previous month's expenses if budget exists
    const previousMonthExpenses = previousBudget.length
      ? await ExpenseModel.aggregate([
          {
            $match: {
              user: userId,
              expenseDate: {
                $gte: previousMonthStart,
                $lte: previousMonthEnd,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ])
      : [];

    const previousMonthTotal = previousMonthExpenses[0]?.totalAmount || 0;

    // Calculate percentage change in total expenses
    if (previousMonthTotal > 0) {
      monthlyTrend = ((totalExpensesSum - previousMonthTotal) / totalExpensesSum) * 100;
    }

    // Extract unique days sorted by date
    const uniqueExpenseDates =
      analytics.dailyStats
        ?.map((day) => ({
          date: day._id,
          amount: day.totalSpent,
          count: day.count,
          description: day.description,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)) || [];

    // Calculate daily average transaction
    const dailyAverageTransaction =
      overallStats.totalDayCount > 0 ? totalExpensesSum / overallStats.totalDayCount : 0;

    res.send(
      formatSuccessResponse({
        message: 'Budget analytics retrieved successfully',
        data: {
          year: currentYear,
          monthName: dayjs().year(currentYear).month(currentMonth).format('MMMM'),
          // Weekly spending data
          weeklyStats: {
            averageWeeklySpending,
            peakSpendingWeek,
            weeks: allWeeks,
          },

          // Monthly trend
          monthlyTrend,

          // Top category
          topCategory,

          // Daily stats
          dailyStats: {
            dailyAverageTransaction,
            totalDayCount: overallStats.totalDayCount,
            uniqueExpenseDates,
          },

          // Overall stats
          previousMonthTotal,
          totalExpensesSum,
          totalExpensesCount: overallStats.totalExpensesCount,
          avgExpenseAmount: overallStats.avgExpenseAmount,
          largestTransaction: overallStats.largestTransaction,
        } as ICurrentMonthAnalyticsData,
      })
    );
  }
);

export default userBudgetRouter;
