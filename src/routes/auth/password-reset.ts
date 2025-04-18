import { Router } from 'express';
import { validateRequestBody } from '@/middlewares/validate-request';
import { passwordResetSchema, resetPasswordSchema } from '@/schemas/auth';
import { generateTempAuthCode, hashUserPass } from '@/services/auth';
import { sendPassResetEmail, sendPassResetSuccessEmail } from '@/services/email/auth';
import { formatSuccessResponse } from '@/utils/response';
import { BadRequestError } from '@/config/error';
import PendingUser from '@/models/pending-user';
import User from '@/models/user';
import ResetPassToken from '@/models/reset-pass-token';

const passResetRouter = Router();

// Password reset email
passResetRouter.post(
  '/password-reset',
  validateRequestBody(passwordResetSchema),
  async (req, res) => {
    const { email } = passwordResetSchema.parse(req.body);

    // Throw error if email already exists in pending users collection
    const pendingUser = await PendingUser.findOne({ email });

    if (pendingUser) {
      throw new BadRequestError('Please verify your email before resetting your password.');
    }

    // Send email if user exists
    const user = await User.findOne({ email });

    if (user) {
      const userId = user._id;
      const token = generateTempAuthCode(userId);
      const resetTokenModel = new ResetPassToken({ userId, token });

      await resetTokenModel.save();
      await sendPassResetEmail(user, token);
    }

    return res.json(
      formatSuccessResponse({
        message: 'If an account exists with this email, a reset link has been sent.',
        data: null,
      })
    );
  }
);

// Password reset confirmation
passResetRouter.post(
  '/reset-password',
  validateRequestBody(resetPasswordSchema),
  async (req, res) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const badReqError = new BadRequestError('Invalid or expired token.');

    const tokenModel = await ResetPassToken.findOne({ token });

    if (!tokenModel) throw badReqError;

    const user = await User.findOne({ _id: tokenModel.userId });

    if (!user) throw badReqError;

    user.password = await hashUserPass(password);

    await user.save();
    await ResetPassToken.findOneAndDelete({ token });
    await sendPassResetSuccessEmail(user);

    return res.json(
      formatSuccessResponse({
        message: 'Password Reset Successful. Please login to continue.',
      })
    );
  }
);

export default passResetRouter;
