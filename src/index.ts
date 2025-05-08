import 'module-alias/register';

import express from 'express';
import http from 'http';

import { setupGracefulShutdown } from '@/utils/shutdown';
import { initializeSocketIO } from '@/config/socket';
import setupAppRoutes from '@/config/routes';
import startDB from '@/config/db';
import logger from '@/utils/logger';
import ENV from '@/config/env';

const app = express();

// Create HTTP server instance
const server = http.createServer(app);

// Initialize database
startDB();

// Setup API routes
setupAppRoutes(app);

// Initialize Socket.IO server with the same HTTP server
const io = initializeSocketIO(server);

// Start server
server.listen(ENV.PORT, () => {
  logger.info(`App is listening on PORT ${ENV.PORT}...`);
  logger.info(`Socket.IO server is also running on the same port`);
});

// Update shutdown handler to include the HTTP server and Socket.IO
setupGracefulShutdown(server, io);
