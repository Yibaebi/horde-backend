import { Document, Model, Types } from 'mongoose';

/**
 * Notification types enum for different contexts
 */
export enum NotificationType {
  WELCOME = 'welcome',
  BUDGET_CREATED = 'budget_created',
  BUDGET_THRESHOLD = 'budget_threshold',
  BUDGET_DELETED = 'budget_deleted',
  EXPENSE_CREATED = 'expense_created',
  SYSTEM = 'system',
}

/**
 * Interface for Notification props
 */
export interface INotificationProps {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  is_active: boolean;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for Notification Document
 */
export type INotificationDocument = Document<unknown, object, INotificationProps> &
  INotificationProps &
  Required<{ _id: Types.ObjectId }>;

export type INotificationStaticMethods = {
  createWelcomeNotification: (userId: string) => Promise<INotificationDocument>;

  createBudgetNotification: (
    userId: string,
    budgetId: string,
    year: number,
    month: number
  ) => Promise<INotificationDocument>;

  createBudgetThresholdNotification: (
    userId: string,
    budgetId: string,
    percentage: number,
    year: number,
    month: number
  ) => Promise<INotificationDocument>;

  createBudgetDeletedNotification: (
    userId: string,
    year: number,
    month: number
  ) => Promise<INotificationDocument>;
};

// Define a model type that includes both the document type and static methods
export type INotificationModel = Model<
  INotificationProps,
  object,
  object,
  object,
  INotificationDocument
> &
  INotificationStaticMethods;
