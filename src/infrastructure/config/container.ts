import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';

// Domain Services
import { ContentService } from '@domain/services/content.service';

// Infrastructure Repositories
import { ContentRepository } from '../database/repositories/content.repository';

// Domain Interfaces
import { IContentRepository } from '@domain/repositories/content.repository';

// Use Cases
import {
  FindAllModulesUseCase,
  FindModuleByIdUseCase,
  FindContentByTopicUseCase,
  FindContentByAgeUseCase,
  TrackUserProgressUseCase,
  LogInteractionUseCase,
  UpdateContentUseCase
} from '@application/use-cases/content';

// Controllers
import { ContentController } from '../web/content/controllers/content.controller';

// Shared
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { Logger } from 'winston';

const container = new Container();

// Logger (singleton)
container.bind(TYPES.Logger).toConstantValue(logger);

// Database - Prisma Client (singleton)
container.bind<PrismaClient>(TYPES.PrismaClient)
  .toDynamicValue(() => {
    const prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Set up event listeners
    prisma.$on('warn', (e) => {
      logger.warn(`Prisma Warning: ${e.message}`);
    });

    prisma.$on('info', (e) => {
      logger.info(`Prisma Info: ${e.message}`);
    });

    prisma.$on('error', (e) => {
      logger.error(`Prisma Error: ${e.message}`);
    });

    return prisma;
  })
  .inSingletonScope();

// Repositories
container.bind<IContentRepository>(TYPES.ContentRepository)
  .to(ContentRepository)
  .inSingletonScope();

// Domain Services
container.bind<ContentService>(TYPES.ContentService)
  .to(ContentService)
  .inSingletonScope();

// Use Cases - Request scoped for better performance and isolation
container.bind<FindAllModulesUseCase>(TYPES.FindAllModulesUseCase)
  .to(FindAllModulesUseCase)
  .inRequestScope();

container.bind<FindModuleByIdUseCase>(TYPES.FindModuleByIdUseCase)
  .to(FindModuleByIdUseCase)
  .inRequestScope();

container.bind<FindContentByTopicUseCase>(TYPES.FindContentByTopicUseCase)
  .to(FindContentByTopicUseCase)
  .inRequestScope();

container.bind<FindContentByAgeUseCase>(TYPES.FindContentByAgeUseCase)
  .to(FindContentByAgeUseCase)
  .inRequestScope();

container.bind<TrackUserProgressUseCase>(TYPES.TrackUserProgressUseCase)
  .to(TrackUserProgressUseCase)
  .inRequestScope();

container.bind<LogInteractionUseCase>(TYPES.LogInteractionUseCase)
  .to(LogInteractionUseCase)
  .inRequestScope();

container.bind<UpdateContentUseCase>(TYPES.UpdateContentUseCase)
  .to(UpdateContentUseCase)
  .inRequestScope();

// Controllers - Request scoped
container.bind<ContentController>(TYPES.ContentController)
  .to(ContentController)
  .inRequestScope();

// Export container instance
export { container };

// Health check function for the container
export const validateContainer = (): boolean => {
  try {
    // Test basic bindings
    const logger = container.get<Logger>(TYPES.Logger);
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    const contentRepository = container.get<IContentRepository>(TYPES.ContentRepository);
    const contentService = container.get<ContentService>(TYPES.ContentService);
    const contentController = container.get<ContentController>(TYPES.ContentController);

    // Validate that all dependencies are properly injected
    if (!logger || !prisma || !contentRepository || !contentService || !contentController) {
      return false;
    }

    logger.info('Container validation successful - all dependencies are properly bound');
    return true;
  } catch (error) {
    logger.error('Container validation failed:', error);
    return false;
  }
};

// Cleanup function for graceful shutdown
export const cleanupContainer = async (): Promise<void> => {
  try {
    const prisma = container.get<PrismaClient>(TYPES.PrismaClient);
    await prisma.$disconnect();
    logger.info('👋 Container cleanup completed');
  } catch (error) {
    logger.error('Error during container cleanup:', error);
    throw error;
  }
};