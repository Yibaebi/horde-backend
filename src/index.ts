import 'module-alias/register';

import express from 'express';

import { setupGracefulShutdown } from '@/utils/shutdown';
import setupAppRoutes from '@/config/routes';
import startDB from '@/config/db';
import logger from '@/utils/logger';
import ENV from '@/config/env';

const app = express();

startDB();
setupAppRoutes(app);

const server = app.listen(ENV.PORT, () => {
  logger.info(`App is listening on PORT ${ENV.PORT}...`);
});

// Kill server connection when hit with unhandled exception
setupGracefulShutdown(server);
