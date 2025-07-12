import 'dotenv/config';
import 'reflect-metadata';
import 'tsconfig-paths/register';
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { container } from './infrastructure/config/container';
import { env } from './shared/config/environment';
import { specs } from './infrastructure/config/swagger';
import { errorHandler } from './shared/middlewares/error.middleware';
import { logger } from './shared/utils/logger';
import { contentRouter } from './infrastructure/web/content/routes/content.routes';
import { authMiddleware } from './shared/middlewares/auth.middleware';
import { TYPES } from './shared/constants/types';
import { PrismaClient } from '@prisma/client';

// Initialize Express application
export const app = express();
const PORT = env.PORT;

// Basic middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({
    status: 'error',
    message: 'Too many requests, please try again later.'
  })
});

app.use(limiter);

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ 
    status: 'ok', 
    message: 'Content Service is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API version endpoint
app.get('/version', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    service: 'content-service',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version
  });
});

// Middleware de autenticación (solo verifica la existencia del token)
app.use(authMiddleware);

// API Routes
app.use(`${env.API_PREFIX}`, contentRouter);

// Manejador de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Ruta no encontrada',
  });
});

// Manejador de errores global
app.use(errorHandler);

// Initialize database connection and start server
const initServer = async () => {
  try {
    // Initialize Prisma client
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('🛑 Shutting down server...');
      
      // Close the server
      server.close(async () => {
        logger.info('👋 Server closed');
        
        // Close database connection
        await prisma.$disconnect();
        logger.info('👋 Database connection closed');
        
        process.exit(0);
      });

      // Force close server after 5 seconds
      setTimeout(() => {
        logger.error('⚠️ Forcing server shutdown');
        process.exit(1);
      }, 5000);
    };

    // Handle termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize the server and store it in a variable
const startServer = async () => {
  try {
    const server = await initServer();
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error(`Unhandled Rejection: ${reason.message}`);
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error(`Uncaught Exception: ${error.message}`);
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    logger.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
};

// Start the application
startServer().catch((error) => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});