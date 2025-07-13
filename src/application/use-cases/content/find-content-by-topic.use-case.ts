import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { ContentWithTopics } from '@domain/index';

@injectable()
export class FindContentByTopicUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(topicId: string): Promise<ContentWithTopics[]> {
    try {
      if (!topicId?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Executing FindContentByTopicUseCase for topic: ${topicId}`);
      return await this.contentService.findContentByTopic(topicId);
    } catch (error) {
      logger.error(`Error in FindContentByTopicUseCase for topic ${topicId}:`, error);
      throw error;
    }
  }
}