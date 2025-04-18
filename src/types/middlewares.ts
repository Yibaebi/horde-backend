import type { Request } from 'express';
import type { IUserProps } from './models';

/**
 * Type definition for skip function options
 */
export type SkipOptions = {
  skipIf?: Array<(req: Request) => boolean>;
  whitelistedIPs?: string[];
  whitelistedRoles?: IUserProps['roles'];
  whitelistedPaths?: string[];
};
