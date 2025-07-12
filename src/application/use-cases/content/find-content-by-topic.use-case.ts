import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';

export class FindContentByTopicUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(topicId: string) {
    if (!topicId) {
      throw new Error('ID del tema es requerido');
    }
    return this.contentService.findContentByTopic(topicId);
  }
}
