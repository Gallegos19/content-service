import { PaginatedResult } from '@shared/constants/types';
import { Content, ContentAnalytics, ContentFilters, ContentWithTopics, UserProgress, AbandonmentAnalytics, EffectivenessAnalytics, ProblematicContent, InteractionLog, Tip, Topic } from '../entities/content.entity';

export interface IContentRepository {
  // Content CRUD operations
  findById(id: string): Promise<ContentWithTopics | null>;
  findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>>;
  create(data: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Content>;
  update(id: string, data: Partial<Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Content>;
  delete(id: string): Promise<boolean>;
  
  // Content-Topic relationship
  addTopicToContent(contentId: string, topicId: string, isPrimary?: boolean): Promise<void>;
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
  
  // Analytics
  getContentAnalytics(contentId: string): Promise<ContentAnalytics>;
  getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics>;
  getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics>;
  findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]>;
  
  // Interaction logging
  logInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog>;
  getUserInteractions(userId: string, contentId?: string): Promise<ContentInteractionLog[]>;
  getContentInteractions(contentId: string, action?: string): Promise<ContentInteractionLog[]>;
  trackInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog>;
  
  // Content discovery
  findContentByTopic(topicId: string): Promise<ContentWithTopics[]>;
  findContentByAge(age: number): Promise<ContentWithTopics[]>;
  findFeaturedContent(limit?: number): Promise<ContentWithTopics[]>;
  findRelatedContent(contentId: string, limit?: number): Promise<ContentWithTopics[]>;
  
  // User progress
  getUserProgressHistory(userId: string): Promise<UserProgress[]>;
  getCompletedContent(userId: string): Promise<ContentWithTopics[]>;
  getInProgressContent(userId: string): Promise<ContentWithTopics[]>;
  
  // Topic operations
  getAllTopics(): Promise<Topic[]>;
  createTopic(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Topic>;
  getTopicById(id: string): Promise<Topic | null>;
  updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Topic>;
  deleteTopic(id: string): Promise<boolean>;
  
  // Tip operations
  getAllTips(): Promise<Tip[]>;
  createTip(data: Omit<Tip, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Tip>;
  getTipById(id: string): Promise<Tip | null>;
  updateTip(id: string, data: Partial<Omit<Tip, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Tip>;
  deleteTip(id: string): Promise<boolean>;
  findTopics(): Promise<Array<{ id: string; name: string; }>>;
  findTopicById(id: string): Promise<{ id: string; name: string; } | null>;
  
  // Bulk operations
  bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void>;
  
  bulkLogInteractions(interactions: Array<Omit<InteractionLog, 'id' | 'actionTimestamp'>>): Promise<void>;
}
