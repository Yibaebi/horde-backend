import rateLimit from 'express-rate-limit';
import { formatErrorResponse } from '@/utils/response';
import ENV from '@/config/env';
import type { SkipOptions, IUserProps } from '@/types';

/**
 * Creates a rate limiter middleware with custom response formatting
 *
 * @param {number} windowMs - Time window in milliseconds (default: 30 seconds)
 * @param {number} limit - Maximum number of requests per window (default: 1)
 * @param {string} errorMessage - Custom error message (optional)
 * @param {SkipOptions} skipOptions - Options for skipping rate limiting
 * @returns {Function} Express middleware function
 */
export const limitRate = (
  windowMs = 0.5 * 60 * 1000,
  limit = 1,
  errorMessage = 'Too many requests, please try again later',
  skipOptions: SkipOptions = {}
) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      const response = formatErrorResponse({
        message: errorMessage,
        errorCode: 'TOO_MANY_REQUESTS',
        error: {
          retryAfter: { unit: 'seconds', time: Math.ceil(windowMs / 1000) },
          limit,
        },
      });

      res.status(response.status).json(response);
    },
    // Enhanced skip logic with multiple conditions
    skip: (req) => {
      const {
        skipIf = [],
        whitelistedIPs = [],
        whitelistedRoles = [],
        whitelistedPaths = [],
      } = skipOptions;

      // Skip if path is in whitelisted paths
      if (whitelistedPaths.some((path) => req.path.startsWith(path))) {
        return true;
      }

      // Skip if client IP is whitelisted
      const clientIP = req.ip || req.connection.remoteAddress;
      if (clientIP && whitelistedIPs.includes(clientIP)) {
        return true;
      }

      // Skip if user role is whitelisted
      const userRoles = (req.user as IUserProps)?.roles || [];

      if (userRoles && whitelistedRoles.some((r) => userRoles.includes(r))) {
        return true;
      }

      // Skip if any custom condition is true
      if (skipIf.some((condition) => condition(req))) {
        return true;
      }

      return false;
    },
  });

/**
 * Specialized limiters for common scenarios
 */
const standardRateLimiters = {
  // For API endpoints that should be called infrequently
  strict: limitRate(60 * 1000, 5, 'Rate limit exceeded. Maximum 5 requests per minute allowed.', {
    whitelistedRoles: ['admin'],
  }),

  // For normal API endpoints
  standard: limitRate(
    60 * 1000,
    30,
    'Rate limit exceeded. Maximum 30 requests per minute allowed.',
    { whitelistedRoles: ['admin'] }
  ),

  // For authentication endpoints to prevent brute force
  auth: limitRate(5 * 60 * 1000, 5, 'Too many login attempts. Please try again later.', {
    whitelistedIPs: ['127.0.0.1', '::1'],
    skipIf: [() => ENV.NODE_ENV === 'development'],
  }),

  // For public API with higher limits
  public: limitRate(60 * 1000, 60, 'Rate limit exceeded. Please try again later.', {}),
};

/**
 * Factory function to create a custom rate limiter with specific skip conditions
 */
export const createCustomLimiter = (
  windowMs: number,
  limit: number,
  errorMessage: string,
  skipConditions: SkipOptions
) => limitRate(windowMs, limit, errorMessage, skipConditions);

export default standardRateLimiters;
