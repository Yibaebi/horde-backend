import { Router } from 'express';
import { formatSuccessResponse } from '@/utils/response';
import type { IUserProps } from '@/types';

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

export default userRouter;
