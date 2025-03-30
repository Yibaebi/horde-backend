/**
 * ===========================
 * GENERAL APPLICATION TYPES
 * ===========================
 */

/**
 * @property {number} status - HTTP status code of the error.
 * @property {string} message - A descriptive error message.
 * @property {ErrorDetail[]} [errors] - Array of validation errors (if applicable).
 * @property {string} errorCode - The error identifier.
 * @property {boolean} success - Indicates failure (always false).
 * @property {Object} meta - Metadata related to the request.
 * @property {string} meta.requestID - Unique identifier for the request.
 * @property {string} meta.timestamp - Timestamp of the error occurrence.
 */
export type APIErrorResponse = {
  status: number;
  message?: string;
  errorDetails: ErrorDetail[] | unknown; // Optional array of validation errors
  errorCode: string;
  success: false;
  meta: {
    requestID: string;
    timestamp: string;
  };
};

/**
 * @template T
 * @property {number} status - HTTP status code (e.g., 200, 201).
 * @property {string} message - A descriptive success message.
 * @property {T} data - The response payload.
 * @property {boolean} success - Indicates success (always true).
 * @property {MetaData} meta - Metadata for tracking the request.
 */
export type APISuccessResponse<T> = {
  status: number;
  message?: string;
  data: T;
  success: true;
  meta: {
    requestID: string;
    timestamp: string;
  };
};
