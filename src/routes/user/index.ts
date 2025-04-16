import { Router } from 'express';
import { formatSuccessResponse } from '@/utils/response';
import type { IUserProps } from '@/types';

const userRouter = Router();

/**
 * GET /me
 *
 * Retrieves the currently authenticated user's information.
 *
 * @route GET /me
 * @returns {Object} 200 - A success message with the user data
 */
userRouter.get('/me', (req, res) =>
  res.json(
    formatSuccessResponse({
      message: 'Successfully retrieved authenticated user profile.',
      data: req.user as Omit<IUserProps, 'password'>,
    })
  )
);

export default userRouter;
