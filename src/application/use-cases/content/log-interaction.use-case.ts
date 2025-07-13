import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { InteractionAction, DeviceType, PlatformType } from '@domain/enums/content.enum';
import { logger } from '@shared/utils/logger';

export interface LogInteractionInput {
  userId: string;
  contentId: string;
  action: InteractionAction;
  timestamp?: Date;
  deviceType?: DeviceType;
  platformType?: PlatformType;
  metadata?: Record<string, any>;
  cameFrom?: 'home' | 'search' | 'recommendation' | 'topic';
  searchQuery?: string;
  topicId?: string;
  recommendationSource?: string;
  sessionId?: string;
  progressAtAction?: number | null;
  timeSpentSeconds?: number;
}

@injectable()
export class LogInteractionUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(data: LogInteractionInput) {
    try {
      // Validaciones básicas
      if (!data.userId?.trim() || !data.contentId?.trim() || !data.action) {
        throw new Error('userId, contentId y action son requeridos');
      }

      if (data.progressAtAction !== undefined && data.progressAtAction !== null &&
          (data.progressAtAction < 0 || data.progressAtAction > 100)) {
        throw new Error('El progreso de la acción debe estar entre 0 y 100');
      }

      if (data.timeSpentSeconds !== undefined && data.timeSpentSeconds < 0) {
        throw new Error('El tiempo dedicado no puede ser negativo');
      }

      const interactionData = {
        ...data,
        timestamp: data.timestamp || new Date(),
        platform: data.platformType ?? null,  // Map platformType to platform and handle undefined
        abandonmentReason: null,      // Add required field with default value
        sessionId: data.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progressAtAction: data.progressAtAction ?? null,  // Convert undefined to null
        timeSpentSeconds: data.timeSpentSeconds ?? null,  // Convert undefined to null
        deviceType: data.deviceType ?? null,  // Convert undefined to null
        cameFrom: data.cameFrom ?? null,  // Convert undefined to null
        metadata: data.metadata ?? null,  // Convert undefined to null
        platformType: undefined       // Remove the incorrect field
      };

      logger.info(`Executing LogInteractionUseCase for user ${data.userId} and content ${data.contentId}`);
      return await this.contentService.logInteraction(interactionData);
    } catch (error) {
      logger.error('Error in LogInteractionUseCase:', error);
      throw error;
    }
  }
}