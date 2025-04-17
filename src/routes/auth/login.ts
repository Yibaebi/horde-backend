import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';

import { validateRequestBody } from '@/middlewares/validate-request';

import { loginSchema } from '@/schemas/auth';
import { formatSuccessResponse } from '@/utils/response';
import { createUserToken, generateRefreshToken } from '@/services/auth';
import { BadRequestError } from '@/config/error';
import User from '@/models/user';

const loginRouter = Router();

loginRouter.post('/', validateRequestBody(loginSchema), async (req: Request, res: Response) => {
  const loginData = loginSchema.parse(req.body);
  const invalidCredError = new BadRequestError('Invalid credentials!');

  // Check for existing user
  const user = await User.findOne({ email: loginData.email }).lean();

  if (!user) throw invalidCredError;

  const { password, ...userProps } = user;
  const passIsValid = await bcrypt.compare(loginData.password, password);

  if (!passIsValid) throw invalidCredError;

  // Create tokens
  const userId = user._id;
  const token = createUserToken({ id: userId });
  const refreshToken = await generateRefreshToken(userId);

  res.send(
    formatSuccessResponse({
      message: 'Login Successful.',
      data: { token, refreshToken, user: userProps, expiresIn: 900 },
    })
  );
});

export default loginRouter;
