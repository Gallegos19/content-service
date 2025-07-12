import { inject, injectable } from 'inversify';
import { IContentService } from '@application/ports/content.service.port';
import { TYPES } from '@shared/constants/types';
import { IContentRepository } from '@domain/repositories/content.repository';
import { logger } from '@shared/utils/logger';
import { 
  Content, 
  ContentWithTopics, 
  Topic, 
  Tip, 
  ContentAnalytics, 
  AbandonmentAnalytics, 
  EffectivenessAnalytics, 
  ProblematicContent, 
  UserProgress, 
  ContentInteractionLog,
  InteractionAction,
  DeviceType,
  PlatformType,
  AbandonmentReason,
  CameFromType
} from '../entities/content.entity';

// Define DTOs
interface CreateContentDto extends Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}
interface UpdateContentDto extends Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> {}

@injectable()
export class ContentService implements IContentService {
  constructor(
    @inject(TYPES.ContentRepository) private readonly contentRepository: IContentRepository
  ) { }

  // Content operations
  async findAllModules(): Promise<Array<{ id: string; name: string; }>> {
    return this.contentRepository.findTopics();
  }

  async findModuleById(moduleId: string): Promise<{ id: string; name: string; } | null> {
    if (!moduleId) {
      throw new Error('ID del módulo es requerido');
    }
    return this.contentRepository.findTopicById(moduleId);
  }

  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    if (!topicId) {
      throw new Error('ID del tema es requerido');
    }
    return this.contentRepository.findContentByTopic(topicId);
  }

  async findContentByAge(age: number): Promise<ContentWithTopics[]> {
    if (age === undefined || age === null) {
      throw new Error('La edad es requerida');
    }
    if (age < 0 || age > 120) {
      throw new Error('La edad debe estar entre 0 y 120 años');
    }

    return this.contentRepository.findContentByAge(age);
  }

  // Progress tracking
  async trackUserProgress(progressData: {
    userId: string;
    contentId: string;
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress> {
    if (!progressData.userId || !progressData.contentId) {
      throw new Error('userId y contentId son requeridos');
    }
    
    if (progressData.progressPercentage !== undefined && 
        (progressData.progressPercentage < 0 || progressData.progressPercentage > 100)) {
      throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
    }

    return await this.contentRepository.trackProgress(progressData.userId, progressData.contentId, {
      status: progressData.status,
      progressPercentage: progressData.progressPercentage,
      timeSpentSeconds: progressData.timeSpentSeconds,
      lastPositionSeconds: progressData.lastPositionSeconds,
      completionRating: progressData.completionRating,
      completionFeedback: progressData.completionFeedback
    });
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    if (!userId) {
      throw new Error('userId es requerido');
    }
    return this.contentRepository.getUserProgressHistory(userId);
  }

  // Interaction logging
  async logInteraction(interactionData: {
    userId: string;
    contentId: string;
    action: InteractionAction;
    timestamp: Date;
    deviceType?: DeviceType;
    platformType?: PlatformType;
    metadata?: Record<string, any>;
    cameFrom?: 'home' | 'search' | 'recommendation' | 'topic';
    searchQuery?: string;
    topicId?: string;
    recommendationSource?: string;
    sessionId?: string;
    progressAtAction?: number;
    timeSpentSeconds?: number;
  }): Promise<ContentInteractionLog> {
    const {
      userId,
      contentId,
      action,
      timestamp,
      deviceType,
      platformType,
      ...rest
    } = interactionData;

    if (!userId || !contentId || !action) {
      throw new Error('userId, contentId y action son requeridos');
    }

    return this.contentRepository.logInteraction({
      userId,
      contentId,
      action,
      deviceType: deviceType || null,
      platform: platformType || null,
      ...rest,
      sessionId: rest.sessionId || `session-${Date.now()}`,
      progressAtAction: rest.progressAtAction ?? 0,
      timeSpentSeconds: rest.timeSpentSeconds ?? 0,
      actionTimestamp: timestamp,
      abandonmentReason: null,
      cameFrom: rest.cameFrom as CameFromType || null,
      metadata: rest.metadata || null
    });
  }

  async getAbandonmentAnalytics(contentId: string): Promise<any> {
    if (!contentId) {
      throw new Error('contentId es requerido');
    }
    return this.contentRepository.getAbandonmentAnalytics(contentId);
  }

  async getEffectivenessAnalytics(contentId: string): Promise<any> {
    if (!contentId) {
      throw new Error('contentId es requerido');
    }
    return this.contentRepository.getEffectivenessAnalytics(contentId);
  }

  async identifyProblematicContent(threshold: number): Promise<any> {
    if (threshold < 0 || threshold > 1) {
      throw new Error('El umbral debe estar entre 0 y 1');
    }
    const percentageThreshold = threshold * 100;
    return this.contentRepository.findProblematicContent(percentageThreshold, 20);
  }

  // CRUD Operations for Content
  async createContent(data: CreateContentDto): Promise<Content> {
    return this.contentRepository.create(data);
  }

  async getContentById(id: string): Promise<Content | null> {
    const content = await this.contentRepository.findById(id);
    return content as Content | null;
  }

  async updateContent(id: string, data: UpdateContentDto): Promise<Content> {
    return this.contentRepository.update(id, data);
  }

  async deleteContent(id: string): Promise<void> {
    await this.contentRepository.delete(id);
  }

  // CRUD Operations for Tips
  async getAllTips(): Promise<Tip[]> {
    return this.contentRepository.getAllTips();
  }

  async createTip(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Tip> {
    return this.contentRepository.createTip(data);
  }

  async getTipById(id: string): Promise<Tip | null> {
    return this.contentRepository.getTipById(id);
  }

  async updateTip(id: string, data: Partial<Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Tip> {
    return this.contentRepository.updateTip(id, data);
  }

  async deleteTip(id: string): Promise<void> {
    await this.contentRepository.deleteTip(id);
  }

  // CRUD Operations for Topics
  async getAllTopics(): Promise<Topic[]> {
    return this.contentRepository.getAllTopics();
  }

  async createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    return this.contentRepository.createTopic(data);
  }

  async getTopicById(id: string): Promise<Topic | null> {
    return this.contentRepository.getTopicById(id);
  }

  async updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Topic> {
    return this.contentRepository.updateTopic(id, data);
  }

  async deleteTopic(id: string): Promise<void> {
    await this.contentRepository.deleteTopic(id);
  }

  async findProblematicContent(threshold: number = 30): Promise<ProblematicContent[]> {
    // Get content with completion rate below threshold
    const problematicContent = await this.contentRepository.findProblematicContent(threshold, 20);

    // Add recommendations based on abandonment point and completion rate
    return problematicContent.map(content => {
      let priority: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO' = 'BAJO';
      let recommendation = 'Revisar contenido para posibles mejoras';

      if (content.completionRate < 20) {
        priority = 'CRÍTICO';
        recommendation = 'Revisión urgente necesaria. Posible contenido demasiado complejo o poco atractivo.';
      } else if (content.completionRate < 40) {
        priority = 'ALTO';
        recommendation = 'Considerar rediseñar o reestructurar el contenido para mejorar la retención.';
      } else if (content.completionRate < 60) {
        priority = 'MEDIO';
        recommendation = 'Evaluar si el contenido cumple con las expectativas de los usuarios.';
      }

      // Adjust recommendation based on abandonment point
      if (content.avgAbandonmentPoint < 25) {
        recommendation += ' Los usuarios abandonan al inicio. Mejorar la introducción.';
      } else if (content.avgAbandonmentPoint > 75) {
        recommendation += ' Los usuarios abandonan al final. Considerar acortar o hacer más atractivo el final.';
      }

      return {
        ...content,
        priority,
        recommendation
      };
    });
  }

  // Content Discovery
  async findFeaturedContent(limit: number = 10): Promise<ContentWithTopics[]> {
    return this.contentRepository.findFeaturedContent(limit);
  }

  async findRelatedContent(contentId: string, limit: number = 5): Promise<ContentWithTopics[]> {
    return this.contentRepository.findRelatedContent(contentId, limit);
  }

  // User Progress
  async getCompletedContent(userId: string): Promise<ContentWithTopics[]> {
    return this.contentRepository.getCompletedContent(userId);
  }

  async getInProgressContent(userId: string): Promise<ContentWithTopics[]> {
    return this.contentRepository.getInProgressContent(userId);
  }
}