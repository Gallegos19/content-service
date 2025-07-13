import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable()
export class GetUserProgressUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(userId: string) {
    try {
      if (!userId?.trim()) {
        throw new Error('userId es requerido');
      }

      logger.info(`Executing GetUserProgressUseCase for user: ${userId}`);
      return await this.contentService.getUserProgress(userId);
    } catch (error) {
      logger.error(`Error in GetUserProgressUseCase for user ${userId}:`, error);
      throw error;
    }
  }
}