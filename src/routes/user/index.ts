import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import type { IUserProps } from '@/types';
import userSettingsRouter from './settings';

const userRouter = Router();

// Retrieves the currently authenticated user's information.
userRouter.get('/me', (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Successfully retrieved authenticated user profile.',
      data: req.user as Omit<IUserProps, 'password'>,
    })
  )
);

// User settings route
userRouter.use('/settings', userSettingsRouter);

// User preferences route
userRouter.get('/preferences', async (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Preferences retrieved successfully.',
      data: (req.user as IUserProps).preferences,
    })
  )
);

export default userRouter;
