import dotenv from 'dotenv';
import path from 'path';
import { EnvironmentVariables } from '../constants/types';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Environment configuration
export const env: EnvironmentVariables = {
  // Server
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL as string,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET as string,
  
  // Logging
  LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
  
  // API
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
};

// Validate NODE_ENV
if (!['development', 'production', 'test'].includes(env.NODE_ENV)) {
  throw new Error(`Invalid NODE_ENV: ${env.NODE_ENV}. Must be one of: development, production, test`);
}

// Log environment variables (except sensitive ones)
console.log('Environment:');
console.log(`- NODE_ENV: ${env.NODE_ENV}`);
console.log(`- PORT: ${env.PORT}`);
console.log(`- DATABASE_URL: ${env.DATABASE_URL ? '***' : 'not set'}`);
console.log(`- JWT_SECRET: ${env.JWT_SECRET ? '***' : 'not set'}`);
console.log(`- LOG_LEVEL: ${env.LOG_LEVEL}`);
console.log(`- API_PREFIX: ${env.API_PREFIX}`);
console.log(`- CORS_ORIGIN: ${env.CORS_ORIGIN}`);
console.log(`- RATE_LIMIT_WINDOW_MS: ${env.RATE_LIMIT_WINDOW_MS}`);
console.log(`- RATE_LIMIT_MAX: ${env.RATE_LIMIT_MAX}`);

// Export environment variables
export default env;
