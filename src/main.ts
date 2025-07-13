import 'dotenv/config';
import 'reflect-metadata';
import 'tsconfig-paths/register';
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

// Infrastructure
import { container, validateContainer, cleanupContainer } from './infrastructure/config/container';
import { specs } from './infrastructure/config/swagger';
import { contentRouter } from './infrastructure/web/content/routes/content.routes';

// Shared
import { env } from './shared/config/environment';
import { errorHandler } from './shared/middlewares/error.middleware';
import { authMiddleware } from './shared/middlewares/auth.middleware';
import { logger } from './shared/utils/logger';
import { TYPES } from './shared/constants/types';

// Types
import { PrismaClient } from '@prisma/client';

// Initialize Express application
export const app = express();
const PORT = env.PORT;

// ===== MIDDLEWARE SETUP =====

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow all origins (use only for development)
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middlewares
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes, por favor intente más tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health' || req.path === '/version'
});

app.use(limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// ===== DOCUMENTATION =====
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Content Service API Documentation'
}));

// ===== HEALTH CHECK ENDPOINTS =====
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(StatusCodes.OK).json({ 
      status: 'ok', 
      service: 'content-service',
      message: 'Content Service is running',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'error',
      service: 'content-service',
      message: 'Service is not healthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Detailed health check endpoint
app.get('/health/detailed', async (_req: Request, res: Response) => {
  try {
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    
    // Check database
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbStart;
    
    // Check container
    const containerHealthy = validateContainer();
    
    res.status(StatusCodes.OK).json({
      status: 'ok',
      service: 'content-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      checks: {
        database: {
          status: 'ok',
          responseTime: `${dbDuration}ms`
        },
        container: {
          status: containerHealthy ? 'ok' : 'error'
        },
        memory: {
          used: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'error',
      service: 'content-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API version endpoint
app.get('/version', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    service: 'content-service',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    environment: env.NODE_ENV,
    buildDate: new Date().toISOString()
  });
});

// ===== AUTHENTICATION MIDDLEWARE =====
// Apply auth middleware to all API routes except health checks and docs
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip auth for specific routes
  const skipAuthRoutes = ['/health', '/health/detailed', '/version', '/api-docs'];
  const shouldSkipAuth = skipAuthRoutes.some(route => req.path.startsWith(route));
  
  if (shouldSkipAuth) {
    return next();
  }
  
  return authMiddleware(req, res, next);
});

// ===== API ROUTES =====
app.use(`${env.API_PREFIX}`, contentRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    service: 'content-service',
    message: 'Content Service API is running',
    documentation: '/api-docs',
    health: '/health',
    version: '/version'
  });
});

// ===== ERROR HANDLING =====

// Handle 404 - Route not found
app.use((req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Ruta no encontrada',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// ===== SERVER INITIALIZATION =====

/**
 * Initialize the database connection
 */
const initDatabase = async (): Promise<void> => {
  try {
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    await prisma.$connect();
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    
    logger.info('✅ Database connection established successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Initialize the application
 */
const initApp = async () => {
  try {
    // Validate container
    if (!validateContainer()) {
      throw new Error('Container validation failed');
    }
    
    // Initialize database
    await initDatabase();
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Content Service started successfully`);
      logger.info(`📊 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
      logger.info(`🔧 API Prefix: ${env.API_PREFIX}`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('👋 HTTP server closed');
        
        try {
          // Clean up container (closes database connections)
          await cleanupContainer();
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error('⚠️ Forcing shutdown due to timeout');
        process.exit(1);
      }, 10000); // 10 seconds timeout
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

// ===== PROCESS ERROR HANDLING =====

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  logger.error('🔥 Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  // In production, you might want to exit the process
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('🔥 Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Handle warning events
process.on('warning', (warning) => {
  logger.warn('⚠️ Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// ===== START APPLICATION =====

// Only start the server if this file is run directly
if (require.main === module) {
  initApp().catch((error) => {
    logger.error('❌ Fatal error during startup:', error);
    process.exit(1);
  });
}

// Export for testing
export default app;