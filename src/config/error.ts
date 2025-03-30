import RES_CODE_MAP from '@/constants/res-code-map';
import { generateRandomUUID } from '@/utils/helpers';

export default class ApplicationError extends Error {
  status: number;
  message: string;
  errorCode: string;
  errorDetails: unknown;
  success: false;
  meta: {
    requestID: string;
    timestamp: string;
  };

  constructor(
    message?: string,
    error?: unknown,
    statusCode = RES_CODE_MAP.INTERNAL_SERVER_ERROR,
    errorCode?: keyof typeof RES_CODE_MAP
  ) {
    super(message);

    this.status = statusCode;
    this.message = message || 'Internal Server Error';
    this.errorCode = errorCode || 'INTERNAL_SERVER_ERROR';
    this.errorDetails = error || {};
    this.success = false;

    this.meta = {
      requestID: generateRandomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApplicationError {
  constructor(message = 'Bad Request', error = {}, statusCode = RES_CODE_MAP.BAD_REQUEST) {
    super(message, error, statusCode, 'BAD_REQUEST');
  }
}

class InternalServerError extends ApplicationError {
  constructor(
    message = 'Internal Server Error',
    error = {},
    statusCode = RES_CODE_MAP.INTERNAL_SERVER_ERROR
  ) {
    super(message, error, statusCode, 'INTERNAL_SERVER_ERROR');
  }
}

class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found', error = {}, statusCode = RES_CODE_MAP.NOT_FOUND) {
    super(message, error, statusCode, 'NOT_FOUND');
  }
}

export { BadRequestError, InternalServerError, NotFoundError };
