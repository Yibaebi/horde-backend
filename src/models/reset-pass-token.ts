import { model, Schema } from 'mongoose';

const resetPassTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Auto-expire after 5mins
  },
});

const ResetPassToken = model('ResetPassToken', resetPassTokenSchema);

export default ResetPassToken;
