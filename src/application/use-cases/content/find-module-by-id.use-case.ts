import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';

export class FindModuleByIdUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(moduleId: string) {
    if (!moduleId) {
      throw new Error('ID del módulo es requerido');
    }
    return this.contentService.findModuleById(moduleId);
  }
}
