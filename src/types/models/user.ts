import { Document, Types } from 'mongoose';
import { CurrencyOptions, DateFormat, Theme, TimeFormat } from '../app';

/**
 * ===========================
 * USER TYPES
 * ===========================
 */

/**
 * Interface for the user preferences settings.
 * Defines the available preferences for currency, theme, date/time formats, etc.
 */
export interface IUserPreferences {
  currency?: CurrencyOptions;
  currencySym?: CurrencyOptions[keyof CurrencyOptions];
  theme?: Theme;
  profileImage?: string;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  notifications?: boolean;
}

/**
 * Interface for the user profile.
 * Contains basic user information such as name, username, email, password, and preferences.
 */
export interface IUserProps {
  _id: string;
  fullName: string;
  userName: string;
  email: string;
  password: string;
  preferences: IUserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
  roles: Array<'admin' | 'user'>;
}

export type IUserDocument = Document<unknown, object, IUserProps> &
  IUserProps &
  Required<{
    _id: Types.ObjectId;
  }>;

/**
 * Interface for the pending user verification.
 * Contains basic user information such as name, email, and password.
 */
export interface IPendingUserProps {
  _id: string;
  fullName: string;
  userName?: string;
  email: string;
  password: string;
  createdAt: Date;
  expiresAt: Date;
}
