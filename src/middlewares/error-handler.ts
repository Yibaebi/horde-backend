import { type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';

import { formatErrorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import ApplicationError from '@/config/error';
import RES_CODE_MAP from '@/constants/res-code-map';

const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = RES_CODE_MAP;

const RUNTIME_ERRORS = [
  'ZodError',
  'MongooseError',
  'CastError',
  'ValidationError',
  'SyntaxError',
  'MongoError',
];

// Middleware function
const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const error = err as { message?: string; name: string };
  const errorMessage = error?.message;

  // Log error for debugging or monitoring
  logger.error(`[${req.method}] ${req.originalUrl} - ${errorMessage ?? error}`);

  if (error instanceof ApplicationError) {
    return res.status(error.status).send({ ...error, message: errorMessage });
  }

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    const validationErrors = Object.values(error.errors).map((e) => e.message);

    const errorDetails = formatErrorResponse({
      status: BAD_REQUEST,
      error: validationErrors,
      errorCode: 'BAD_REQUEST',
      message: 'Bad Request',
    });

    return res.status(BAD_REQUEST).send(errorDetails);
  }

  // Runtime errors
  if (RUNTIME_ERRORS.includes(error.name)) {
    const errorDetails = formatErrorResponse({
      message: errorMessage || 'Runtime Error',
      errorCode: 'BAD_REQUEST',
      status: BAD_REQUEST,
      error,
    });

    return res.status(BAD_REQUEST).send(errorDetails);
  }

  // Default to internal server error
  return res.status(INTERNAL_SERVER_ERROR).send(
    formatErrorResponse({
      message: errorMessage || 'Something failed',
      errorCode: 'INTERNAL_SERVER_ERROR',
      status: INTERNAL_SERVER_ERROR,
      error,
    })
  );
};

export default errorHandler;
