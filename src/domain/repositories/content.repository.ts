// src/domain/repositories/content.repository.ts

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
  EffectivenessAnalytics,
} from '../entities/content.entity';

export interface IContentRepository {
  // ===== CONTENT CRUD OPERATIONS =====
  create(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { topic_ids?: string[] }): Promise<Content>;
  findById(id: string): Promise<ContentWithTopics | null>;
  findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>>;
  update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { topic_ids?: string[] }
  ): Promise<ContentWithTopics>;
  delete(id: string): Promise<boolean>;

  // ===== CONTENT-TOPIC RELATIONSHIP =====
  addTopicToContent(contentId: string, topicId: string, isPrimary: boolean): Promise<void>;
  removeTopicFromContent(contentId: string, topicId: string): Promise<void>;
  setPrimaryTopic(contentId: string, topicId: string): Promise<void>;

  // ===== CONTENT PROGRESS TRACKING =====
  getUserProgress(userId: string, contentId: string): Promise<UserProgress | null>;
  trackProgress(userId: string, contentId: string, data: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress>;

  // ===== INTERACTION LOGGING =====
  logInteraction(interactionData: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog>;

  // ===== CONTENT DISCOVERY =====
  findContentByTopic(topicId: string): Promise<ContentWithTopics[]>;
  findContentByAge(age: number): Promise<ContentWithTopics[]>;
  findFeaturedContent(limit?: number): Promise<ContentWithTopics[]>;
  findRelatedContent(contentId: string, limit?: number): Promise<ContentWithTopics[]>;

  // ===== USER PROGRESS =====
  getUserProgressHistory(userId: string): Promise<UserProgress[]>;
  getCompletedContent(userId: string): Promise<ContentWithTopics[]>;
  getInProgressContent(userId: string): Promise<ContentWithTopics[]>;

  // ===== ANALYTICS =====
  getContentAnalytics(contentId: string): Promise<ContentAnalytics>;
  getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics>;
  getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics>;
  findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]>;

  // ===== MODULE OPERATIONS =====
  findAllModules(): Promise<Array<{ id: string; name: string }>>;
  findModuleById(id: string): Promise<{ id: string; name: string } | null>;
  
  // ===== BULK OPERATIONS =====
  bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void>;
  
  bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void>;
}