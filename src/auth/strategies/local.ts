import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy } from 'passport-local';

import { BadRequestError } from '@/config/error';
import User from '@/models/user';
import type { IUserProps } from 'types/models';

const initializeLocalAuthStrategy = () => {
  passport.serializeUser((user, done) => done(null, (user as IUserProps)._id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = User.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new Strategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = (await User.findOne({ email })) as IUserProps;
      const badReqError = new BadRequestError('Invalid credentials!');

      if (!user) done(badReqError, undefined);

      const { password: userPass, ...restUserProps } = user;
      const passIsValid = await bcrypt.compare(password, userPass);

      if (!passIsValid) done(badReqError, undefined);

      done(null, restUserProps);
    })
  );
};

export default initializeLocalAuthStrategy;
