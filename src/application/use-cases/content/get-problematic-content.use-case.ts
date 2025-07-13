import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable()
export class GetProblematicContentUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(threshold: number = 30) {
    try {
      if (threshold < 0 || threshold > 100) {
        throw new Error('El umbral debe estar entre 0 y 100');
      }

      logger.info(`Executing GetProblematicContentUseCase with threshold: ${threshold}`);
      return await this.contentService.findProblematicContent(threshold);
    } catch (error) {
      logger.error('Error in GetProblematicContentUseCase:', error);
      throw error;
    }
  }
}