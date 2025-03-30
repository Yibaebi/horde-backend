import { type ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random UUID (Universally Unique Identifier).
 *
 * @returns {string} A randomly generated UUID.
 */
export const generateRandomUUID = (): string => uuidv4();

/**
 * Formats errors from a parsed ZodError object into a readable string.
 *
 * @param {ZodError} error - The ZodError object containing validation errors.
 * @returns {string} A formatted string listing the first field errors.
 */
export const formatParsedZodError = (error: ZodError): string =>
  Object.values(error.flatten().fieldErrors)?.[0]?.[0] || 'No error found';
