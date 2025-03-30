import dotenv from 'dotenv';
import z from 'zod';
import { formatParsedZodError } from '@/utils/helpers';

// Load ENV Variables
dotenv.config();

// ENV Props Schema
const envSchema = z
  .object({
    PORT: z.union([z.string(), z.number()]),
    APP_NAME: z.string(),
    NODE_ENV: z.enum(['development', 'test']),
    DATABASE_URL: z.string(),
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
};

// Development Environment Variables
const development: EnvVariableSchema = {
  ...baseENV,
  DATABASE_URL: getEnvVariable('DATABASE_URL', `mongodb://localhost:27017/${baseENV.APP_NAME}`),
};

// Production Environment Variables
const test: EnvVariableSchema = {
  ...baseENV,
  NODE_ENV: getEnvVariable('NODE_ENV', 'test'),
  DATABASE_URL: getEnvVariable(
    'DATABASE_URL',
    `mongodb://localhost:27017/${baseENV.APP_NAME}_test`
  ),
};

// Parse current env configuration
const possibleConfigs = { development, test };
const ENV = possibleConfigs[baseENV.NODE_ENV];

export default ENV;
