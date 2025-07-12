#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import { prompt } from 'inquirer';

const prisma = new PrismaClient();

interface RestoreOptions {
  backupFile?: string;
  backupDir?: string;
  dropDatabase?: boolean;
  createDatabase?: boolean;
  noPrompt?: boolean;
}

async function restoreDatabase(options: RestoreOptions = {}) {
  const {
    backupFile,
    backupDir = join(process.cwd(), 'backups'),
    dropDatabase = false,
    createDatabase = true,
    noPrompt = false,
  } = options;

  try {
    // Parse DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Extract database connection details from URL
    const url = new URL(databaseUrl);
    const dbName = url.pathname.replace(/^\/+|\/+$/g, '');
    const dbUser = url.username;
    const dbPass = url.password;
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';

    // Find backup file if not provided
    let backupFilePath = backupFile;
    if (!backupFilePath) {
      if (!existsSync(backupDir)) {
        throw new Error(`Backup directory not found: ${backupDir}`);
      }

      // List available backups
      const backupFiles = readdirSync(backupDir)
        .filter(file => file.match(/^backup_.*\.sql(\.gz)?$/))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        throw new Error(`No backup files found in ${backupDir}`);
      }

      if (noPrompt) {
        // Use the most recent backup
        backupFilePath = join(backupDir, backupFiles[0]);
        logger.info(`Using most recent backup: ${backupFilePath}`);
      } else {
        // Prompt user to select a backup
        const { selectedBackup } = await prompt([{
          type: 'list',
          name: 'selectedBackup',
          message: 'Select a backup to restore:',
          choices: backupFiles,
          pageSize: 10,
        }]);
        
        backupFilePath = join(backupDir, selectedBackup);
      }
    }

    // Verify backup file exists
    if (!existsSync(backupFilePath!)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }

    // Confirm restore
    if (!noPrompt) {
      const { confirm } = await prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `WARNING: This will restore the database from backup. This operation cannot be undone.\n` +
                 `Database: ${dbName}\n` +
                 `Backup: ${basename(backupFilePath!)}\n\n` +
                 'Are you sure you want to continue?',
        default: false,
      }]);

      if (!confirm) {
        logger.info('Restore operation cancelled');
        return;
      }
    }

    logger.info(`Starting database restore from ${backupFilePath}...`);

    // Build restore command
    let restoreCommand = '';
    
    // Add decompression if file is gzipped
    if (backupFilePath!.endsWith('.gz')) {
      restoreCommand += `gunzip -c ${backupFilePath} | `;
    } else {
      restoreCommand += `cat ${backupFilePath} | `;
    }

    // Add psql command
    restoreCommand += `PGPASSWORD="${dbPass}" psql`;
    restoreCommand += ` -h ${dbHost} -p ${dbPort} -U ${dbUser}`;
    
    // Connect to postgres database to drop/create the target database if needed
    if (dropDatabase || createDatabase) {
      logger.info('Preparing database...');
      
      if (dropDatabase) {
        // Terminate all connections to the database
        const terminateConnections = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();"`;
        execSync(terminateConnections, { stdio: 'pipe' });
        
        // Drop the database
        const dropDb = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS \"${dbName}\";"`;
        execSync(dropDb, { stdio: 'pipe' });
      }
      
      if (createDatabase) {
        // Create the database
        const createDb = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE \"${dbName}\";"`;
        execSync(createDb, { stdio: 'pipe' });
      }
    }
    
    // Connect to the target database for the restore
    restoreCommand += ` -d ${dbName}`;

    // Execute restore command
    logger.info('Restoring database...');
    execSync(restoreCommand, { stdio: 'inherit' });
    
    logger.info('✅ Database restore completed successfully');
    
    // Run migrations after restore to ensure schema is up to date
    logger.info('🔄 Running migrations after restore...');
    execSync('npx ts-node scripts/migrate.ts', { stdio: 'inherit' });
    
    logger.info('✨ Database is ready to use');
  } catch (error) {
    logger.error('❌ Database restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run restore if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options: RestoreOptions = {
    backupFile: args[0] || undefined,
    dropDatabase: args.includes('--drop-db'),
    createDatabase: !args.includes('--no-create-db'),
    noPrompt: args.includes('--no-prompt'),
  };

  restoreDatabase(options)
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Restore failed:', error);
      process.exit(1);
    });
}

export { restoreDatabase };
