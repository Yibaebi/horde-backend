import { Router } from 'express';
import _ from 'lodash';

import { validateRequestBody, validateRequestID } from '@/middlewares/validate-request';
import { validateBudgetById, validateExpenseById } from '@/services/user';
import { formatSuccessResponse } from '@/utils/response';
import { createExpenseSchema, editExpenseSchema, expenseQuerySchema } from '@/schemas/user/expense';
import { NotFoundError } from '@/config/error';
import standardRateLimiters from '@/middlewares/rate-limiter';
import generateExpenses from '@/scripts/seeds/expenses';
import ExpenseModel from '@/models/expense';
import { IExpenseQueryResponse } from 'types/models';

const userExpensesRouter = Router();

// Fetch expenses
userExpensesRouter.get(
  '/',
  standardRateLimiters.strict,
  validateRequestBody(expenseQuerySchema),
  async (req, res) => {
    const {
      description,
      exactAmount,
      minAmount,
      maxAmount,
      budget,
      category,
      startDate,
      endDate,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
      page,
      limit,
      year,
      month,
    } = expenseQuerySchema.parse(req.body);

    const skip = (page - 1) * limit;

    const results = await ExpenseModel.aggregate([
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
          ...(exactAmount
            ? { amount: exactAmount }
            : minAmount && maxAmount
              ? { amount: { $gte: minAmount, $lte: maxAmount } }
              : minAmount
                ? { amount: { $gte: minAmount } }
                : maxAmount
                  ? { amount: { $lte: maxAmount } }
                  : {}),

          // Budget filter
          ...(budget && { budget }),

          // Category filter
          ...(category && { category }),

          // Date range filter
          ...((startDate || endDate) && {
            expenseDate: {
              ...(startDate && { $gte: startDate }),
              ...(endDate && { $lte: endDate }),
            },
          }),
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
userExpensesRouter.post('/generate-expenses', async (req, res) => {
  const userId = req.user?._id;
  const expenses = generateExpenses();

  for (const expenseProps of expenses) {
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
    category = await category.recomputeExpensesStats();
    await budget.save();
  }

  res.send(
    formatSuccessResponse({
      message: 'Expenses created successfully.',
    })
  );
});

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
  category = await category.recomputeExpensesStats();
  await budget.save();

  const updatedCategory = category.toObject({ virtuals: true });

  const catResponse = _.pick(updatedCategory, [
    '_id',
    'name',
    'amountBudgeted',
    'amountSpent',
    'catBudgetVariance',
    'expensesStats',
  ]);

  res.send(
    formatSuccessResponse({
      message: 'Expense created successfully.',
      data: {
        expense: newExpense,
        relatedCategory: catResponse,
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
