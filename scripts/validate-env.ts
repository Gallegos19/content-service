import dotenv from 'dotenv';
import { logger } from '../src/shared/utils/logger';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// Define required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'CORS_ORIGIN',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Validate NODE_ENV
const validEnvironments = ['development', 'test', 'production'];
if (!validEnvironments.includes(process.env.NODE_ENV!)) {
  logger.error(`❌ Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be one of: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Validate PORT
const port = parseInt(process.env.PORT || '3000', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  logger.error(`❌ Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535`);
  process.exit(1);
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
  logger.error('❌ Invalid DATABASE_URL. Must start with postgresql://');
  process.exit(1);
}

// Validate JWT configuration
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your_jwt_secret_key_here') {
  logger.error('❌ You must change the default JWT_SECRET in production');
  process.exit(1);
}

// Validate rate limiting
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

if (isNaN(rateLimitWindowMs) || rateLimitWindowMs < 1000) {
  logger.error(`❌ Invalid RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS}. Must be at least 1000ms`);
  process.exit(1);
}

if (isNaN(rateLimitMax) || rateLimitMax < 1) {
  logger.error(`❌ Invalid RATE_LIMIT_MAX: ${process.env.RATE_LIMIT_MAX}. Must be at least 1`);
  process.exit(1);
}

logger.info('✅ Environment variables validated successfully');
