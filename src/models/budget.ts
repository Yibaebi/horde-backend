import dayjs from 'dayjs';
import { model, Schema } from 'mongoose';

import { getCurrencySymbol } from '@/utils/helpers';
import { CurrencyOptions, type IBudgetDocument, type IBudgetProps } from '@/types';
import { categorySchema } from './category';

// Budget Schema
const budgetSchema = new Schema<IBudgetProps>(
  {
    amountBudgeted: { type: Number, required: true },
    budgetVariance: { type: Number, default: 0 },
    currency: { type: String, default: CurrencyOptions.NGN },
    year: {
      type: Number,
      required: true,
      default: () => dayjs().year(),
    },
    month: {
      type: Number,
      required: true,
      default: () => dayjs().month(),
    },
    currencySym: {
      type: String,
      default: getCurrencySymbol(CurrencyOptions.NGN),
    },
    categories: [categorySchema],
  },
  { timestamps: true }
);

budgetSchema.virtual('amountSpent').get(function (this: IBudgetProps) {
  return this.categories.reduce((total, cat) => total + cat.amountBudgeted, 0);
});

budgetSchema.method('findCategoryByKey', function (key: string) {
  return this.categories.find((cat) => cat.key === key);
});

// Budget model
const Budget = model<IBudgetDocument>('Budget', budgetSchema);

export default Budget;
