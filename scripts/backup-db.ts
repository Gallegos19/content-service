#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  keepLast?: number;
}

async function backupDatabase(options: BackupOptions = {}) {
  const {
    outputDir = join(process.cwd(), 'backups'),
    compress = true,
    keepLast = 5,
  } = options;

  try {
    // Create backup directory if it doesn't exist
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      logger.info(`Created backup directory: ${outputDir}`);
    }

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

    // Create timestamp for backup file
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backupFile = join(outputDir, `backup_${dbName}_${timestamp}.sql`);
    const finalBackupFile = compress ? `${backupFile}.gz` : backupFile;

    logger.info(`Starting database backup for ${dbName}...`);

    // Build pg_dump command
    let dumpCommand = `PGPASSWORD="${dbPass}" pg_dump`;
    dumpCommand += ` -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}`;
    dumpCommand += ' --no-owner --no-privileges --clean --create';
    
    if (compress) {
      dumpCommand += ' | gzip';
    }
    
    dumpCommand += ` > ${finalBackupFile}`;

    // Set PGPASSWORD in environment for pg_dump
    process.env.PGPASSWORD = dbPass;

    // Execute backup command
    execSync(dumpCommand, { stdio: 'pipe' });
    
    logger.info(`✅ Database backup created: ${finalBackupFile}`);

    // Clean up old backups if keepLast is specified
    if (keepLast > 0) {
      await cleanupOldBackups(outputDir, keepLast);
    }

    return finalBackupFile;
  } catch (error) {
    logger.error('❌ Database backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupOldBackups(backupDir: string, keepLast: number) {
  try {
    const { readdir, unlink } = await import('fs/promises');
    const files = await readdir(backupDir);
    
    // Filter backup files and sort by creation time (newest first)
    const backupFiles = files
      .filter(file => file.match(/^backup_.*\.sql(\.gz)?$/))
      .map(file => ({
        name: file,
        path: join(backupDir, file),
        time: require('fs').statSync(join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the most recent 'keepLast' backups
    const filesToDelete = backupFiles.slice(keepLast);
    
    if (filesToDelete.length > 0) {
      logger.info(`🧹 Cleaning up old backups, keeping the last ${keepLast}...`);
      
      for (const file of filesToDelete) {
        try {
          await unlink(file.path);
          logger.debug(`Deleted old backup: ${file.name}`);
        } catch (err) {
          logger.warn(`Failed to delete old backup ${file.name}:`, err);
        }
      }
      
      logger.info(`🧹 Cleaned up ${filesToDelete.length} old backup(s)`);
    }
  } catch (error) {
    logger.warn('Failed to clean up old backups:', error);
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    outputDir: args[0] || undefined,
    compress: !args.includes('--no-compress'),
    keepLast: parseInt(args.find(arg => arg.startsWith('--keep-last='))?.split('=')[1] || '5', 10),
  };

  backupDatabase(options)
    .then(backupFile => {
      console.log(`Backup created: ${backupFile}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}

export { backupDatabase };
