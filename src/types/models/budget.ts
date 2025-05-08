import { Document, Model, Types } from 'mongoose';
import { CurrencyOptions } from '../app';

/**
 * ===============
 * BUDGET TYPES
 * ===============
 */

/**
 * Represents a single income source within a budget.
 *
 * @interface IIncomeSourceProps
 *
 * @property {string} name - Descriptive name of the income source (e.g., "Salary", "Freelance").
 * @property {number} amount - Monetary value of this income source.
 * @property {string} [description] - Optional additional details about the income source.
 * @property {boolean} recurring - Whether this income repeats regularly (defaults to true).
 * @property {"monthly" | "biweekly" | "weekly" | "yearly" | "one-time"} frequency - How often this income is received.
 * @property {{ inPercent: string; inNumber: number }} contributionPercentage - Contribution of this income source to the total income, both as a percentage and a numeric value.
 */
export interface IBudgetIncomeSourceProps {
  _id: Types.ObjectId;
  name: string;
  amount: number;
  description?: string;
  recurring?: boolean;
  frequency: 'monthly' | 'one-time';
}

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
  _id: Types.ObjectId;
  id: string;
  key: string;
  name: string;
  amountBudgeted: number;
  amountSpent: number;
  budgetVariance: number;
  budgetExpenseContribution: {
    inPercent: string;
    inNumber: number;
  };
  expensesStats: {
    totalAmount: number;
    count: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  };
}

export interface IBudgetCategoryMethods {
  recomputeExpensesStats: () => Promise<IBudgetCategoryDocument>;
  resetStats: () => Promise<IBudgetCategoryDocument>;
}

export type IBudgetCategoryDocument = Document<unknown, object, IBudgetCategoryProps> &
  IBudgetCategoryProps &
  Required<
    {
      _id: Types.ObjectId;
    } & IBudgetCategoryMethods
  >;

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
  id: string;
  user: Types.ObjectId;
  amountBudgeted: number;
  amountSpent: number;
  budgetVariance: number;
  year: number;
  month: number;
  currency: CurrencyOptions;
  currencySym: string;
  categories: IBudgetCategoryDocument[];
  budgetSources: IBudgetIncomeSourceDocument[];
  createdAt?: Date;
  updatedAt?: Date;
  lastExpenseDate?: Date;
}

export interface IBudgetMethods {
  findCategory: (key: string) => IBudgetCategoryDocument | undefined;
  deleteCategory: (id: string) => void;
  validateCategory: (id: string) => IBudgetCategoryDocument;
  findIncomeSource: (id: string) => IBudgetIncomeSourceDocument | undefined;
  deleteIncomeSource: (id: string) => void;
  validateSource: (id: string) => IBudgetIncomeSourceDocument;
  refreshCategoryStats: () => Promise<IBudgetDocument>;

  // Check a list for name duplicates and update
  doExistingNameCheckInListAndUpdate: (data: {
    listKey: 'categories' | 'budgetSources';
    docId: string;
    oldDoc: IBudgetCategoryDocument | IBudgetIncomeSourceDocument;
    propsToUpdate: { name?: string; key?: string };
  }) => [number, IBudgetCategoryDocument | IBudgetIncomeSourceDocument];
}

export type IBudgetDocument = Document<unknown, object, IBudgetProps> &
  IBudgetProps &
  Required<
    {
      _id: Types.ObjectId;
    } & IBudgetMethods
  > &
  IBudgetMethods;

// Define a model type that includes both the document type and static methods
export type IBudgetModel = Model<IBudgetProps, object, object, object, IBudgetDocument> &
  IBudgetMethods;

export type IBudgetIncomeSourceDocument = Document<unknown, object, IBudgetIncomeSourceProps> &
  IBudgetIncomeSourceProps &
  Required<{
    _id: Types.ObjectId;
  }>;

/**
 * ===============
 * BUDGET CATEGORY OCCURENCE TYPES
 * ===============
 */

export interface INewBudgetCategoryOccurence {
  budgetId: string;
  year: number;
  month: number;
  categoryKey: string;
  amountBudgeted: number;
  amountSpent: number;
}

export interface INewBudgetCategoryOccurenceSummary {
  mostRecentOccurrence: INewBudgetCategoryOccurence[];
  categoryName: string;
  totalOccurrences: number;
}

export interface INewBudgetDefaultsResponse {
  recurringCategories: INewBudgetCategoryOccurenceSummary[];
  latestIncomeSources: { budgetSources: IBudgetProps['budgetSources'] }[];
}

/**
 * ===============
 * CURRENT MONTH RESPONSEANALYTICS TYPES
 * ===============
 */

export interface ICurrentMonthAnalyticsData {
  year: number;
  monthName: string;
  weeklyStats: ICurrentMonthWeeklyStats;
  monthlyTrend: number;
  topCategory: ICurrentMonthTopCategory;
  dailyStats: ICurrentMonthDailyStats;
  totalExpensesCount: number;
  totalExpensesSum: number;
  avgExpenseAmount: number;
  largestTransaction: number;
}

export interface ICurrentMonthDailyStats {
  dailyAverageTransaction: number;
  totalDayCount: number;
  uniqueExpenseDates: ICurrentMonthUniqueExpenseDate[];
}

export interface ICurrentMonthUniqueExpenseDate {
  date: string;
  amount: number;
  count: number;
  description: string;
}

export interface ICurrentMonthRecentTransaction {
  _id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  categoryName: string;
  formattedDate: string;
}

export interface ICurrentMonthTopCategory {
  _id: string;
  categoryName: string;
  totalSpent: number;
  count: number;
}

export interface ICurrentMonthWeeklyStats {
  averageWeeklySpending: number;
  peakSpendingWeek: ICurrentMonthWeek;
  weeks: ICurrentMonthWeek[];
}

export interface ICurrentMonthWeek {
  totalSpent: number;
  count: number;
  week: number;
  dateRange: ICurrentMonthDateRange;
}

export interface ICurrentMonthDateRange {
  start: string;
  end: string;
}

export interface ICurrentMonthOverallStat {
  totalExpensesCount: number;
  totalExpensesSum: number;
  avgExpenseAmount: number;
  largestTransaction: number;
  totalDayCount: number;
  uniqueDays: ICurrentMonthUniqueExpenseDate[];
}

/**
 * ===============
 * CURRENT MONTH AGGREGATE RESPONSE TYPES
 * ===============
 */

interface ICurrentMonthAggDailyStats {
  _id: string;
  totalSpent: number;
  count: number;
  date: Date;
  description: string;
  categoryName: string;
}

interface ICurrentMonthAggWeeklyStats {
  totalSpent: number;
  count: number;
  week: number;
  dateRange: ICurrentMonthDateRange;
}

export interface ICurrentMonthAnalyticsResponse {
  weeklySpending: ICurrentMonthAggWeeklyStats[];
  topCategory: ICurrentMonthTopCategory[];
  dailyStats: ICurrentMonthAggDailyStats[];
  overallStats: ICurrentMonthOverallStat[];
  recentTransactions: ICurrentMonthRecentTransaction[];
}
