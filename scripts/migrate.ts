#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    logger.info('🚀 Starting database migrations...');

    // 1. Check database connection
    logger.info('🔍 Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection established');

    // 2. Run migrations
    logger.info('🔄 Running pending migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // 3. Generate Prisma Client
    logger.info('⚙️  Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // 4. Run seed if in development or test environment
    if (process.env.NODE_ENV !== 'production') {
      logger.info('🌱 Seeding database...');
      try {
        execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
        logger.info('✅ Database seeded successfully');
      } catch (error) {
        logger.warn('⚠️  Database seeding failed, continuing anyway...');
        logger.debug(error);
      }
    } else {
      logger.info('⏭️  Skipping seeding in production');
    }

    logger.info('✨ Database migrations completed successfully');
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    logger.error('Unhandled error in migration script:', error);
    process.exit(1);
  });
}

export { runMigrations };
