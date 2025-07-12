import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';

export interface TrackUserProgressInput {
  userId: string;
  contentId: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage?: number;
  timeSpentSeconds?: number;
  lastPositionSeconds?: number;
  completionRating?: number;
  completionFeedback?: string;
}

export class TrackUserProgressUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(data: TrackUserProgressInput) {
    if (!data.userId || !data.contentId) {
      throw new Error('userId y contentId son requeridos');
    }
    
    if (data.progressPercentage !== undefined && 
        (data.progressPercentage < 0 || data.progressPercentage > 100)) {
      throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
    }

    return this.contentService.trackUserProgress(data);
  }
}
