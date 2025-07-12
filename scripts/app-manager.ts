#!/usr/bin/env ts-node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../src/shared/utils/logger';
import { prompt } from 'inquirer';
import { exec } from 'shelljs';

interface AppProcess {
  pid: number;
  port: number;
  startTime: string;
  status: 'running' | 'stopped' | 'error';
}

const PID_FILE = join(process.cwd(), '.app.pid');
const LOG_FILE = join(process.cwd(), 'logs/app.log');
const ERROR_LOG_FILE = join(process.cwd(), 'logs/error.log');

class AppManager {
  private process: ReturnType<typeof spawn> | null = null;
  private appProcess: AppProcess | null = null;

  async start(options: { port?: number; watch?: boolean } = {}) {
    try {
      // Check if already running
      if (this.isRunning()) {
        const { pid } = this.readPidFile();
        logger.warn(`⚠️  Application is already running with PID ${pid}`);
        return;
      }

      // Validate environment
      await this.validateEnvironment();

      // Ensure log directory exists
      this.ensureLogDirectory();

      // Start the application
      logger.info('🚀 Starting application...');
      
      const port = options.port || process.env.PORT || 3000;
      const args = [];
      
      if (options.watch) {
        args.push('--watch');
      }

      // Start the application process
      this.process = spawn('node', ['dist/main.js'], {
        env: { ...process.env, PORT: port.toString() },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });

      // Handle process events
      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        this.writeToLog(LOG_FILE, output);
      });

      this.process.stderr?.on('data', (data) => {
        const error = data.toString();
        process.stderr.write(error);
        this.writeToLog(ERROR_LOG_FILE, error);
      });

      this.process.on('error', (error) => {
        logger.error('❌ Failed to start application:', error);
        this.cleanup();
      });

      this.process.on('exit', (code) => {
        if (code !== 0) {
          logger.error(`❌ Application exited with code ${code}`);
        } else {
          logger.info('✅ Application stopped');
        }
        this.cleanup();
      });

      // Store process info
      if (this.process.pid) {
        this.appProcess = {
          pid: this.process.pid,
          port: Number(port),
          startTime: new Date().toISOString(),
          status: 'running',
        };

        this.writePidFile();
        logger.info(`✅ Application started with PID ${this.process.pid} on port ${port}`);
        logger.info(`📝 Logs are being written to ${LOG_FILE}`);
      }

      // Detach from the parent process
      this.process.unref();

    } catch (error) {
      logger.error('❌ Failed to start application:', error);
      this.cleanup();
      process.exit(1);
    }
  }

  stop() {
    try {
      if (!this.isRunning()) {
        logger.warn('⚠️  No running application found');
        return;
      }

      const { pid } = this.readPidFile();
      logger.info(`🛑 Stopping application with PID ${pid}...`);
      
      try {
        process.kill(pid, 'SIGTERM');
        logger.info('✅ Application stopped successfully');
      } catch (error) {
        // If process doesn't exist, clean up the PID file
        if (error.code === 'ESRCH') {
          logger.warn('⚠️  Process not found, cleaning up PID file');
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('❌ Failed to stop application:', error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  status() {
    try {
      if (!existsSync(PID_FILE)) {
        logger.info('ℹ️  Application is not running');
        return;
      }

      const { pid, port, startTime, status } = this.readPidFile();
      
      // Check if the process is actually running
      let isRunning = false;
      try {
        process.kill(pid, 0);
        isRunning = true;
      } catch (error) {
        if (error.code === 'ESRCH') {
          logger.warn('⚠️  PID file exists but process is not running');
          this.cleanup();
          return;
        }
      }

      if (isRunning) {
        const uptime = this.formatUptime(startTime);
        logger.info('📊 Application Status');
        logger.info(`  PID: ${pid}`);
        logger.info(`  Port: ${port}`);
        logger.info(`  Status: ${status}`);
        logger.info(`  Uptime: ${uptime}`);
        logger.info(`  Started: ${new Date(startTime).toLocaleString()}`);
      }
    } catch (error) {
      logger.error('❌ Failed to get application status:', error);
      this.cleanup();
    }
  }

  restart() {
    this.stop();
    this.start();
  }

  private isRunning(): boolean {
    if (!existsSync(PID_FILE)) return false;

    try {
      const { pid } = this.readPidFile();
      process.kill(pid, 0);
      return true;
    } catch (error) {
      if (error.code === 'ESRCH') {
        // Process doesn't exist, clean up the PID file
        this.cleanup();
        return false;
      }
      throw error;
    }
  }

  private readPidFile(): AppProcess {
    if (!existsSync(PID_FILE)) {
      throw new Error('PID file not found');
    }

    const content = readFileSync(PID_FILE, 'utf-8');
    return JSON.parse(content) as AppProcess;
  }

  private writePidFile() {
    if (!this.appProcess) return;
    
    writeFileSync(PID_FILE, JSON.stringify(this.appProcess, null, 2), 'utf-8');
  }

  private cleanup() {
    if (existsSync(PID_FILE)) {
      try {
        unlinkSync(PID_FILE);
      } catch (error) {
        logger.warn('⚠️  Failed to remove PID file:', error);
      }
    }
    this.process = null;
    this.appProcess = null;
  }

  private ensureLogDirectory() {
    const logDir = join(process.cwd(), 'logs');
    if (!existsSync(logDir)) {
      exec(`mkdir -p ${logDir}`);
    }
  }

  private writeToLog(file: string, data: string) {
    try {
      require('fs').appendFileSync(file, data, 'utf-8');
    } catch (error) {
      logger.error('Failed to write to log file:', error);
    }
  }

  private formatUptime(startTime: string): string {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = now - start;

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  private async validateEnvironment() {
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = 'v14.0.0';
    if (require('semver').lt(nodeVersion, requiredVersion)) {
      throw new Error(`Node.js version ${requiredVersion} or higher is required. Current version: ${nodeVersion}`);
    }

    // Check if .env file exists
    if (!existsSync(join(process.cwd(), '.env'))) {
      throw new Error('.env file not found. Please create one based on .env.example');
    }

    // Check if dist directory exists
    if (!existsSync(join(process.cwd(), 'dist'))) {
      const { build } = await prompt([{
        type: 'confirm',
        name: 'build',
        message: 'Build directory not found. Would you like to build the application first?',
        default: true,
      }]);

      if (build) {
        logger.info('🔨 Building application...');
        execSync('npm run build', { stdio: 'inherit' });
      } else {
        throw new Error('Build directory not found. Please build the application first.');
      }
    }
  }
}

// Handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new AppManager();

  switch (command) {
    case 'start':
      await manager.start({
        port: parseInt(args[1], 10) || undefined,
        watch: args.includes('--watch'),
      });
      break;
      
    case 'stop':
      manager.stop();
      break;
      
    case 'restart':
      manager.restart();
      break;
      
    case 'status':
      manager.status();
      break;
      
    default:
      console.log(`
Usage: ts-node scripts/app-manager.ts <command> [options]

Commands:
  start [port] [--watch]  Start the application
  stop                    Stop the application
  restart                 Restart the application
  status                  Show application status

Options:
  --watch   Enable watch mode (for development)
`);
      process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('❌ Application manager error:', error);
    process.exit(1);
  });
}

export { AppManager };
