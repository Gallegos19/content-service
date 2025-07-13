import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';

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

@injectable()
export class TrackUserProgressUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(data: TrackUserProgressInput) {
    try {
      // Validaciones básicas
      if (!data.userId?.trim() || !data.contentId?.trim()) {
        throw new Error('userId y contentId son requeridos');
      }
      
      if (data.progressPercentage !== undefined && 
          (data.progressPercentage < 0 || data.progressPercentage > 100)) {
        throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
      }

      if (data.completionRating !== undefined &&
          (data.completionRating < 1 || data.completionRating > 5)) {
        throw new Error('La calificación debe estar entre 1 y 5');
      }

      if (data.timeSpentSeconds !== undefined && data.timeSpentSeconds < 0) {
        throw new Error('El tiempo dedicado no puede ser negativo');
      }

      if (data.lastPositionSeconds !== undefined && data.lastPositionSeconds < 0) {
        throw new Error('La última posición no puede ser negativa');
      }

      logger.info(`Executing TrackUserProgressUseCase for user ${data.userId} and content ${data.contentId}`);
      return await this.contentService.trackUserProgress(data);
    } catch (error) {
      logger.error('Error in TrackUserProgressUseCase:', error);
      throw error;
    }
  }
}
