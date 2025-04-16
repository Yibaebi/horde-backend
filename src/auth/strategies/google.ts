import { Strategy } from 'passport-google-oauth20';
import passport from 'passport';

import { BadRequestError } from '@/config/error';
import User from '@/models/user';
import ENV from '@/config/env';

const initializeGoogleOAuthStrategy = () => {
  passport.use(
    new Strategy(
      {
        clientID: ENV.HORDE_GOOGLE_CLIENT_ID,
        clientSecret: ENV.HORDE_GOOGLE_CLIENT_SECRET,
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
        const existingUser = await User.findOne({ email: googleEmail }).select('-password');

        if (existingUser) {
          req.user = existingUser;

          return done(null, existingUser);
        }

        // No existing user found, create new user
        const newUser = new User({
          email: googleEmail,
          fullName: profile.displayName,
          userName: profile.username ?? '',
          password: '',
        });

        await newUser.save();

        req.user = newUser;

        return done(null, newUser);
      }
    )
  );
};

export default initializeGoogleOAuthStrategy;
