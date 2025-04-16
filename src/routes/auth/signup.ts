import { Router, type Request, type Response } from 'express';
import { validateRequestBody } from '@/middlewares/validate-request';
import { formatSuccessResponse } from '@/utils/response';

import { signupSchema } from '@/schemas/auth';
import { createUserToken, generateRefreshToken, hashUserPass } from '@/services/auth';
import { BadRequestError } from '@/config/error';
import User from '@/models/user';
import RES_CODE_MAP from '@/constants/res-code-map';

const signupRouter = Router();
const { CREATED } = RES_CODE_MAP;

signupRouter.post('/', validateRequestBody(signupSchema), async (req: Request, res: Response) => {
  const userInfo = signupSchema.parse(req.body);

  // Check for existing user
  const existingUser = await User.findOne({ email: userInfo.email });

  if (existingUser) {
    throw new BadRequestError('Email already taken.');
  }

  // Create new user
  const hashedPassword = await hashUserPass(userInfo.password);
  const newUser = new User({ ...userInfo, password: hashedPassword });
  const { password: _, ...newUserData } = newUser.toObject();

  await newUser.save();

  // Tokens
  const token = createUserToken({ id: newUserData._id });
  const refreshToken = await generateRefreshToken(newUserData._id);

  return res.status(CREATED).json(
    formatSuccessResponse({
      message: 'User Created Successfully.',
      data: { user: newUserData, token, refreshToken, expiresIn: 900 },
      status: CREATED,
    })
  );
});

export default signupRouter;
