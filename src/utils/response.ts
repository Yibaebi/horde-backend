import { APIErrorResponse, APISuccessResponse } from '@/types/index';
import { generateRandomUUID } from '@/utils/helpers';
import RES_CODE_MAP from '@/constants/res-code-map';

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
  data: T;
}

export const formatSuccessResponse = <T>({
  status = RES_CODE_MAP.OK,
  data,
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
