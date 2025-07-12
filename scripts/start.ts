#!/usr/bin/env ts-node

import { migrateDB } from '../src/infrastructure/database/database.utils';
import { logger } from '../src/shared/utils/logger';

async function start() {
  try {
    // Run database migrations
    await migrateDB();
    
    // Import the app after migrations to ensure the database is ready
    const { app } = await import('../src/main');
    
    logger.info('🚀 Application started successfully');
    
    return app;
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Only run start if this file is executed directly (not imported)
if (require.main === module) {
  start().catch((error) => {
    console.error('Unhandled error in startup:', error);
    process.exit(1);
  });
}

export { start };
