import { Router } from 'express';
import passport from 'passport';

import { createUserToken, generateRefreshToken, generateTempAuthCode } from '@/services/auth';
import { validateRequestQuery } from '@/middlewares/validate-request';
import { googleExchangeVerifySchema } from '@/schemas/auth';
import { BadRequestError } from '@/config/error';
import { formatSuccessResponse } from '@/utils/response';
import { sendSignupSuccessEmail } from '@/services/email/auth';
import cacheService from '@/config/redis';
import User from '@/models/user';
import ENV from '@/config/env';
import RES_CODE_MAP from '@/constants/res-code-map';
import type { IUserProps } from '@/types';
import clientRoutes from '@/constants/client-routes';

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

    // Temporary code for client side validation
    const accessToken = createUserToken({ id: userId });
    const refreshToken = await generateRefreshToken(userId);

    const tempCode = generateTempAuthCode(userId, accessToken);
    const userInfo = JSON.stringify({ user, accessToken, refreshToken });

    // Store temp code with the user info in Redis/cache with short expiry (5 min)
    await cacheService.set(tempCode, userInfo, 60 * 5);

    // Redirect to exchange route
    res.redirect(`${clientRoutes.AUTH.GOOGLE_AUTH_AUTHORIZE}?authCode=${tempCode}`);
  }
);

googleAuthRouter.get(
  '/exchange-code',
  validateRequestQuery(googleExchangeVerifySchema),
  async (req, res) => {
    const { authCode } = googleExchangeVerifySchema.parse(req.query);

    // Get token from cache using the code
    const cachedUserInfo = await cacheService.get(authCode);

    const userInfo = JSON.parse(String(cachedUserInfo)) as {
      user: IUserProps;
      accessToken: string;
      refreshToken: string;
    } | null;

    if (!userInfo) {
      throw new BadRequestError('Invalid or expired authorization code.');
    }

    const { user, refreshToken, accessToken } = userInfo;
    const resMeta = { accessToken, refreshToken };

    // Create new user if a pending user
    if (!user.roles) {
      const newUser = new User({ ...user, roles: ['user'] });

      await newUser.save();
      await sendSignupSuccessEmail(newUser);

      // Delete auth code
      await cacheService.delete(authCode);

      // Return the token and user data
      return res.status(RES_CODE_MAP.CREATED).send(
        formatSuccessResponse({
          message: 'Account created successfully!',
          status: RES_CODE_MAP.CREATED,
          data: {
            user: newUser,
            meta: resMeta,
          },
        })
      );
    }

    // Delete auth code
    await cacheService.delete(authCode);

    // Return the token and user data
    res.send(
      formatSuccessResponse({
        message: 'Login Successful.',
        data: {
          user: user,
          meta: resMeta,
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

  const redirectUrl = new URL(clientRoutes.AUTH.GOOGLE_AUTH_ERROR_REDIRECT);

  redirectUrl.searchParams.append('message', String(errorMessage));
  redirectUrl.searchParams.append('code', String(errorCode));

  res.redirect(encodeURI(redirectUrl.toString()));
});

export default googleAuthRouter;
