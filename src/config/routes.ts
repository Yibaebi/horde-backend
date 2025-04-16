import 'express-async-errors';

import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import passport from 'passport';
import type { Express } from 'express';

import errorHandler from '@/middlewares/error-handler';
import initializeJWTAuthStrategy from '@/auth/strategies/jwt';
import initializeGoogleOAuthStrategy from '@/auth/strategies/google';

import mainRouter from '@/routes';

const setupAppRoutes = (app: Express) => {
  initializeJWTAuthStrategy();
  initializeGoogleOAuthStrategy();

  // General Routes Config
  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(helmet());

  // Setup passport
  app.use(passport.initialize());

  // Application Routes
  app.use('/api/v1', mainRouter);

  // Error handler
  app.use(errorHandler);
};

export default setupAppRoutes;
