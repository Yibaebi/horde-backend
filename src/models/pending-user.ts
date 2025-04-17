import dayjs from 'dayjs';
import { model, Schema } from 'mongoose';
import type { IPendingUserProps } from '@/types';

const PendingUserSchema = new Schema<IPendingUserProps>({
  fullName: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true },
  userName: { type: String, maxlength: 15 },
  password: { type: String },
  createdAt: { type: Date, default: () => dayjs().toDate() },
  expiresAt: { type: Date, default: () => dayjs().add(1, 'day').toDate() },
});

// PendingUser model
const PendingUser = model('PendingUser', PendingUserSchema);

export default PendingUser;
