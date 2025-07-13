import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { ContentWithTopics } from '@domain/index';
import { logger } from '@shared/utils/logger';

@injectable()
export class FindContentByAgeUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(age: number): Promise<ContentWithTopics[]> {
    try {
      if (age === undefined || age === null) {
        throw new Error('La edad es requerida');
      }
      if (age < 0 || age > 120) {
        throw new Error('La edad debe estar entre 0 y 120 años');
      }

      logger.info(`Executing FindContentByAgeUseCase for age: ${age}`);
      return await this.contentService.findContentByAge(age);
    } catch (error) {
      logger.error(`Error in FindContentByAgeUseCase for age ${age}:`, error);
      throw error;
    }
  }
}