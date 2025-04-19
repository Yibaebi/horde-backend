import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import { findAndUpdateUser } from '@/services/user';
import { validateRequestBody, validateRequestID } from '@/middlewares/validate-request';
import { updateRoleSchema } from '@/schemas/user';

const adminSettingsRouter = Router();

// Update user role
adminSettingsRouter.put(
  '/update-role/:id',
  validateRequestID,
  validateRequestBody(updateRoleSchema),
  async (req, res) => {
    const userID = req.params.id;
    const roles = updateRoleSchema.parse(req.body);

    const updatedUser = await findAndUpdateUser(userID, roles);

    return res.json(
      formatSuccessResponse({
        message: 'User role updated successfully.',
        data: updatedUser,
      })
    );
  }
);

export default adminSettingsRouter;
