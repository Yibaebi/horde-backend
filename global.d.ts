export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      APP_NAME: string;
      API_HOST: string;
      NODE_ENV: 'development' | 'test' | 'production';
      HORDE_DATABASE_URL: string;
      HORDE_EXPRESS_SESSION_SECRET: string;
      HORDE_GOOGLE_CLIENT_ID: string;
      HORDE_GOOGLE_CLIENT_SECRET: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      REDIS_USERNAME: string;
    }
  }
}
