import z from 'zod';

/**
 * Zod schema for validating user signup data.
 *
 * @typedef {Object} signupSchema
 * @property {string} fullName - The full name of the user (max 50 characters).
 * @property {string} email - A valid email address.
 * @property {string} password - A strong password that must be at least 8 characters long and include:
 * an uppercase letter, a lowercase letter, a number, and a special character.
 */
export const signupSchema = z.object({
  fullName: z.string().max(50),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
    ),
});

/**
 * Zod schema for validating user login data.
 *
 * @typedef {Object} loginSchema
 * @property {string} email - A valid email address.
 * @property {string} password - A valid password.
 */
export const loginSchema = signupSchema.omit({ fullName: true });

/**
 * Zod schema for validating the Google authorization code exchange.
 *
 * @typedef {Object} googleExchangeVerifySchema
 * @property {string} authCode - The authorization code received from Google's OAuth flow.
 */
export const googleExchangeVerifySchema = z.object({
  authCode: z.string(),
});

/**
 * Zod schema for validating the refresh token request body.
 *
 * @typedef {Object} refreshTokenSchema
 * @property {string} refreshToken - The current refresh token from client.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});
