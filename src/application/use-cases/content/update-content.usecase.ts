import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '@shared/constants/types';
import { UpdateContentDto } from '@application/dtos/content.dto';

@injectable()
export class UpdateContentUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(id: string, data: UpdateContentDto) {
    return this.contentService.updateContent(id, data);
  }
}
