import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { InteractionAction, DeviceType, PlatformType } from '@domain/enums/content.enum';

export interface LogInteractionInput {
  userId: string;
  contentId: string;
  action: InteractionAction;
  timestamp: Date;
  deviceType?: DeviceType;
  platformType?: PlatformType;
  metadata?: Record<string, any>;
  cameFrom?: 'home' | 'search' | 'recommendation' | 'topic';
  searchQuery?: string;
  topicId?: string;
  recommendationSource?: string;
}

export class LogInteractionUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(data: LogInteractionInput) {
    if (!data.userId || !data.contentId || !data.action) {
      throw new Error('userId, contentId y action son requeridos');
    }

    return this.contentService.logInteraction({
      ...data,
      timestamp: data.timestamp || new Date()
    });
  }
}
