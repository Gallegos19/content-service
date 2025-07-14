import { ContentProgress } from '@prisma/client';

export interface IContentProgressRepository {
  create(progress: Omit<ContentProgress, 'id' | 'created_at'>): Promise<ContentProgress>;
  findByContentId(contentId: string): Promise<ContentProgress[]>;
  findByUserId(userId: string): Promise<ContentProgress[]>;
  updateProgress(id: string, progress: Partial<ContentProgress>): Promise<ContentProgress>;
}
