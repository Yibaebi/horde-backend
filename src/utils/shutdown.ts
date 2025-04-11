import mongoose from 'mongoose';
import http, { IncomingMessage, ServerResponse } from 'http';
import logger from './logger';

/**
 * Sets up graceful shutdown handling for the application
 * @param {object} server - HTTP server instance
 */
export function setupGracefulShutdown(
  server: http.Server<typeof IncomingMessage, typeof ServerResponse>
) {
  const SHUT_DOWN_TIMEOUT = 10000;

  const gracefulShutdown = async () => {
    logger.info('Shutdown signal received, closing server and database connections...');

    // Close HTTP server first (stop accepting new requests)
    server.close(() => {
      logger.info('HTTP server closed');

      // Then close database connection
      try {
        mongoose.connection.close(true);
        logger.info('Database connection closed');
      } catch (err) {
        logger.error('Error closing database connection:', err);
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error(
        `Could not close connections in time after ${SHUT_DOWN_TIMEOUT}ms, forcefully shutting down`
      );
      process.exit(1);
    }, SHUT_DOWN_TIMEOUT).unref();
  };

  // Set up signal handlers
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}
