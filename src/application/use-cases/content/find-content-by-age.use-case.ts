import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';

export class FindContentByAgeUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(age: number) {
    if (age === undefined || age === null) {
      throw new Error('La edad es requerida');
    }
    if (age < 0 || age > 120) {
      throw new Error('La edad debe estar entre 0 y 120 años');
    }
    return this.contentService.findContentByAge(age);
  }
}
