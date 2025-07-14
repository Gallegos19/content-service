import { ContentInteractionLog } from '@domain/entities/content.entity';

export interface IContentInteractionRepository {
  create(data: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog>;
  findById(id: string): Promise<ContentInteractionLog | null>;
  findAll(): Promise<ContentInteractionLog[]>;
  findByContentId(contentId: string): Promise<ContentInteractionLog[]>;
  findByUserId(userId: string): Promise<ContentInteractionLog[]>;
  update(id: string, data: Partial<ContentInteractionLog>): Promise<ContentInteractionLog>;
  delete(id: string): Promise<boolean>;
}