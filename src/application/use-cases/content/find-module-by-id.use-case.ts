import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';

@injectable()
export class FindModuleByIdUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(moduleId: string): Promise<{ id: string; name: string } | null> {
    try {
      if (!moduleId?.trim()) {
        throw new Error('ID del módulo es requerido');
      }

      logger.info(`Executing FindModuleByIdUseCase for module: ${moduleId}`);
      return await this.contentService.findModuleById(moduleId);
    } catch (error) {
      logger.error(`Error in FindModuleByIdUseCase for module ${moduleId}:`, error);
      throw error;
    }
  }
}
