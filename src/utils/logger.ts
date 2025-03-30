import { format, createLogger, transports } from 'winston';
import ENV from '@/config/env';

// Log format
const logFormat = format.printf(({ level, message, timestamp, key }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const FILE_CONFIG = {
  dirname: '../logs',
  zippedArchive: true,
};

// Logger configuration
const logger = createLogger({
  level: 'info',
  format: format.combine(format.label({ label: ENV.APP_NAME }), format.timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log', level: 'error', ...FILE_CONFIG }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({ filename: 'exceptions.log', ...FILE_CONFIG }),
  ],
  rejectionHandlers: [new transports.File({ filename: 'rejections.log', ...FILE_CONFIG })],
});

export default logger;
