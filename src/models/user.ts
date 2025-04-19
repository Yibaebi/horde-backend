import { model, Schema } from 'mongoose';
import { getCurrencySymbol } from '@/utils/helpers';
import { CurrencyOptions, DateFormat, Theme, TimeFormat, type IUserProps } from '@/types';
import currencySymbols from '@/constants/currency-symbols';

const userSchema = new Schema<IUserProps>(
  {
    fullName: { type: String, required: true, maxlength: 50 },
    email: { type: String, required: true },
    password: { type: String, select: false },

    userName: {
      type: String,
      maxlength: 15,
      match: [/^[A-Za-z_]+$/, 'Username can only contain letters and underscores.'],
    },

    preferences: {
      profileImage: String,
      theme: { type: String, default: Theme.Light },
      notifications: { type: Boolean, default: false },
      currency: { type: String, default: CurrencyOptions.NGN },
      currencySym: {
        type: String,
        default: getCurrencySymbol(CurrencyOptions.NGN),
        enum: Object.values(currencySymbols),
      },
      dateFormat: {
        type: String,
        default: DateFormat.DD_MM_YYYY,
        enum: Object.values(DateFormat),
      },
      timeFormat: {
        type: String,
        default: TimeFormat._12Hour,
        enum: Object.values(TimeFormat),
      },
    },

    roles: {
      type: [String],
      required: true,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: ['user'],
    },
  },
  { timestamps: true }
);

// User model
const User = model<IUserProps>('User', userSchema);

export default User;
