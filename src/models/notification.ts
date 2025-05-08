import dayjs from 'dayjs';
import { Schema, model } from 'mongoose';
import appConstants from '@/constants/app';

import {
  INotificationModel,
  INotificationProps,
  INotificationStaticMethods,
  NotificationType,
} from '@/types';

const notificationSchema = new Schema<INotificationProps>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true, index: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => {
        const date = dayjs().toDate();
        date.setDate(date.getDate() + 30);

        return date;
      },
      index: true,
    },
  },
  { timestamps: true }
);

// Create indexes for common queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, type: 1 });

// Automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Welcome notifications
notificationSchema.statics.createWelcomeNotification = async function (userId: string) {
  return this.create({
    user: userId,
    type: NotificationType.WELCOME,
    title: 'Welcome to Horde',
    message: 'Thanks for joining! Start tracking your finances by creating your first budget.',
    data: { isFirstNotification: true },
  });
};

// New Budget notifications
notificationSchema.statics.createBudgetNotification = async function (
  userId: string,
  budgetId: string,
  year: number,
  month: number
) {
  return this.create({
    user: userId,
    type: NotificationType.BUDGET_CREATED,
    title: 'Budget Created',
    message: `Your budget for ${appConstants.MONTH_NAMES[month]} ${year} has been created successfully.`,
    data: {
      budgetId,
      year,
      month,
    },
  });
};

// Budget threshold notifications
notificationSchema.statics.createBudgetThresholdNotification = async function (
  userId: string,
  budgetId: string,
  percentage: number,
  year: number,
  month: number
) {
  return this.create({
    user: userId,
    type: NotificationType.BUDGET_THRESHOLD,
    title: 'Budget Threshold Alert',
    message: `Your ${appConstants.MONTH_NAMES[month]} ${year} budget is at ${percentage}% usage. Time to review your spending.`,
    data: {
      budgetId,
      percentage,
      year,
      month,
    },
  });
};

// Budget deleted notifications
notificationSchema.statics.createBudgetDeletedNotification = async function (
  userId: string,
  year: number,
  month: number
) {
  return this.create({
    user: userId,
    type: NotificationType.BUDGET_DELETED,
    title: 'Budget Deleted',
    message: `Your budget for ${appConstants.MONTH_NAMES[month]} ${year} has been deleted.`,
    data: { year, month },
  });
};

const Notification = model<INotificationProps, INotificationModel & INotificationStaticMethods>(
  'Notification',
  notificationSchema
);

export default Notification;
