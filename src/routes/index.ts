import { Router } from 'express';
import authenticate from '@/middlewares/auth';

import usersRouter from './user';
import authRouter from './auth';

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/user', authenticate(['user']), usersRouter);

export default mainRouter;
