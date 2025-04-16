import { Router } from 'express';
import passport from 'passport';

import { createUserToken, generateRefreshToken, generateTempAuthCode } from '@/services/auth';
import { validateRequestQuery } from '@/middlewares/validate-request';
import { googleExchangeVerifySchema } from '@/schemas/auth';
import { UnauthorizedError } from '@/config/error';
import { formatSuccessResponse } from '@/utils/response';
import cacheService from '@/config/redis';
import ENV from '@/config/env';
import type { IUserProps } from '@/types';

const googleAuthRouter = Router();

googleAuthRouter.get('/', passport.authenticate('google', { session: false }));

googleAuthRouter.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${ENV.API_HOST}/api/v1/auth/google/failure`,
  }),
  async (req, res) => {
    const user = req.user as IUserProps;
    const userId = user._id;

    // Temporary code to send to frontend
    const token = createUserToken({ id: userId });
    const refreshToken = await generateRefreshToken(userId);

    const tempCode = generateTempAuthCode(userId, token);
    const userInfo = JSON.stringify({ user, token, refreshToken });

    // Store temp code with the user info in Redis/cache with short expiry (5 min)
    await cacheService.set(tempCode, userInfo, 60 * 5);

    // Redirect to exchange route
    res.redirect(`${ENV.CLIENT_BASE_URL}/auth/callback?authCode=${tempCode}`);
  }
);

googleAuthRouter.get(
  '/exchange-code',
  validateRequestQuery(googleExchangeVerifySchema),
  async (req, res) => {
    const { authCode } = googleExchangeVerifySchema.parse(req.query);

    // Get token from cache using the code
    const cachedUserInfo = await cacheService.get(authCode);
    const userInfo = JSON.parse(String(cachedUserInfo));

    if (!userInfo) {
      throw new UnauthorizedError('Invalid or expired authorization code.');
    }

    // Delete auth code
    await cacheService.delete(authCode);

    // Return the token and user data
    res.send(
      formatSuccessResponse({
        message: 'Login Successful',
        data: {
          ...(userInfo as {
            user: IUserProps;
            token: string;
            refreshToken: string;
          }),
        },
      })
    );
  }
);

googleAuthRouter.get('/failure', (req, res) => {
  console.error('Google authentication failed:', {
    timestamp: new Date().toISOString(),
    query: req.query,
    headers: req.headers,
    ip: req.ip,
  });

  // Get error message from query if available
  const errorMessage = req.query?.error_message || 'Authentication failed. Please try again.';
  const errorCode = req.query?.error_code || 'GOOGLE_AUTH_FAILED';

  // Delete any partial auth cookies/sessions
  if (req.cookies && req.cookies['google_auth_state']) {
    res.clearCookie('google_auth_state');
  }

  const redirectUrl = new URL(`${ENV.CLIENT_BASE_URL}/auth/google/error`);

  redirectUrl.searchParams.append('message', String(errorMessage));
  redirectUrl.searchParams.append('code', String(errorCode));

  res.redirect(encodeURI(redirectUrl.toString()));
});

export default googleAuthRouter;
