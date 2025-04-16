import { model, Schema } from 'mongoose';

const refreshTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiryDate: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const RefreshToken = model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
