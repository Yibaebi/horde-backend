import { Schema } from 'mongoose';
import { IBudgetCategoryProps, IBudgetProps } from '@/types/models';

// Context for Category Virtuals
type BudgetCategoryContext = IBudgetCategoryProps & { parent(): IBudgetProps };

// Category Schema
const categorySchema = new Schema<IBudgetCategoryProps>(
  {
    key: { type: String, required: true },
    amountBudgeted: { type: Number, required: true },
    name: { type: String },
    amountSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.virtual('overallCatContribution').get(function (this: BudgetCategoryContext) {
  const budget = this.parent()?.amountBudgeted ?? 0;
  const inNumber = this.amountBudgeted;
  const inPercent = ((inNumber / budget) * 100).toFixed(2) + '%';

  return { inPercent, inNumber };
});

categorySchema.virtual('budgetVariance').get(function (this: BudgetCategoryContext) {
  return this.amountBudgeted - this.amountSpent;
});

export { categorySchema };
