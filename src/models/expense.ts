import { Schema, model } from 'mongoose';
import { IExpenseDocument, type IExpenseProps } from '@/types';

// Expense Schema
const expenseSchema = new Schema<IExpenseProps>(
  {
    budget: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
    description: { type: String, required: true },
    categoryKey: { type: String, required: true },
    expenseDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Expense Model
const ExpenseModel = model<IExpenseDocument>('Expense', expenseSchema);

export { ExpenseModel };
