import { Document, Types } from 'mongoose';

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
