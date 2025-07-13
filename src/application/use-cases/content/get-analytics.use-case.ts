import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable ()
export class  GetAbandonmentAnalyticsUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(contentId: string) {
    try {
      if (!contentId?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Executing GetAbandonmentAnalyticsUseCase for content: ${contentId}`);
      return await this.contentService.getAbandonmentAnalytics(contentId);
    } catch (error) {
      logger.error(`Error in GetAbandonmentAnalyticsUseCase for content ${contentId}:`, error);
      throw error;
    }
  }
}