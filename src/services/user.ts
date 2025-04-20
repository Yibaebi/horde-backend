import { FlattenMaps } from 'mongoose';
import dayjs from 'dayjs';

import { NotFoundError } from '@/config/error';
import Budget from '@/models/budget';
import User from '@/models/user';
import ExpenseModel from '@/models/expense';
import type { IUserProps, IBudgetDocument, IExpenseDocument } from '@/types';

/**
 * Finds a user by ID and updates their details.
 *
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<IUserProps>} props - The user fields to update (partial).
 * @returns {Promise<FlattenMaps<IUser> | null>} The updated user document or null if not found.
 */
export const findAndUpdateUser = async (
  userId: string,
  props: Partial<IUserProps>
): Promise<FlattenMaps<IUserProps> | null> =>
  await User.findByIdAndUpdate(userId, { ...props }, { new: true }).lean();

/**
 * Finds a budget for a specific year and month.
 *
 * @param {string} budgetId - The ID of the budget.
 * @returns { Promise<IBudgetDocument | null>} The matching budget document or null if not found.
 */
export const findBudgetById = async (budgetId: string): Promise<IBudgetDocument | null> =>
  await Budget.findById(budgetId);

/**
 * Finds a expense for a specific year and month.
 *
 * @param {string} expenseId - The ID of the expense.
 * @returns { Promise<IExpenseDocument | null>} The matching budget document or null if not found.
 */
export const findExpenseById = async (expenseId: string): Promise<IExpenseDocument | null> =>
  await ExpenseModel.findById(expenseId);

/**
 * Finds a budget for a specific year and month.
 *
 * @param {number} year - The year of the budget.
 * @param {number} month - The month of the budget (0-indexed).
 * @returns { Promise<IBudgetDocument | null>} The matching budget document or null if not found.
 */
export const findBudgetByMonthAndYear = async (
  year: number,
  month: number
): Promise<IBudgetDocument | null> => await Budget.findOne({ year, month });

/**
 * Gets the budget for the current month and year.
 *
 * @returns { Promise<IBudgetDocument | null>} The current month's budget or null if not found.
 */
export const getCurrentMonthBudget = async (): Promise<IBudgetDocument | null> => {
  const currentMonth = dayjs().month();
  const currentYear = dayjs().year();

  return await findBudgetByMonthAndYear(currentYear, currentMonth);
};

/**
 * Validates the existence of a budget by its ID.
 *
 * @param {string} id - The unique identifier of the budget to validate.
 * @returns {Promise<IBudgetDocument>} - Returns the budget if found.
 * @throws {NotFoundError} - Throws an error if no budget is found for the given ID.
 */
export const validateBudgetById = async (id: string): Promise<IBudgetDocument> => {
  const budget = await findBudgetById(id);

  if (!budget) {
    throw new NotFoundError('No budget matched specified ID.');
  }

  return budget;
};

/**
 * Validates the existence of a budget by its ID.
 *
 * @param {string} id - The unique identifier of the budget to validate.
 * @returns {Promise<IExpenseDocument>} - Returns the budget if found.
 * @throws {NotFoundError} - Throws an error if no budget is found for the given ID.
 */
export const validateExpenseById = async (id: string): Promise<IExpenseDocument> => {
  const expense = await findExpenseById(id);

  if (!expense) {
    throw new NotFoundError('No expense matched specified ID.');
  }

  return expense;
};
