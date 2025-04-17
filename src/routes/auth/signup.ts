import _ from 'lodash';
import { Router, type Request, type Response } from 'express';
import dayjs from 'dayjs';

import {
  createUserToken,
  generateRefreshToken,
  hashUserPass,
  verifyUserToken,
} from '@/services/auth';

import { validateRequestBody } from '@/middlewares/validate-request';
import { formatSuccessResponse } from '@/utils/response';
import { emailConfirmationSchema, resendVerifEmailSchema, signupSchema } from '@/schemas/auth';
import { BadRequestError } from '@/config/error';
import { sendSignupSuccessEmail, sendVerificationEmail } from '@/services/email/auth';

import PendingUser from '@/models/pending-user';
import User from '@/models/user';
import RES_CODE_MAP from '@/constants/res-code-map';

// Router Start
const signupRouter = Router();
const { CREATED } = RES_CODE_MAP;

signupRouter.post('/', validateRequestBody(signupSchema), async (req: Request, res: Response) => {
  const userInfo = signupSchema.parse(req.body);
  const userEmail = userInfo.email;

  // Check for existing user
  const existingUser = await User.findOne({ email: userEmail });

  if (existingUser) {
    throw new BadRequestError('Email already taken.');
  }

  // If user tries to create another user pending verification
  const pendingExistingUser = await PendingUser.findOne({
    email: userEmail,
    expiresAt: { $gt: dayjs().toDate() },
  });

  if (pendingExistingUser) {
    return res.json(
      formatSuccessResponse({
        message: 'Email Confirmation Already Sent. Please check your mailbox.',
      })
    );
  }

  // Create new user
  const hashedPassword = await hashUserPass(userInfo.password);
  const pendingUser = new PendingUser({ ...userInfo, password: hashedPassword });

  await pendingUser.save();

  // Tokens
  const token = createUserToken({ id: pendingUser._id });

  // Send email verification mail
  await sendVerificationEmail(userInfo.email, token);

  return res.status(CREATED).json(
    formatSuccessResponse({
      message: 'Email Confirmation Sent. Please check your mailbox.',
      data: { user: _.omit(pendingUser.toObject(), '_id', 'password') },
      status: CREATED,
    })
  );
});

signupRouter.post(
  '/verify-email',
  validateRequestBody(emailConfirmationSchema),
  async (req: Request, res: Response) => {
    const { token } = emailConfirmationSchema.parse(req.body);

    const payload = verifyUserToken(token) as { id: string };
    const pUserId = payload.id;

    // Check for pending user
    const pendingUser = await PendingUser.findOne({
      _id: pUserId,
      expiresAt: { $gt: dayjs().toDate() },
    });

    if (!pendingUser) {
      throw new BadRequestError('Invalid or expired token.');
    }

    // Create new user
    const newUserProps = _.pick(pendingUser.toObject(), 'email', 'fullName', 'password');
    const newUser = new User({ ...newUserProps, roles: ['user'] });

    await newUser.save();
    await sendSignupSuccessEmail(newUser);

    await PendingUser.findByIdAndDelete(pUserId);

    // Tokens
    const accessToken = createUserToken({ id: newUser._id });
    const refreshToken = await generateRefreshToken(newUser._id);

    return res.status(CREATED).json(
      formatSuccessResponse({
        message: 'User Created Successfully.',
        data: {
          user: _.omit(newUser.toObject(), 'password'),
          meta: { accessToken, refreshToken, expiresIn: dayjs().add(23, 'hours').toDate() }, // One hour before actual expiry
        },
        status: CREATED,
      })
    );
  }
);

signupRouter.post(
  '/resend-verif-email',
  validateRequestBody(resendVerifEmailSchema),
  async (req: Request, res: Response) => {
    const { email } = resendVerifEmailSchema.parse(req.body);

    // Check for pending user
    const pendingUser = await PendingUser.findOne({
      email,
      expiresAt: { $gt: dayjs().toDate() },
    });

    if (pendingUser) {
      await sendVerificationEmail(email, createUserToken({ id: pendingUser._id }));

      return res.json(
        formatSuccessResponse({
          message: 'Verification email sent successfully',
          data: null,
        })
      );
    }

    return res.json(
      formatSuccessResponse({
        message: 'If an account exists with this email, a verification link has been sent',
        data: null,
      })
    );
  }
);

export default signupRouter;
