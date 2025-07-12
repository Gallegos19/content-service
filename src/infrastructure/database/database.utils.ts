import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Log Prisma events
prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message}`);
});

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message}`);
});

/**
 * Connect to the database
 */
export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from the database
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('👋 Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    process.exit(1);
  }
};

/**
 * Reset the database (for testing purposes)
 */
export const resetDB = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDB can only be used in test environment');
  }
  
  try {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
    
    logger.info('🧹 Database reset successful');
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  }
};

/**
 * Run database migrations
 */
export const migrateDB = async (): Promise<void> => {
  try {
    const { execSync } = await import('child_process');
    
    logger.info('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    logger.info('✅ Database migrations completed');
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  }
};

export { prisma };
