import passport, { AuthenticateOptions } from 'passport';
import type { Request, Response, NextFunction } from 'express';

import { UnauthorizedError } from '@/config/error';
import type { IUserProps } from '@/types';

/**
 * Creates a JWT authentication middleware with custom error handling
 * @param options - Optional configuration options
 * @returns Express middleware function
 */
export const jwtAuth =
  (options: AuthenticateOptions = { session: false }) =>
  (req: Request, res: Response, next: NextFunction) =>
    passport.authenticate('jwt', options, (err: Error, user: IUserProps) => {
      if (err) return next(err);

      // Unauthorized
      if (!user) return next(new UnauthorizedError());

      req.user = user;

      return next();
    })(req, res, next);

/**
 * Creates middleware to check if user has specific roles
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
export const hasRoles = (roles: IUserProps['roles']) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userRoles = (req.user as IUserProps).roles || [];
    const hasPermission = roles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    return next();
  };
};

/**
 * Creates a complete authentication middleware with optional role checking
 * @param roles - Optional array of allowed roles
 * @returns Array of middleware functions
 */
export const authenticate = (roles?: IUserProps['roles']) => {
  const middlewares = [jwtAuth()];

  if (roles && roles.length > 0) {
    middlewares.push(hasRoles(roles));
  }

  return middlewares;
};

// Export default and named exports
export default authenticate;
