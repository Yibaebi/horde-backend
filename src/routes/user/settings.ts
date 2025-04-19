import { Router } from 'express';
import { formatSuccessResponse } from '@/utils/response';
import { validateRequestBody } from '@/middlewares/validate-request';
import { updatePreferencesSchema, updateProfileSchema } from '@/schemas/user';
import { findAndUpdateUser } from '@/services/user';
import type { IUserProps } from '@/types';

const userSettingsRouter = Router();

// Gets success message for all update types
const getSuccessResponse = (user: unknown, message?: string) =>
  formatSuccessResponse({
    message: message || 'Profile updated successfully.',
    data: user,
  });

// Update user profile (Fullname and Username)
userSettingsRouter.put(
  '/update-profile',
  validateRequestBody(updateProfileSchema),
  async (req, res) => {
    const profileData = updateProfileSchema.parse(req.body);
    const updatedUser = await findAndUpdateUser((req.user as IUserProps)._id, profileData);

    return res.json(getSuccessResponse(updatedUser));
  }
);

// Update user profile
userSettingsRouter.put(
  '/update-preferences',
  validateRequestBody(updatePreferencesSchema),
  async (req, res) => {
    const preferences = updatePreferencesSchema.parse(req.body);
    const user = req.user as IUserProps;

    const updatedUser = await findAndUpdateUser(user._id, {
      preferences: { ...user.preferences, ...preferences },
    });

    return res.json(getSuccessResponse(updatedUser));
  }
);

export default userSettingsRouter;
