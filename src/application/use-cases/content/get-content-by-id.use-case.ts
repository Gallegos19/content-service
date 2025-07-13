import { Content, ContentService } from "@domain/index";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";

@injectable()
export class GetContentByIdUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(id: string): Promise<Content | null> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Executing GetContentByIdUseCase for content: ${id}`);
      return await this.contentService.getContentById(id);
    } catch (error) {
      logger.error(`Error in GetContentByIdUseCase for content ${id}:`, error);
      throw error;
    }
  }
}