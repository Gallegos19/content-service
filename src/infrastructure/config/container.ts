import { Container } from 'inversify';
import { TYPES } from '@shared/constants/types';
import { Logger } from 'winston';
import { logger } from '@shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@infrastructure/database/database.utils';

// Repositories - Infrastructure
import { ContentRepository } from '@infrastructure/database/repositories/content.repository';
import { ContentTopicRepository } from '@infrastructure/database/repositories/contentTopic.repository';
import { ContentAnalyticsRepository } from '@infrastructure/database/repositories/contentAnalitycs.repository';
import { ContentProgressRepository } from '@infrastructure/database/repositories/contentProgress.repository';
import { ContentInteractionLogRepository } from '@infrastructure/database/repositories/contentInteractionLog.repository';
import { UserTipsHistoryRepository } from '@infrastructure/database/repositories/userTipsHistory.repository';
import { TipsRepository } from '@infrastructure/database/repositories/tips.repository';
import { TopicRepository } from '@infrastructure/database/repositories/topic.repository';

// Domain Interfaces
import { IContentRepository } from '@domain/repositories/content.repository';
import { IContentTopicRepository } from '@domain/repositories/contentTopic.repository';
import { IContentAnalyticsRepository } from '@domain/repositories/contentAnalytics.repository';
import { IContentProgressRepository } from '@domain/repositories/contentProgress.repository';
import { IContentInteractionLogRepository } from '@domain/repositories/contentInteractionLog.repository';
import { IUserTipsHistoryRepository } from '@domain/repositories/userTipsHistory.repository';
import { ITipsRepository } from '@domain/repositories/tips.repository';
import { ITopicRepository } from '@domain/repositories/topic.repository';

// Services
import { ContentService } from '@domain/services/content.service';

// Controllers
import { ContentController } from '@infrastructure/web/content/controllers/content.controller';

const container = new Container();

// ===== PRISMA CLIENT =====
container.bind<PrismaClient>(TYPES.PrismaClient)
  .toConstantValue(prisma);

// ===== REPOSITORIES =====

// Content Repository (main one)
container.bind<IContentRepository>(TYPES.ContentRepository)
  .to(ContentRepository)
  .inSingletonScope();

// Specialized Repositories
container.bind<IContentTopicRepository>(TYPES.ContentTopicRepository)
  .to(ContentTopicRepository)
  .inSingletonScope();

container.bind<IContentAnalyticsRepository>(TYPES.ContentAnalyticsRepository)
  .to(ContentAnalyticsRepository)
  .inSingletonScope();

container.bind<IContentProgressRepository>(TYPES.ContentProgressRepository)
  .to(ContentProgressRepository)
  .inSingletonScope();

container.bind<IContentInteractionLogRepository>(TYPES.ContentInteractionLogRepository)
  .to(ContentInteractionLogRepository)
  .inSingletonScope();

container.bind<IUserTipsHistoryRepository>(TYPES.UserTipsHistoryRepository)
  .to(UserTipsHistoryRepository)
  .inSingletonScope();

container.bind<ITipsRepository>(TYPES.TipsRepository)
  .to(TipsRepository)
  .inSingletonScope();

container.bind<ITopicRepository>(TYPES.TopicRepository)
  .to(TopicRepository)
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