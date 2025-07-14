import { Container } from 'inversify';
import { TYPES } from '@shared/constants/types';
import { Logger } from 'winston';
import { logger } from '@shared/utils/logger';

// Repositories
import { ContentRepository } from '@infrastructure/database/repositories/content.repository';
import { ContentTopicRepository } from '@infrastructure/database/repositories/contentTopic.repository';
import { ModuleRepository } from '@infrastructure/database/repositories/module.repository';
import { ContentAnalyticsRepository } from '@infrastructure/database/repositories/contentAnalytics.repository';
import { ContentProgressRepository } from '@infrastructure/database/repositories/contentProgress.repository';
import { ContentInteractionRepository } from '@infrastructure/database/repositories/contentInteraction.repository';
import { UserTipsHistoryRepository } from '@infrastructure/database/repositories/userTipsHistory.repository';
import { TipsRepository } from '@infrastructure/database/repositories/tips.repository';
import { TopicRepository } from '@infrastructure/database/repositories/topic.repository';

// Domain Interfaces
import { IContentRepository } from '@domain/repositories/content.repository';
import { IContentTopicRepository } from '@domain/repositories/contentTopic.repository';
import { IModuleRepository } from '@domain/repositories/module.repository';
import { IContentAnalyticsRepository } from '@domain/repositories/contentAnalytics.repository';
import { IContentProgressRepository } from '@domain/repositories/contentProgress.repository';
import { IContentInteractionRepository } from '@domain/repositories/contentInteraction.repository';
import { IUserTipsHistoryRepository } from '@domain/repositories/userTipsHistory.repository';
import { ITipsRepository } from '@domain/repositories/tips.repository';
import { ITopicRepository } from '@domain/repositories/topic.repository';

const container = new Container();

// Bind repositories
container.bind<IContentRepository>(TYPES.ContentRepository)
  .to(ContentRepository)
  .inSingletonScope();

container.bind<IContentTopicRepository>(TYPES.ContentTopicRepository)
  .to(ContentTopicRepository);

container.bind<IModuleRepository>(TYPES.ModuleRepository)
  .to(ModuleRepository)
  .inSingletonScope();

container.bind<IContentAnalyticsRepository>(TYPES.ContentAnalyticsRepository)
  .to(ContentAnalyticsRepository)
  .inSingletonScope();

container.bind<IContentProgressRepository>(TYPES.ContentProgressRepository)
  .to(ContentProgressRepository)
  .inSingletonScope();

container.bind<IContentInteractionRepository>(TYPES.ContentInteractionRepository)
  .to(ContentInteractionRepository)
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

// Bind logger
container.bind<Logger>(TYPES.Logger)
  .toConstantValue(logger);

export { container };