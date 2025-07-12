import { execSync } from 'child_process';
import { logger } from '../src/shared/utils/logger';

async function setupDatabase() {
  try {
    logger.info('🚀 Starting database setup...');

    // 1. Run Prisma migrations
    logger.info('🔄 Running database migrations...');
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

    // 2. Generate Prisma Client
    logger.info('⚙️  Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // 3. Seed the database
    logger.info('🌱 Seeding database...');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });

    logger.info('✅ Database setup completed successfully');
  } catch (error) {
    logger.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
