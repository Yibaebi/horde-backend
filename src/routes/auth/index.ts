import { Router } from 'express';

import { createUserToken, verifyRefreshToken } from '@/services/auth';
import { validateRequestBody } from '@/middlewares/validate-request';
import { refreshTokenSchema } from '@/schemas/auth';

import loginRouter from './login';
import signupRouter from './signup';
import googleAuthRouter from './google';
import { formatSuccessResponse } from '@/utils/response';

const authRouter = Router();

authRouter.use('/login', loginRouter);
authRouter.use('/signup', signupRouter);
authRouter.use('/google', googleAuthRouter);

// Token refresh route
authRouter.post('/refresh-token', validateRequestBody(refreshTokenSchema), async (req, res) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const userId = await verifyRefreshToken(refreshToken);
  const accessToken = createUserToken({ id: String(userId) });

  res.json(
    formatSuccessResponse({
      message: 'New Token Generated successfully',
      data: { accessToken },
    })
  );
});

export default authRouter;
