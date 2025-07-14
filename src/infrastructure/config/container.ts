// src/infrastructure/config/container.ts

import { Container } from 'inversify';
import { TYPES } from '@shared/constants/types';
import { Logger } from 'winston';
import { logger } from '@shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@infrastructure/database/database.utils';

// Repositories - Infrastructure
import { ContentRepository } from '@infrastructure/database/repositories/content.repository';

// Domain Interfaces
import { IContentRepository } from '@domain/repositories/content.repository';

// Services
import { ContentService } from '@domain/services/content.service';

// Controllers
import { ContentController } from '@infrastructure/web/content/controllers/content.controller';

const container = new Container();

// ===== PRISMA CLIENT =====
container.bind<PrismaClient>(TYPES.PrismaClient)
  .toConstantValue(prisma);

// ===== REPOSITORIES =====
container.bind<IContentRepository>(TYPES.ContentRepository)
  .to(ContentRepository)
  .inSingletonScope();

// ===== SERVICES =====
container.bind<ContentService>(TYPES.ContentService)
  .to(ContentService)
  .inSingletonScope();

// ===== CONTROLLERS =====
container.bind<ContentController>(TYPES.ContentController)
  .to(ContentController)
  .inSingletonScope();

// ===== UTILITIES =====
container.bind<Logger>(TYPES.Logger)
  .toConstantValue(logger);

// ===== CONTAINER VALIDATION =====
export const validateContainer = (): boolean => {
  try {
    // Test critical dependencies
    container.get<PrismaClient>(TYPES.PrismaClient);
    container.get<IContentRepository>(TYPES.ContentRepository);
    container.get<ContentService>(TYPES.ContentService);
    container.get<ContentController>(TYPES.ContentController);
    
    logger.info('✅ Container validation successful');
    return true;
  } catch (error) {
    logger.error('❌ Container validation failed:', error);
    return false;
  }
};

// ===== CONTAINER CLEANUP =====
export const cleanupContainer = async (): Promise<void> => {
  try {
    // Disconnect Prisma
    const prismaClient = container.get<PrismaClient>(TYPES.PrismaClient);
    await prismaClient.$disconnect();
    
    // Clear container bindings
    container.unbindAll();
    
    logger.info('✅ Container cleanup completed');
  } catch (error) {
    logger.error('❌ Error during container cleanup:', error);
    throw error;
  }
};

export { container };