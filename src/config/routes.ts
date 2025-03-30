import 'express-async-errors';

import { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import errorHandler from '@/middlewares/error-handler';

const setupAppRoutes = (app: Express) => {
  // General Routes Config
  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(helmet());

  // Application routes setup

  // Error handler
  app.use(errorHandler);
};

export default setupAppRoutes;
