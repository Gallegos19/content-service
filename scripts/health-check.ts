import { execSync } from 'child_process';
import { logger } from '../src/shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message: string;
      timestamp: string;
    };
  };
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', message: 'Database connection is healthy' };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', message: 'Database connection failed' };
  }
}

async function checkApi(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'healthy', message: 'API is responding' });
      } else {
        resolve({
          status: 'degraded',
          message: `API returned status code ${res.statusCode}`,
        });
      }
    });

    req.on('error', (error) => {
      logger.error('API health check failed:', error);
      resolve({ status: 'unhealthy', message: 'API is not responding' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'degraded', message: 'API request timed out' });
    });

    req.end();
  });
}

async function checkDiskSpace(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  try {
    // This works on Unix-like systems
    const stdout = execSync('df -k /').toString();
    const lines = stdout.trim().split('\n');
    const diskInfo = lines[1].split(/\s+/);
    const available = parseInt(diskInfo[3], 10);
    const total = parseInt(diskInfo[1], 10);
    const usedPercentage = ((total - available) / total) * 100;

    if (usedPercentage > 90) {
      return {
        status: 'unhealthy',
        message: `Disk usage is at ${usedPercentage.toFixed(2)}%`,
      };
    } else if (usedPercentage > 80) {
      return {
        status: 'degraded',
        message: `Disk usage is at ${usedPercentage.toFixed(2)}%`,
      };
    }

    return { status: 'healthy', message: 'Disk space is sufficient' };
  } catch (error) {
    logger.error('Disk space check failed:', error);
    return { status: 'degraded', message: 'Could not check disk space' };
  }
}

async function checkMemory(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
}> {
  try {
    // This works on Linux/Unix systems
    const stdout = execSync('free -m').toString();
    const lines = stdout.trim().split('\n');
    const memoryInfo = lines[1].split(/\s+/).filter(Boolean);
    const total = parseInt(memoryInfo[1], 10);
    const used = parseInt(memoryInfo[2], 10);
    const usedPercentage = (used / total) * 100;

    if (usedPercentage > 90) {
      return {
        status: 'unhealthy',
        message: `Memory usage is at ${usedPercentage.toFixed(2)}%`,
      };
    } else if (usedPercentage > 80) {
      return {
        status: 'degraded',
        message: `Memory usage is at ${usedPercentage.toFixed(2)}%`,
      };
    }

    return { status: 'healthy', message: 'Memory usage is normal' };
  } catch (error) {
    logger.error('Memory check failed:', error);
    return { status: 'degraded', message: 'Could not check memory usage' };
  }
}

async function runHealthChecks(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString();
  const results = await Promise.all([
    checkDatabase(),
    checkApi(),
    checkDiskSpace(),
    checkMemory(),
  ]);

  const checks = {
    database: { ...results[0], timestamp },
    api: { ...results[1], timestamp },
    diskSpace: { ...results[2], timestamp },
    memory: { ...results[3], timestamp },
  };

  const hasUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy');
  const hasDegraded = Object.values(checks).some((c) => c.status === 'degraded');

  const status = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  return { status, checks };
}

// Run health checks if this file is executed directly
if (require.main === module) {
  runHealthChecks()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.status === 'healthy' ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Error running health checks:', error);
      process.exit(1);
    });
}

export { runHealthChecks };
