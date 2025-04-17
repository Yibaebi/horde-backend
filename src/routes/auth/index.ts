import { Router } from 'express';

import { refreshUserToken } from '@/services/auth';
import { validateRequestBody } from '@/middlewares/validate-request';
import { refreshTokenSchema } from '@/schemas/auth';

import loginRouter from './login';
import signupRouter from './signup';
import googleAuthRouter from './google';

const authRouter = Router();

authRouter.use('/login', loginRouter);
authRouter.use('/signup', signupRouter);
authRouter.use('/google', googleAuthRouter);

// Token refresh route
authRouter.post('/refresh-token', validateRequestBody(refreshTokenSchema), refreshUserToken);

export default authRouter;
