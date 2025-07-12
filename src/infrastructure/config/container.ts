import 'reflect-metadata';
import { Container } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { ContentService } from '@domain/services/content.service';
import { PrismaContentRepository } from '../database/repositories/prisma-content.repository';
import { IContentRepository } from '@domain/repositories/content.repository';
import {
  FindAllModulesUseCase,
  FindModuleByIdUseCase,
  FindContentByTopicUseCase,
  FindContentByAgeUseCase,
  TrackUserProgressUseCase,
  LogInteractionUseCase
} from '@application/use-cases/content';
import { ContentController } from '../web/content/controllers/content.controller';
import { TYPES } from '@shared/constants/types';

const container = new Container();

// Prisma Client (singleton)
container.bind<PrismaClient>(TYPES.PrismaClient)
  .toDynamicValue(() => new PrismaClient())
  .inSingletonScope();

// Repositories
container.bind<IContentRepository>(TYPES.ContentRepository)
  .to(PrismaContentRepository)
  .inSingletonScope();

// Services
container.bind<ContentService>(TYPES.ContentService)
  .to(ContentService)
  .inSingletonScope();

// Use Cases
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

// Controllers
container.bind<ContentController>(TYPES.ContentController)
  .to(ContentController)
  .inRequestScope();

container.bind<TrackUserProgressUseCase>(TYPES.TrackUserProgressUseCase)
  .to(TrackUserProgressUseCase)
  .inRequestScope();

container.bind<LogInteractionUseCase>(TYPES.LogInteractionUseCase)
  .to(LogInteractionUseCase)
  .inRequestScope();

export { container };
