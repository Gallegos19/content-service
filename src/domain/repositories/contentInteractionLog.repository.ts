import { ContentInteractionLog } from "@prisma/client";

export interface IContentInteractionLogRepository {
  create(log: Omit<ContentInteractionLog, 'id' | 'created_at'>): Promise<ContentInteractionLog>;
  findByContentId(contentId: string): Promise<ContentInteractionLog[]>;
  findByUserId(userId: string): Promise<ContentInteractionLog[]>;
}
