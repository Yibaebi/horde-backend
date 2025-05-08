import { Router } from 'express';
import _ from 'lodash';

import {
  createExpenseSchema,
  deleteMultipleExpenseSchema,
  editExpenseSchema,
  expenseQuerySchema,
} from '@/schemas/user/expense';

import { validateRequestBody, validateRequestID } from '@/middlewares/validate-request';
import { validateBudgetById, validateExpenseById } from '@/services/user';
import { formatSuccessResponse } from '@/utils/response';
import { convertIdToObjectId } from '@/utils/helpers';
import { NotFoundError } from '@/config/error';
import standardRateLimiters from '@/middlewares/rate-limiter';
import ExpenseModel from '@/models/expense';
import type { IExpenseQueryResponse } from '@/types';
import dayjs from 'dayjs';

const userExpensesRouter = Router();

// Fetch expenses
userExpensesRouter.get(
  '/',
  standardRateLimiters.strict,
  validateRequestBody(expenseQuerySchema),
  async (req, res) => {
    const {
      description,
      budget,
      category,
      sortBy = 'expenseDate',
      sortOrder,
      page,
      limit,
      year,
      month,
      ...OtherFilterProps
    } = expenseQuerySchema.parse(req.body);

    // Expense Amount Filters
    const computeAmountFilters = () => {
      const { exactAmount, minAmount, maxAmount } = OtherFilterProps;

      if (exactAmount) return { amount: exactAmount };
      if (minAmount && maxAmount) return { amount: { $gte: minAmount, lte: maxAmount } };
      if (minAmount) return { amount: { $gte: minAmount } };
      if (maxAmount) return { amount: { lte: maxAmount } };

      return {};
    };

    // Expense Date Filters
    const computeDateFilters = () => {
      const { endDate, startDate } = OtherFilterProps;

      return startDate || endDate
        ? {
            expenseDate: {
              ...(startDate && { $gte: startDate }),
              ...(endDate && { $lte: endDate }),
            },
          }
        : {};
    };

    // Page to skip
    const skip = (page - 1) * limit;

    const results = await ExpenseModel.aggregate<{
      expenses: IExpenseQueryResponse['expenses'];
      totalCount: [{ count: number }];
    }>([
      {
        $match: {
          // Scope to user expenses.
          user: req.user?._id,

          // Description match (case-insensitive)
          ...(description && { description: { $regex: description, $options: 'i' } }),

          // Year and month filters
          ...(year && { year }),
          ...(month && { month }),

          // Amount filters
          ...computeAmountFilters(),

          // Budget filter
          ...(budget && { budget: convertIdToObjectId(budget) }),

          // Category filter
          ...(category && { category: convertIdToObjectId(category) }),

          // Date range filter
          ...computeDateFilters(),
        },
      },
      {
        $facet: {
          expenses: [
            { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const expenses = results[0].expenses || [];
    const totalItemsCount = results[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItemsCount / limit);

    res.send(
      formatSuccessResponse({
        message: 'Expenses fetched successfully.',
        data: {
          expenses,
          pagination: {
            totalItemsCount,
            totalPages,
            currentPageCount: expenses.length,
            page,
            limit,
          },
        } as IExpenseQueryResponse,
      })
    );
  }
);

// Add Expense
userExpensesRouter.post('/', validateRequestBody(createExpenseSchema), async (req, res) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  // try {
  const userId = req.user?._id;
  const expenseProps = createExpenseSchema.parse(req.body);

  // Confirm valid budget and category
  const budget = await validateBudgetById(expenseProps.budget);
  let category = budget.validateCategory(expenseProps.category);

  // Create expense
  const newExpense = new ExpenseModel({
    ...expenseProps,
    user: userId,
    year: budget.year,
    month: budget.month,
  });

  await newExpense.save();

  // Update budget info
  budget.lastExpenseDate =
    !budget.lastExpenseDate || dayjs(newExpense.createdAt).isAfter(budget.lastExpenseDate)
      ? newExpense.createdAt
      : budget.lastExpenseDate;

  // Recompute category stats
  category = await category.recomputeExpensesStats();

  // Save budget
  await budget.save();

  res.send(
    formatSuccessResponse({
      message: 'Expense created successfully.',
      data: {
        expense: newExpense,
        relatedCategory: category,
      },
    })
  );
  // } catch (error) {
  //   await session.abortTransaction();
  //   session.endSession();

  //   throw error;
  // }
});

// Update expenses
userExpensesRouter.put(
  '/:id',
  validateRequestID,
  validateRequestBody(editExpenseSchema),
  async (req, res) => {
    const expenseId = req.params.id;
    const expenseData = editExpenseSchema.parse(req.body);

    // Check valid budgets
    const budget = await validateBudgetById(expenseData.budget);
    const category = budget.validateCategory(expenseData.category);

    const expense = await validateExpenseById(expenseId);
    const updatedExpense = _.merge(expense, expenseData);

    await updatedExpense.save();
    await category.recomputeExpensesStats();

    res.send(
      formatSuccessResponse({
        message: 'Expense updated successfully.',
        data: updatedExpense,
      })
    );
  }
);

// Delete multiple expenses
userExpensesRouter.delete(
  '/',
  validateRequestBody(deleteMultipleExpenseSchema),
  async (req, res) => {
    const { budget, category } = deleteMultipleExpenseSchema.parse(req.body);
    const validatedBudget = await validateBudgetById(String(budget));

    if (category) {
      validatedBudget.validateCategory(category);
    }

    const result = await ExpenseModel.deleteMany({ budget, ...(category && { category }) });

    res.send(
      formatSuccessResponse({
        message: 'Expenses deleted successfully.',
        data: result,
      })
    );
  }
);

// Delete an expense
userExpensesRouter.delete('/:id', validateRequestID, async (req, res) => {
  const expenseId = req.params.id;
  const expense = await ExpenseModel.findByIdAndDelete(expenseId);

  if (!expense) {
    throw new NotFoundError('No expense with specified ID found.');
  }

  res.send(
    formatSuccessResponse({
      message: 'Expense deleted successfully.',
      data: expense,
    })
  );
});

export default userExpensesRouter;
