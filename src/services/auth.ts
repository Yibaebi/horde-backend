import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dayjs from 'dayjs';
import type { Request, Response } from 'express';

import { refreshTokenSchema } from '@/schemas/auth';
import { formatSuccessResponse } from '@/utils/response';
import { BadRequestError, NotFoundError } from '@/config/error';
import RefreshToken from '@/models/refresh-token';
import ENV from '@/config/env';
import type { UserJWTPayload } from '@/types';

/**
 * Hashes a user's password using bcrypt with a salt.
 *
 * @param {string} password - The plain text password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export const hashUserPass = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);

  return await bcrypt.hash(password, salt);
};

/**
 * Creates a signed JWT token for the given user payload.
 *
 * @param {UserJWTPayload} payload - The payload containing the user's unique identifier.
 * @returns {string} A signed JWT token.
 */
export const createUserToken = (
  payload: UserJWTPayload,
  options: SignOptions = { expiresIn: '1d' }
): string => jwt.sign(payload, ENV.HORDE_JWT_SECRET, options);

/**
 * Verifies a JWT token using the application's secret key.
 *
 * @param {string} token - The JWT token to verify.
 * @returns {string | jwt.JwtPayload} The decoded token if valid.
 * @throws {jwt.JsonWebTokenError} If the token is invalid or verification fails.
 */
export const verifyUserToken = (token: string): string | jwt.JwtPayload => {
  try {
    return jwt.verify(token, ENV.HORDE_JWT_SECRET);
  } catch (error) {
    throw new BadRequestError('Invalid or expired token.', error as object);
  }
};

/**
 * Generates a temporary authorization code based on user ID and token.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} token - The JWT token associated with the user.
 * @returns {string} A unique temporary authorization code.
 */
export const generateTempAuthCode = (userId: string, token: string): string => {
  const random = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(`${userId}:${token}:${random}`).digest('hex');

  return hash.slice(0, 20);
};

// Generate refresh token
export const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiryDate = new Date();

  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days

  const refreshToken = new RefreshToken({
    token,
    userId,
    expiryDate,
  });

  await refreshToken.save();

  return token;
};

// Verify refresh token
export const verifyRefreshToken = async (token: string) => {
  const refreshToken = await RefreshToken.findOne({
    token,
    expiryDate: { $gt: dayjs().toDate() },
    isRevoked: false,
  });

  if (!refreshToken) {
    throw new NotFoundError('Invalid or expired refresh token.');
  }

  return refreshToken.userId;
};

// Refresh token
export const refreshUserToken = async (req: Request, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  const userId = await verifyRefreshToken(refreshToken);
  const accessToken = createUserToken({ id: String(userId) });

  res.json(
    formatSuccessResponse({
      message: 'New Token Generated successfully.',
      data: { accessToken },
    })
  );
};
