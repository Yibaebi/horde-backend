import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import ENV from '@/config/env';
import User from '@/models/user';
import type { IUserProps, UserJWTPayload } from '@/types';

const initializeJWTAuthStrategy = () => {
  passport.use(
    new Strategy(
      {
        secretOrKey: ENV.HORDE_JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      async (jwt_payload: UserJWTPayload, done) => {
        try {
          const user = await User.findById(jwt_payload.id);
          done(null, user as IUserProps);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
};

export default initializeJWTAuthStrategy;
