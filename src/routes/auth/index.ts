import { Router } from 'express';

import { refreshUserToken } from '@/services/auth';
import { validateRequestBody } from '@/middlewares/validate-request';
import { refreshTokenSchema } from '@/schemas/auth';
import standardRateLimiters from '@/middlewares/rate-limiter';

import loginRouter from './login';
import signupRouter from './signup';
import googleAuthRouter from './google';
import passResetRouter from './password-reset';

export const authRouter = Router();

authRouter.use('/login', standardRateLimiters.auth, loginRouter);
authRouter.use('/signup', signupRouter);
authRouter.use('/google', googleAuthRouter);

// Password Reset
authRouter.use('/', passResetRouter);

// Token refresh route
authRouter.post('/refresh-token', validateRequestBody(refreshTokenSchema), refreshUserToken);

export default authRouter;
