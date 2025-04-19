import { Router } from 'express';
import adminSettingsRouter from './settings';

const adminRouter = Router();

// User settings route
adminRouter.use('/settings', adminSettingsRouter);

export default adminRouter;
