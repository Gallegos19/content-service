import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable()
export class GetEffectivenessAnalyticsUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(topicId: string) {
    try {
      if (!topicId?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Executing GetEffectivenessAnalyticsUseCase for topic: ${topicId}`);
      return await this.contentService.getEffectivenessAnalytics(topicId);
    } catch (error) {
      logger.error(`Error in GetEffectivenessAnalyticsUseCase for topic ${topicId}:`, error);
      throw error;
    }
  }
}