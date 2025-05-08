import { DefaultEventsMap, Socket, Server as SocketIOServer } from 'socket.io';
import http from 'http';

import { verifyUserToken } from '@/services/auth';
import { UnauthorizedError } from '@/config/error';
import logger from '@/utils/logger';
import ENV from '@/config/env';
import type { IUserProps } from '@/types';

// Interface for socket with user data
interface AuthenticatedSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  userId?: string;
  user?: IUserProps;
}

// Socket.IO instance
let io: SocketIOServer;

/**
 * Initialize Socket.IO server
 * @param server HTTP server instance
 * @returns Socket.IO server instance
 */
export const initializeSocketIO = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ENV.CLIENT_BASE_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },

    pingTimeout: 60000,
    pingInterval: 25000,
  });

  logger.info('Socket.IO server initialized');

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      console.log(socket.handshake);

      const token = extractTokenFromSocket(socket);

      if (!token) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Verify token
      const payload = verifyUserToken(token) as { id: string };

      socket.userId = payload.id;

      return next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      return next(new UnauthorizedError('Invalid authentication token'));
    }
  });

  // Handle client connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;

    logger.info(`Socket.IO client connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.emit('connection_success', {
      message: 'Successfully connected to Socket.IO server',
      userId,
    });

    socket.on('disconnect', (reason: string) => {
      logger.info(`Socket.IO client disconnected: ${userId}, reason: ${reason}`);
      socket.leave(`user:${userId}`);
    });

    socket.on('message', (data) => handleIncomingMessage(userId as string, data, socket));
  });

  return io;
};

/**
 * Extract authentication token from socket handshake
 */
const extractTokenFromSocket = (socket: AuthenticatedSocket): string | null => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }

  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token as string;
  }

  const headers = socket.handshake.headers;
  if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
    return headers.authorization.substring(7);
  }

  return null;
};

/**
 * Set up custom event handlers for each socket
 */
export const setupEventHandlers = (socket: AuthenticatedSocket) => {
  socket.on('ping', (callback) => {
    if (typeof callback === 'function') {
      callback({
        status: 'success',
        time: new Date().toISOString(),
      });
    } else {
      socket.emit('pong', {
        time: new Date().toISOString(),
      });
    }
  });
};

/**
 * Handle incoming socket messages
 */
const handleIncomingMessage = (
  userId: string,
  data: { type: string; message: unknown },
  socket: AuthenticatedSocket
) => {
  logger.info(`Received message from ${userId}:`, data);

  // Example message handling logic
  if (data.type === 'echo') {
    socket.emit('message', {
      type: 'echo_response',
      originalMessage: data.message,
      timestamp: Date.now(),
    });
  }
};

/**
 * Send a message to a specific user
 */
export const sendNotificationToUser = <T>(
  userId: string,
  event: 'notification',
  data: T
): boolean => {
  if (!io) {
    logger.error('Socket.IO server not initialized');
    return false;
  }

  io.to(`user:${userId}`).emit(event, data);

  return true;
};

/**
 * Broadcast a message to all connected users
 */
export const broadcast = (event: string, data: unknown, exceptUserId?: string): void => {
  if (!io) {
    logger.error('Socket.IO server not initialized');

    return;
  }

  if (exceptUserId) {
    io.except(`user:${exceptUserId}`).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

/**
 * Get Socket.IO server instance
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }

  return io;
};

export default {
  initializeSocketIO,
  sendNotificationToUser,
  broadcast,
  getIO,
};
