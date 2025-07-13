import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable()
export class DeleteContentUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Executing DeleteContentUseCase for content: ${id}`);
      await this.contentService.deleteContent(id);
    } catch (error) {
      logger.error(`Error in DeleteContentUseCase for content ${id}:`, error);
      throw error;
    }
  }
}