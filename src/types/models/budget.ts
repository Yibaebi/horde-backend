import { Document, Types } from 'mongoose';
import { CurrencyOptions } from '../app';

/**
 * ===========================
 * BUDGET TYPES
 * ===========================
 */

/**
 * Represents a single category within a budget.
 *
 * @interface IBudgetCategoryProps
 *
 * @property {string} key - Unique key identifier for the category.
 * @property {string} name - Descriptive name of the category.
 * @property {number} amountBudgeted - Amount allocated to this category.
 * @property {number} amountSpent - Amount already spent in this category.
 * @property {number} budgetVariance - Difference between budgeted and spent amounts.
 * @property {{ inPercent: string; inNumber: number }} overallCatContribution - Contribution of this category to the total budget, both as a percentage and a numeric value.
 */
export interface IBudgetCategoryProps {
  key: string;
  name: string;
  amountBudgeted: number;
  amountSpent: number;
  budgetVariance: number;
  overallCatContribution: {
    inPercent: string;
    inNumber: number;
  };
}

/**
 * Represents the properties of a budget document.
 *
 * @interface IBudgetProps
 *
 * @property {Types.ObjectId} _id - Unique identifier for the budget document.
 * @property {number} amountBudgeted - The total amount that has been budgeted.
 * @property {number} amountSpent - The total amount that has been spent.
 * @property {number} budgetVariance - The overall variance between budgeted and spent.
 * @property {number} year - The year of the budget.
 * @property {number} month - The month of the budget (1 for January, 12 for December).
 * @property {CurrencyOptions} currency - The currency code for the budget (e.g., 'USD', 'EUR').
 * @property {string} currencySym - The symbol for the currency (e.g., '$', '€').
 * @property {BudgetCategoryProps[]} categories - An array of category-specific budget data.
 * @property {Date} [createdAt] - The date when the budget document was created.
 * @property {Date} [updatedAt] - The date when the budget document was last updated.
 */

export interface IBudgetProps {
  _id: Types.ObjectId;
  amountBudgeted: number;
  amountSpent: number;
  budgetVariance: number;
  year: number;
  month: number;
  currency: CurrencyOptions;
  currencySym: string;
  categories: IBudgetCategoryProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBudgetMethods {
  findCategoryByKey: (key: string) => IBudgetCategoryProps | undefined;
}

export type IBudgetDocument = Document<unknown, object, IBudgetProps> & IBudgetMethods;
export type IBudgetCategoryDocument = Document<unknown, object, IBudgetCategoryProps>;
