import { Router } from 'express';
import authenticate from '@/middlewares/auth';
import standardRateLimiters from '@/middlewares/rate-limiter';

import usersRouter from './user';
import authRouter from './auth';
import adminRouter from './admin';

const mainRouter = Router();

// Authentication Routes
mainRouter.use('/auth', authRouter);

// User Routes
mainRouter.use(
  '/user',
  authenticate(['user', 'admin']),
  standardRateLimiters.standard,
  usersRouter
);

// Admin Routes
mainRouter.use('/admin', authenticate(['admin']), standardRateLimiters.standard, adminRouter);

export default mainRouter;
