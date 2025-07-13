import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { ContentWithTopics } from '@domain/entities/content.entity';

@injectable()
export class FindAllModulesUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(): Promise<Array<{ id: string; name: string }>> {
    try {
      logger.info('Executing FindAllModulesUseCase');
      return await this.contentService.findAllModules();
    } catch (error) {
      logger.error('Error in FindAllModulesUseCase:', error);
      throw error;
    }
  }
}