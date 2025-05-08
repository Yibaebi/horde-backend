import { model, Schema } from 'mongoose';
import { IBudgetCategoryDocument, IBudgetCategoryProps, IBudgetProps } from '@/types';
import ExpenseModel from './expense';
import dayjs from 'dayjs';

// Context for Category Virtuals
type IBudgetCategoryContext = IBudgetCategoryDocument & { parent(): IBudgetProps };

// Category Schema
const categorySchema = new Schema<IBudgetCategoryProps>(
  {
    key: { type: String, required: true, index: true },
    amountBudgeted: { type: Number, required: true },
    name: { type: String },
    amountSpent: { type: Number, default: 0 },
    id: { type: String, select: false },
    expensesStats: {
      totalAmount: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      averageAmount: { type: Number, default: 0 },
      minAmount: { type: Number, default: 0 },
      maxAmount: { type: Number, default: 0 },
      lastExpenseId: { type: Schema.Types.ObjectId },
      lastExpenseDate: { type: Date },
    },
  },
  { timestamps: true }
);

categorySchema.virtual('budgetExpenseContribution').get(function (this: IBudgetCategoryContext) {
  const budget = this.parent()?.amountSpent ?? 0;
  const inNumber = this.amountSpent;
  const percentContribution = (inNumber / budget) * 100;
  const inPercent = !isNaN(percentContribution) ? percentContribution : 0 + '%';

  return { inPercent, inNumber };
});

categorySchema.virtual('catBudgetVariance').get(function (this: IBudgetCategoryContext) {
  return this.amountBudgeted - this.amountSpent;
});

categorySchema.method('resetStats', async function () {
  this.amountSpent = 0;

  this.expensesStats = {
    totalAmount: 0,
    count: 0,
    averageAmount: 0,
    minAmount: 0,
    maxAmount: 0,
  };

  return this;
});

categorySchema.method('recomputeExpensesStats', async function (this: IBudgetCategoryContext) {
  const results = await ExpenseModel.aggregate([
    {
      $match: {
        $and: [
          {
            expenseDate: {
              $gte: dayjs()
                .month(this.parent()?.month)
                .year(this.parent()?.year)
                .startOf('month')
                .toDate(),

              $lte: dayjs()
                .month(this.parent()?.month)
                .year(this.parent()?.year)
                .endOf('month')
                .toDate(),
            },
          },
        ],
      },
    },
    { $sort: { expenseDate: -1 } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' },
        lastExpenseDate: { $first: '$expenseDate' },
        lastExpenseId: { $first: '$_id' },
      },
    },
  ]);

  const stats = results[0] as IBudgetCategoryProps['expensesStats'] | undefined;

  if (stats) {
    this.amountSpent = stats.totalAmount;
    this.expensesStats = stats;
  } else {
    this.resetStats();
  }

  return this;
});

// Category model
const Category = model<IBudgetCategoryProps>('Category', categorySchema);

export { categorySchema };
export default Category;
