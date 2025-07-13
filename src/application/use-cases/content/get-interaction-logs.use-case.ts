import { inject, injectable } from 'inversify';
import { IContentInteractionLogService } from '@domain/services/contentInteractionLog.service';
import { ContentInteractionLog } from '@domain/index';

export class GetInteractionLogsUseCase {
  constructor(
    @inject('IContentInteractionLogService')
    private readonly service: IContentInteractionLogService
  ) {}

  async execute(contentId: string): Promise<ContentInteractionLog[]> {
    if (!contentId) {
      throw new Error('Content ID is required');
    }

    return this.service.getLogsByContentId(contentId);
  }
}
