import { Document, Types } from 'mongoose';
import { PaginationMetaInfo } from 'types/app';

/**
 * ===========================
 * EXPENSE TYPES
 * ===========================
 */

export interface IExpenseProps {
  _id: Types.ObjectId;
  budget: Types.ObjectId;
  user: Types.ObjectId;
  category: Types.ObjectId;
  amount: number;
  description: string;
  year: number;
  month: number;
  expenseDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IExpenseDocument = Document<unknown, object, IExpenseProps> & IExpenseProps;
export type IExpenseQueryResponse = { expenses: IExpenseProps[]; pagination: PaginationMetaInfo };
