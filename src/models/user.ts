import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import { getCurrencySymbol } from '@/utils/currency';
import { CurrencyOptions, DateFormat, Theme, TimeFormat, type IUserProps } from '@/types/models';

const userSchema = new Schema<IUserProps>(
  {
    fullName: { type: String, required: true, maxlength: 50 },
    email: { type: String, required: true },
    password: { type: String, required: true },
    userName: {
      type: String,
      maxlength: 40,
      default: function () {
        // Store first saved name as default user name
        return this.fullName.split('')[0];
      },
    },
    preferences: {
      profileImage: String,
      theme: { type: String, default: Theme.Light },
      notifications: { type: Boolean, default: false },
      currency: { type: String, default: CurrencyOptions.NGN },
      currencySym: {
        type: String,
        default: getCurrencySymbol(CurrencyOptions.NGN),
        enum: Object.values(CurrencyOptions),
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
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// User model
const User = model('User', userSchema);

export default User;
