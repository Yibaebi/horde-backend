export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      APP_NAME: string;
      NODE_ENV: 'development' | 'test' | 'production';
      DATABASE_URL: string;
    }
  }
}
