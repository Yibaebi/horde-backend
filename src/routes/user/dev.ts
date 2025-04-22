import { Router } from 'express';
import _ from 'lodash';

import { formatSuccessResponse } from '@/utils/response';
import { validateBudgetById } from '@/services/user';
import { createBudgetSchema } from '@/schemas/user';
import { constructBudgetCatKey, getCurrencySymbol } from '@/utils/helpers';
import { validateRequestID } from '@/middlewares/validate-request';
import dbSeedDataGenInterface from '@/scripts/seeds';
import Budget from '@/models/budget';
import ExpenseModel from '@/models/expense';

const userDevRouter = Router();
const { generateBudgetData, generateExpenses, transformCategories } = dbSeedDataGenInterface;

// Seed DB with a new budget with expenses
userDevRouter.post('/budget-with-exp', async (req, res) => {
  const userId = req.user?._id;
  const { year, month } = req.body;
  const budget = generateBudgetData({ year, month });

  const {
    currency,
    categories,
    year: budgetYear,
    month: budgetMonth,
    ...otherNewBudgetProps
  } = createBudgetSchema.parse(budget);

  // Add precalculated keys to categories
  const updatedCategories = categories.map((category) => ({
    ...category,
    key: constructBudgetCatKey(budgetYear, budgetMonth, category.name),
  }));

  // Create new budget
  const newBudget = new Budget({
    ...otherNewBudgetProps,
    year: budgetYear,
    month: budgetMonth,
    user: userId,
    currency,
    currencySym: getCurrencySymbol(currency),
    categories: updatedCategories,
  });

  // Create budget
  const createdBudget = await newBudget.save();

  // Generate random expenses for each category
  const expenses = generateExpenses(
    String(userId),
    createdBudget._id.toString(),
    budgetYear,
    budgetMonth,
    transformCategories(createdBudget.categories)
  );

  // Insert all docs at once
  await ExpenseModel.insertMany(expenses);

  res.send(
    formatSuccessResponse({
      message: 'Budget and expenses created successfully.',
      data: { expensesCount: expenses.length, newBudget: newBudget.toObject() },
    })
  );
});

userDevRouter.post('/expenses/create/:id', validateRequestID, async (req, res) => {
  const userId = req.user?._id;
  const budgetId = req.params.id;

  // Generate random expenses for each budget category
  const budget = await validateBudgetById(budgetId);

  const expenses = generateExpenses(
    String(userId),
    budget._id.toString(),
    budget.year,
    budget.month,
    transformCategories(budget.categories)
  );

  // Insert all docs at once
  await ExpenseModel.insertMany(expenses);

  // Update budget info
  await budget.save();

  res.send(
    formatSuccessResponse({
      message: 'Expenses created for specified budget successfully.',
      data: { expensesCount: expenses.length, budget: budget.toObject() },
    })
  );
});

userDevRouter.delete('/all-expenses', async (req, res) => {
  await ExpenseModel.deleteMany({ user: req.user?._id });

  res.send(
    formatSuccessResponse({
      message: 'User Expenses Deleted Successfully.',
    })
  );
});

export default userDevRouter;
