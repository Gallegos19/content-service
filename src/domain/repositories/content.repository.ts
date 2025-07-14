import { PaginatedResult } from '@shared/constants/types';
import { 
  Content, 
  ContentAnalytics, 
  ContentFilters, 
  ContentWithTopics, 
  UserProgress, 
  AbandonmentAnalytics, 
  ProblematicContent, 
  ContentInteractionLog,
  Tip,
  Topic,
  Module,
  EffectivenessAnalytics,
} from '../entities/content.entity';

export interface IContentRepository {
  // Content CRUD operations
  create(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { topic_ids?: string[] }): Promise<Content>;
  findById(id: string): Promise<ContentWithTopics | null>;
  findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>>;
  update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { topic_ids?: string[] }
  ): Promise<ContentWithTopics>;
  delete(id: string): Promise<boolean>;

  // Content-Topic relationship
  addTopicToContent(contentId: string, topicId: string, isPrimary: boolean): Promise<void>;
  removeTopicFromContent(contentId: string, topicId: string): Promise<void>;
  setPrimaryTopic(contentId: string, topicId: string): Promise<void>;

  // Content progress tracking
  getUserProgress(userId: string, contentId: string): Promise<UserProgress | null>;
  trackProgress(userId: string, contentId: string, data: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress>;

  // Content discovery
  findContentByTopic(topicId: string): Promise<ContentWithTopics[]>;
  findContentByAge(age: number): Promise<ContentWithTopics[]>;
  findFeaturedContent(limit = 10): Promise<ContentWithTopics[]>;
  findRelatedContent(contentId: string, limit = 5): Promise<ContentWithTopics[]>;

  // User progress
  getUserProgressHistory(userId: string): Promise<UserProgress[]>;
  getCompletedContent(userId: string): Promise<ContentWithTopics[]>;
  getInProgressContent(userId: string): Promise<ContentWithTopics[]>;

  // Analytics
  getContentAnalytics(contentId: string): Promise<ContentAnalytics>;
  getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics>;
  getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics>;
  findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]>;

  findAllModules(): Promise<Array<{ id: string; name: string }>>;
  findModuleById(id: string): Promise<{ id: string; name: string } | null>;
  
  // Bulk operations
  bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void>;
  
  bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void>;
}