import { type ZodError } from 'zod';

import { generateRandomUUID } from '@/utils/helpers';
import RES_CODE_MAP from '@/constants/res-code-map';
import { type APIErrorResponse, type APISuccessResponse } from '@/types';

/**
 * Formats a success response object.
 *
 * @template T
 * @param {number} status - The HTTP status code.
 * @param {string} message - A descriptive success message.
 * @param {T} data - The response payload.
 * @returns {SuccessResponse<T>} - The formatted success response.
 */
interface IFormatSuccessResponse<T> {
  status?: number;
  message: string;
  data?: T | null;
}

export const formatSuccessResponse = <T>({
  status = RES_CODE_MAP.OK,
  data = null,
  message,
}: IFormatSuccessResponse<T>): APISuccessResponse<T> => ({
  status,
  message,
  data,
  success: true,
  meta: {
    requestID: generateRandomUUID(), // Unique request ID for tracking
    timestamp: new Date().toISOString(),
  },
});

/**
 * Formats an error response object.
 *
 * @param {number} status - The HTTP status code.
 * @param {string} message - A descriptive error message.
 * @param {string} errorCode - A short identifier for the error type.
 * @param {unknown} [error] - Optional array of validation errors.
 */

interface IFormatError {
  status: number;
  message?: string;
  errorCode: keyof typeof RES_CODE_MAP;
  error: unknown;
}

export const formatErrorResponse = ({
  status,
  message,
  error,
  errorCode,
}: IFormatError): APIErrorResponse => ({
  status,
  message,
  errorCode: errorCode,
  errorDetails: error,
  success: false,
  meta: {
    requestID: generateRandomUUID(),
    timestamp: new Date().toISOString(),
  },
});

/**
 * Formats a Zod validation error into a human-readable format
 *
 * @param error - The ZodError object from a failed validation
 * @returns An object with field paths as keys and error messages as values
 */
export function formatZodError(error: ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  // Handle both error.errors and error.issues (different versions of Zod have different structures)
  const errorItems = error.issues || error.errors || [];

  errorItems.forEach((err) => {
    // Get the field path as a string (e.g., "user.address.street" becomes "user.address.street")
    const path = err.path.join('.');

    // Create a readable message based on the error code and message
    let message = err.message;

    // Special handling for common error types
    if (message === 'Required' || (err.code === 'invalid_type' && err.received === 'undefined')) {
      // Get the field name from the path
      const fieldName = err.path[err.path.length - 1] || path;
      message = `${fieldName} is required`;
    }

    formattedErrors[path] = message;
  });

  return formattedErrors;
}

/**
 * Formats a Zod validation error into a single human-readable string
 * If multiple errors are found, returns a generic message instead
 *
 * @param error - The ZodError object from a failed validation
 * @returns A string with validation error information
 */
export function formatZodErrorToString(error: ZodError): string {
  if (!error || (!error.issues && !error.errors)) {
    return 'Unknown validation error';
  }

  const errors = formatZodError(error);
  const errorCount = Object.keys(errors).length;

  if (errorCount > 1) {
    return `Found ${errorCount} validation errors.`;
  }

  if (errorCount === 1) {
    return Object.entries(errors)[0][1];
  }

  return '';
}
