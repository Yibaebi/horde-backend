import z from 'zod';
import { type NextFunction, type Request, type Response } from 'express';

import { BadRequestError } from '@/config/error';
import { formatZodError, formatZodErrorToString } from '@/utils/response';
import objectIDSchema from '@/schemas/object-id';

/**
 * Middleware to validate request payloads using Zod schemas.
 *
 * @param {z.AnyZodObject} schema - The Zod schema to validate the request payload against.
 * @param {'body' | 'params' | 'query'} type - The part of the request to validate: body, params, or query.
 * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>} - A middleware function that validates the request payload and calls `next()` if valid.
 * @throws {BadRequestError} - Throws an error if validation fails, with formatted error messages.
 *
 * @example
 * const schema = z.object({ name: z.string() });
 * app.post('/users', requestValidator(schema, 'body'), (req, res) => {
 *   res.send('Valid request');
 * });
 */
const requestValidator = (
  schema: z.ZodSchema,
  type: 'body' | 'params' | 'query'
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const requestPayload = req[type];
    const parsed = schema.safeParse(requestPayload);

    if (!parsed.success) {
      throw new BadRequestError(formatZodErrorToString(parsed.error), formatZodError(parsed.error));
    }

    next();
  };
};

const validateRequestQuery = (schema: z.ZodSchema) => requestValidator(schema, 'query');
const validateRequestBody = (schema: z.ZodSchema) => requestValidator(schema, 'body');
const validateRequestID = requestValidator(objectIDSchema, 'params');

export { validateRequestQuery, validateRequestID, validateRequestBody };
export default requestValidator;
