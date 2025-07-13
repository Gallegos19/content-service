import { inject, injectable } from 'inversify';
import { IContentInteractionLogRepository } from '../../domain/repositories/contentInteractionLog.repository';
import { ContentInteractionLog } from '../../domain/entities/contentInteractionLog.entity';

export interface IContentInteractionLogService {
  getLogsByContentId(contentId: string): Promise<ContentInteractionLog[]>;
}

@injectable()
export class ContentInteractionLogService implements IContentInteractionLogService {
  constructor(
    @inject('IContentInteractionLogRepository')
    private readonly repository: IContentInteractionLogRepository
  ) {}

  async getLogsByContentId(contentId: string): Promise<ContentInteractionLog[]> {
    try {
      return await this.repository.findLogsByContentId(contentId);
    } catch (error) {
      throw new Error(`Failed to get interaction logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
