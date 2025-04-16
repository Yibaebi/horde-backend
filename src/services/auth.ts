import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { NotFoundError } from '@/config/error';
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
export const createUserToken = (payload: UserJWTPayload): string =>
  jwt.sign(payload, ENV.HORDE_JWT_SECRET, { expiresIn: '15m' });

/**
 * Generates a temporary authorization code based on user ID and token.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} token - The JWT token associated with the user.
 * @returns {string} A unique temporary authorization code.
 */
export const generateTempAuthCode = (userId: string, token: string): string => {
  const random = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(`${userId}:${token}:${random}`).digest('hex');

  return hash.slice(0, 20); // You can customize the length
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
    expiryDate: { $gt: new Date() },
    isRevoked: false,
  });

  if (!refreshToken) {
    throw new NotFoundError('Invalid or expired refresh token');
  }

  return refreshToken.userId;
};
