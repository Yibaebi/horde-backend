import { Router } from 'express';
import authenticate from '@/middlewares/auth';
import standardRateLimiters from '@/middlewares/rate-limiter';

import usersRouter from './user';
import authRouter from './auth';

const mainRouter = Router();

// Authentication Routes
mainRouter.use('/auth', authRouter);

// User Routes
mainRouter.use('/user', authenticate(['user']), standardRateLimiters.standard, usersRouter);

export default mainRouter;
