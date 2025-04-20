import { Schema, model } from 'mongoose';
import { type IExpenseProps } from '@/types';
import dayjs from 'dayjs';

// Expense Schema
const expenseSchema = new Schema<IExpenseProps>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true },
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
  },
  { timestamps: true }
);

// Expense Model
const ExpenseModel = model<IExpenseProps>('Expense', expenseSchema);

export default ExpenseModel;
