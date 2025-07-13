import { ContentInteractionLog } from '../entities/content.entity';
import { Content, ContentWithTopics, ProblematicContent, UserProgress } from '../entities';
import { AbandonmentAnalytics, EffectivenessAnalytics } from '../entities';
import { ContentType } from '@prisma/client';

export interface IContentService {
  // Content operations
  createContent(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { metadata?: Record<string, any> | null }): Promise<ContentWithTopics>;
  getContentById(id: string): Promise<ContentWithTopics | null>;
  updateContent(id: string, data: Partial<Omit<Content, 'id'>> & { metadata?: Record<string, any> | null }): Promise<ContentWithTopics>;
  deleteContent(id: string): Promise<void>;

  // Interaction logging
  logInteraction(interactionData: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog>;

  // ... other methods ...
}
