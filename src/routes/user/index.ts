import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import standardRateLimiters from '@/middlewares/rate-limiter';

import userSettingsRouter from './settings';
import userBudgetRouter from './budget';
import userExpensesRouter from './expense';
import userDevRouter from './dev';
import userConfigurationRouter from './configuration';
import userNotificationsRouter from './notifications';

const userRouter = Router();

// Retrieves the currently authenticated user's information.
userRouter.get('/me', (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Successfully retrieved authenticated user profile.',
      data: req.user,
    })
  )
);

// User configurations route
userRouter.use('/config', userConfigurationRouter);

// User settings route
userRouter.use('/settings', userSettingsRouter);

// User Budget route
userRouter.use('/budget', userBudgetRouter);

// User Expenses route
userRouter.use('/expense', userExpensesRouter);

// User Notifications route
userRouter.use('/notifications', userNotificationsRouter);

// Dev only routes
userRouter.use('/dev', standardRateLimiters.devOnly, userDevRouter);

export default userRouter;
