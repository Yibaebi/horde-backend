import { Document, Types } from 'mongoose';

/**
 * ===========================
 * USER TYPES
 * ===========================
 */

/**
 * Enum representing the theme preferences.
 * - 'light' for light mode.
 * - 'dark' for dark mode.
 */
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

/**
 * Enum representing the date format preferences.
 * - 'MM/DD/YYYY' for the month-first format.
 * - 'DD/MM/YYYY' for the day-first format.
 * - 'YYYY-MM-DD' for the ISO standard format.
 */
export enum DateFormat {
  MM_DD_YYYY = 'MM/DD/YYYY',
  DD_MM_YYYY = 'DD/MM/YYYY',
  YYYY_MM_DD = 'YYYY-MM-DD',
}

/**
 * Enum representing the time format preferences.
 * - '12h' for the 12-hour format (AM/PM).
 * - '24h' for the 24-hour format.
 */
export enum TimeFormat {
  _12Hour = '12h',
  _24Hour = '24h',
}

/**
 * Enum representing the supported currency options.
 */
export enum CurrencyOptions {
  NGN = 'NGN',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

/**
 * Interface for the user preferences settings.
 * Defines the available preferences for currency, theme, date/time formats, etc.
 */
export interface IUserPreferences {
  currency?: CurrencyOptions;
  currencySym?: CurrencyOptions[keyof CurrencyOptions];
  theme?: Theme;
  profileImage?: string;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  notifications?: boolean;
}

/**
 * Interface for the user profile.
 * Contains basic user information such as name, username, email, password, and preferences.
 */
export interface IUserProps {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  preferences: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  categories: BudgetCategoryProps[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBudgetMethods {
  findCategoryByKey: (key: string) => BudgetCategoryProps | undefined;
}

export type IBudgetDocument = Document<unknown, object, IBudgetProps> & IBudgetMethods;
export type IBudgetCategoryDocument = Document<unknown, object, BudgetCategoryProps>;

/**
 * ===========================
 * EXPENSE TYPES
 * ===========================
 */

export interface IExpenseProps {
  _id: Types.ObjectId;
  budget: Types.ObjectId;
  description: string;
  categoryKey: string;
  expenseDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IExpenseDocument = Document<unknown, object, IExpenseProps>;
