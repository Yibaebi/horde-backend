import { IPendingUserProps, IUserProps } from './src/types';

declare global {
  declare namespace Express {
    export interface User extends Partial<IUserProps>, Partial<IPendingUserProps> {}
  }

  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      APP_NAME: string;
      API_HOST: string;
      NODE_ENV: 'development' | 'test' | 'production';
      HORDE_DATABASE_URL: string;
      HORDE_EXPRESS_SESSION_SECRET: string;

      HORDE_NODEMAILER_EMAIL: string;
      HORDE_NODEMAILER_GOOGLE_CLIENT_ID: string;
      HORDE_NODEMAILER_GOOGLE_CLIENT_SECRET: string;
      HORDE_NODEMAILER_GOOGLE_REFRESH_TOKEN: string;
      HORDE_NODEMAILER_EMAIL_PASSWORD: string;

      HORDE_GOOGLE_AUTH_CLIENT_ID: string;
      HORDE_GOOGLE_AUTH_CLIENT_SECRET: string;
      HORDE_JWT_SECRET: string;

      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      REDIS_USERNAME: string;
    }
  }
}

export {};
