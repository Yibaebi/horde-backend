/**
 * ===========================
 * GENERAL APPLICATION TYPES
 * ===========================
 */

/**
 * Enum representing the theme preferences.
 * - 'light' for light mode.
 * - 'dark' for dark mode.
 */
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

/**
 * Enum representing the date format preferences.
 * - 'MM/DD/YYYY' for the month-first format.
 * - 'DD/MM/YYYY' for the day-first format.
 * - 'YYYY-MM-DD' for the ISO standard format.
 */
export enum DateFormat {
  MM_DD_YYYY = 'MM/DD/YYYY',
  DD_MM_YYYY = 'DD/MM/YYYY',
  YYYY_MM_DD = 'YYYY-MM-DD',
}

/**
 * Enum representing the time format preferences.
 * - '12h' for the 12-hour format (AM/PM).
 * - '24h' for the 24-hour format.
 */
export enum TimeFormat {
  _12Hour = '12h',
  _24Hour = '24h',
}

/**
 * Enum representing the supported currency options.
 */
export enum CurrencyOptions {
  NGN = 'NGN',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

/**
 * @property {number} status - HTTP status code of the error.
 * @property {string} message - A descriptive error message.
 * @property {unknown} [errors] - Array of validation errors (if applicable).
 * @property {string} errorCode - The error identifier.
 * @property {boolean} success - Indicates failure (always false).
 * @property {Object} meta - Metadata related to the request.
 * @property {string} meta.requestID - Unique identifier for the request.
 * @property {string} meta.timestamp - Timestamp of the error occurrence.
 */
export type APIErrorResponse = {
  status: number;
  message?: string;
  errorDetails: unknown; // Optional array of validation errors
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
  data: T | null;
  success: true;
  meta: {
    requestID: string;
    timestamp: string;
  };
};

/**
 * @property {string} id - Conforms to a valid user id.
 */
export type UserJWTPayload = { id: string };

/**
 * @property {number} totalItemsCount - Total number of items across all pages.
 * @property {number} totalPages - Total number of pages available.
 * @property {number} page - Current page number (1-based index).
 * @property {number} limit - Number of items per page.
 * @property {number} currentPageCount - Number of items in the current page.
 */
export type PaginationMetaInfo = {
  totalItemsCount: number;
  totalPages: number;
  page: number;
  limit: number;
  currentPageCount: number;
};
