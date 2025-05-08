import { Router } from 'express';

import { formatSuccessResponse } from '@/utils/response';
import { validateRequestBody, validateRequestID } from '@/middlewares/validate-request';
import { notifQuerySchema } from '@/schemas/notifications';

import Notification from '@/models/notification';

const userNotificationsRouter = Router();

// Get paginated user notifications
userNotificationsRouter.get('/', validateRequestBody(notifQuerySchema), async (req, res) => {
  const userId = req.user?._id;
  const { limit, page, read } = notifQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const result = await Notification.aggregate([
    { $match: { user: userId, read } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        notifications: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: 'totalCount' }],
      },
    },
  ]);

  const notifications = result[0].notifications;
  const { totalCount } = result[0].meta[0] as { totalCount: number };

  res.send(
    formatSuccessResponse({
      message: 'User notifications retrieved successfully.',
      data: {
        notifications,
        pagination: {
          totalItemsCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPageCount: notifications.length,
          page,
          limit,
        },
      },
    })
  );
});

// Get paginated user budgets
userNotificationsRouter.patch('/:id/read', validateRequestID, async (req, res) => {
  const notifId = req.params.id;
  const result = await Notification.findByIdAndUpdate(notifId, { read: true }, { new: true });

  res.send(
    formatSuccessResponse({
      message: 'Notification updated successfully.',
      data: result,
    })
  );
});

export default userNotificationsRouter;
