import { ContentWithTopics, UserProgress, InteractionLog } from '@domain/entities/content.entity';

export interface IContentService {
  // Content operations
  findAllModules(): Promise<Array<{ id: string; name: string; }>>;
  findModuleById(moduleId: string): Promise<{ id: string; name: string; } | null>;
  findContentByTopic(topicId: string): Promise<ContentWithTopics[]>;
  findContentByAge(age: number): Promise<ContentWithTopics[]>;
  
  // Progress tracking
  trackUserProgress(progressData: {
    userId: string;
    contentId: string;
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress>;
  
  // Interaction logging
  logInteraction(interactionData: {
    userId: string;
    contentId: string;
    action: string;
    timestamp: Date;
    deviceType?: string;
    platformType?: string;
    metadata?: Record<string, any>;
    cameFrom?: 'home' | 'search' | 'recommendation' | 'topic';
    searchQuery?: string;
    topicId?: string;
    recommendationSource?: string;
  }): Promise<InteractionLog>;
  
  // Analytics
  getAbandonmentAnalytics(contentId: string): Promise<any>;
  getEffectivenessAnalytics(contentId: string): Promise<any>;
  identifyProblematicContent(threshold: number): Promise<any>;
}
