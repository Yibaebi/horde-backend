import dotenv from 'dotenv';
import z from 'zod';

// Load ENV Variables
dotenv.config();

// ENV Props Schema
const envSchema = z
  .object({
    PORT: z.union([z.string(), z.number()]),
    APP_NAME: z.string(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    API_HOST: z.string(),
    CLIENT_BASE_URL: z.string(),

    // Cache
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string(),
    REDIS_PASSWORD: z.string(),
    REDIS_USERNAME: z.string(),

    // Auth
    HORDE_NODEMAILER_EMAIL: z.string(),
    HORDE_NODEMAILER_GOOGLE_CLIENT_ID: z.string(),
    HORDE_NODEMAILER_GOOGLE_CLIENT_SECRET: z.string(),
    HORDE_NODEMAILER_GOOGLE_REFRESH_TOKEN: z.string(),
    HORDE_NODEMAILER_EMAIL_PASSWORD: z.string(),

    HORDE_DATABASE_URL: z.string(),
    HORDE_EXPRESS_SESSION_SECRET: z.string(),
    HORDE_JWT_SECRET: z.string(),

    HORDE_GOOGLE_AUTH_CLIENT_ID: z.string(),
    HORDE_GOOGLE_AUTH_CLIENT_SECRET: z.string(),
  })
  .strict();

type EnvVariableSchema = z.infer<typeof envSchema>;
type EnvSchemaKeys = keyof EnvVariableSchema;
type EnvDefaultVariable<T extends EnvSchemaKeys> = z.infer<(typeof envSchema.shape)[T]>;

// Returns the env variable from the process or a default
export const getEnvVariable = <T extends EnvSchemaKeys>(
  key: T,
  defaultValue: EnvDefaultVariable<T>
) => (key in process.env ? (process.env[key] as EnvDefaultVariable<T>) : defaultValue);

// Base Environment Variables
const baseENV = {
  PORT: getEnvVariable('PORT', 3001),
  APP_NAME: getEnvVariable('APP_NAME', 'full_stack_search'),
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
  API_HOST: getEnvVariable('API_HOST', 'http://localhost:3000'),
  CLIENT_BASE_URL: getEnvVariable('CLIENT_BASE_URL', 'http://localhost:3000'),

  // Cache
  REDIS_HOST: getEnvVariable('REDIS_HOST', ''),
  REDIS_PORT: getEnvVariable('REDIS_PORT', ''),
  REDIS_PASSWORD: getEnvVariable('REDIS_PASSWORD', ''),
  REDIS_USERNAME: getEnvVariable('REDIS_USERNAME', ''),

  // Auth
  HORDE_GOOGLE_AUTH_CLIENT_ID: getEnvVariable('HORDE_GOOGLE_AUTH_CLIENT_ID', ''),
  HORDE_GOOGLE_AUTH_CLIENT_SECRET: getEnvVariable('HORDE_GOOGLE_AUTH_CLIENT_SECRET', ''),
  HORDE_EXPRESS_SESSION_SECRET: getEnvVariable('HORDE_EXPRESS_SESSION_SECRET', ''),
  HORDE_JWT_SECRET: getEnvVariable('HORDE_JWT_SECRET', ''),
  HORDE_NODEMAILER_EMAIL: getEnvVariable('HORDE_NODEMAILER_EMAIL', ''),
  HORDE_NODEMAILER_GOOGLE_CLIENT_ID: getEnvVariable('HORDE_NODEMAILER_GOOGLE_CLIENT_ID', ''),
  HORDE_NODEMAILER_EMAIL_PASSWORD: getEnvVariable('HORDE_NODEMAILER_EMAIL_PASSWORD', ''),

  HORDE_NODEMAILER_GOOGLE_CLIENT_SECRET: getEnvVariable(
    'HORDE_NODEMAILER_GOOGLE_CLIENT_SECRET',
    ''
  ),

  HORDE_NODEMAILER_GOOGLE_REFRESH_TOKEN: getEnvVariable(
    'HORDE_NODEMAILER_GOOGLE_REFRESH_TOKEN',
    ''
  ),
};

// Development Environment Variables
const development: EnvVariableSchema = {
  ...baseENV,
  HORDE_DATABASE_URL: getEnvVariable(
    'HORDE_DATABASE_URL',
    `mongodb://localhost:27017/${baseENV.APP_NAME}`
  ),
};

// Test Environment Variables
const test: EnvVariableSchema = {
  ...baseENV,
  NODE_ENV: getEnvVariable('NODE_ENV', 'test'),
  HORDE_DATABASE_URL: getEnvVariable(
    'HORDE_DATABASE_URL',
    `mongodb://localhost:27017/${baseENV.APP_NAME}_test`
  ),
};

// Test Environment Variables
const production: EnvVariableSchema = {
  ...baseENV,
  NODE_ENV: getEnvVariable('NODE_ENV', 'production'),
  HORDE_DATABASE_URL: getEnvVariable('HORDE_DATABASE_URL', ''),
};

// Parse current env configuration
const possibleConfigs = { development, test, production };
const ENV = possibleConfigs[baseENV.NODE_ENV];

export { envSchema };
export default ENV;
