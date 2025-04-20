import { model, Schema } from 'mongoose';
import { IBudgetIncomeSourceProps, IBudgetProps } from '@/types';

// Context for Category Virtuals
type BudgetCategoryContext = IBudgetIncomeSourceProps & { parent(): IBudgetProps };

// Income Source Schema
const incomeSourceSchema = new Schema<IBudgetIncomeSourceProps>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    recurring: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['monthly', 'one-time'],
      default: 'monthly',
    },
  },
  { timestamps: true }
);

// Calculate contribution percentage to total income
incomeSourceSchema.virtual('contributionPercentage').get(function (this: BudgetCategoryContext) {
  const totalIncome = this.parent()?.amountBudgeted ?? 0;
  if (totalIncome === 0) return { inPercent: '0.00%', inNumber: 0 };

  const inNumber = this.amount;
  const inPercent = ((inNumber / totalIncome) * 100).toFixed(2) + '%';

  return { inPercent, inNumber };
});

// Income Source model
const IncomeSource = model<IBudgetIncomeSourceProps>('IncomeSource', incomeSourceSchema);

export { incomeSourceSchema };
export default IncomeSource;
