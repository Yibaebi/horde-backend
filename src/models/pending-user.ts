import { model, Schema } from 'mongoose';
import type { IPendingUserProps } from 'types/models';

const PendingUserSchema = new Schema<IPendingUserProps>({
  fullName: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

// PendingUser model
const PendingUser = model('PendingUser', PendingUserSchema);

export default PendingUser;
