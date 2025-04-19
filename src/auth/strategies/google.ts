import { Strategy } from 'passport-google-oauth20';
import dayjs from 'dayjs';
import passport from 'passport';

import { BadRequestError } from '@/config/error';
import PendingUser from '@/models/pending-user';
import User from '@/models/user';
import ENV from '@/config/env';
import { IUserProps } from '@/types';

const initializeGoogleOAuthStrategy = () => {
  passport.use(
    new Strategy(
      {
        clientID: ENV.HORDE_GOOGLE_AUTH_CLIENT_ID,
        clientSecret: ENV.HORDE_GOOGLE_AUTH_CLIENT_SECRET,
        callbackURL: `${ENV.API_HOST}/api/v1/auth/google/callback`,
        scope: ['email', 'profile'],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        const googleEmail = profile.emails?.[0]?.value;

        if (!googleEmail) {
          return done(new BadRequestError('Email not provided from Google'), undefined);
        }

        // Check for existing user
        const existingUser = await User.findOne({ email: googleEmail });

        if (existingUser) {
          req.user = existingUser as IUserProps;

          return done(null, existingUser);
        }

        // Check for pending user
        const pendingUser = await PendingUser.findOne({
          email: googleEmail,
          expiresAt: { $gt: dayjs().toDate() },
        });

        if (pendingUser) {
          req.user = pendingUser;

          return done(null, pendingUser);
        }

        // No existing pending user found.
        const newUser = new PendingUser({
          email: googleEmail,
          fullName: profile.displayName,
          userName: profile.username ?? '',
        });

        await newUser.save();

        req.user = newUser;

        return done(null, newUser);
      }
    )
  );
};

export default initializeGoogleOAuthStrategy;
