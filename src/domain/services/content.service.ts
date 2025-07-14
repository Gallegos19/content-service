// src/domain/services/content.service.ts

import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants/types';
import { IContentRepository } from '../repositories/content.repository';
import { logger } from '@shared/utils/logger';

import { 
  Content, 
  ContentWithTopics, 
  UserProgress, 
  ContentInteractionLog,
  AbandonmentAnalytics, 
  EffectivenessAnalytics, 
  ProblematicContent,
  Topic,
  Tip,
  InteractionAction,
  DeviceType,
  PlatformType,
  AbandonmentReason,
  CameFromType
} from '../entities/content.entity';

@injectable()
export class ContentService {
  constructor(
    @inject(TYPES.ContentRepository) private readonly contentRepository: IContentRepository
  ) {}

  // ===== MODULE OPERATIONS =====
  async findAllModules(): Promise<Array<{ id: string; name: string; }>> {
    try {
      logger.info('Finding all modules');
      return await this.contentRepository.findAllModules();
    } catch (error) {
      logger.error('Error finding all modules:', error);
      throw error;
    }
  }

  async findModuleById(moduleId: string): Promise<{ id: string; name: string; } | null> {
    try {
      if (!moduleId?.trim()) {
        throw new Error('ID del módulo es requerido');
      }

      logger.info(`Finding module by id: ${moduleId}`);
      return await this.contentRepository.findModuleById(moduleId);
    } catch (error) {
      logger.error(`Error finding module by id ${moduleId}:`, error);
      throw error;
    }
  }

  // ===== CONTENT CRUD OPERATIONS =====
  async createContent(
    data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { 
      metadata?: Record<string, any> | null;
      topic_ids?: string[];
    }
  ): Promise<ContentWithTopics> {
    try {
      logger.info(`Creating content: ${data.title}`);
      const content = await this.contentRepository.create(data);
      return {
        ...content,
        contentTopics: content.contentTopics || []
      };
    } catch (error) {
      logger.error('Error creating content:', error);
      throw error;
    }
  }

  async getContentById(id: string): Promise<ContentWithTopics | null> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Getting content by id: ${id}`);
      const content = await this.contentRepository.findById(id);
      return content ? { ...content, contentTopics: content.contentTopics || [] } : null;
    } catch (error) {
      logger.error(`Error getting content by id ${id}:`, error);
      throw error;
    }
  }

  async updateContent(
    id: string,
    data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { 
      metadata?: Record<string, any> | null;
      topic_ids?: string[];
    }
  ): Promise<ContentWithTopics> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Updating content: ${id}`);
      const content = await this.contentRepository.update(id, data);
      return {
        ...content,
        contentTopics: content.contentTopics || []
      };
    } catch (error) {
      logger.error(`Error updating content ${id}:`, error);
      throw error;
    }
  }

  async deleteContent(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Deleting content: ${id}`);
      await this.contentRepository.delete(id);
    } catch (error) {
      logger.error(`Error deleting content ${id}:`, error);
      throw error;
    }
  }

  // ===== CONTENT DISCOVERY OPERATIONS =====
  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    try {
      if (!topicId?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Finding content by topic: ${topicId}`);
      const contents = await this.contentRepository.findContentByTopic(topicId);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error(`Error finding content by topic ${topicId}:`, error);
      throw error;
    }
  }

  async findContentByAge(age: number): Promise<ContentWithTopics[]> {
    try {
      if (age === undefined || age === null) {
        throw new Error('La edad es requerida');
      }
      if (age < 0 || age > 120) {
        throw new Error('La edad debe estar entre 0 y 120 años');
      }

      logger.info(`Finding content by age: ${age}`);
      const contents = await this.contentRepository.findContentByAge(age);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error(`Error finding content by age ${age}:`, error);
      throw error;
    }
  }

  async findFeaturedContent(limit: number = 10): Promise<ContentWithTopics[]> {
    try {
      logger.info(`Finding featured content with limit: ${limit}`);
      const contents = await this.contentRepository.findFeaturedContent(limit);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error('Error finding featured content:', error);
      throw error;
    }
  }

  async findRelatedContent(contentId: string, limit: number = 5): Promise<ContentWithTopics[]> {
    try {
      if (!contentId?.trim()) {
        throw new Error('ID del contenido es requerido');
      }

      logger.info(`Finding related content for: ${contentId}`);
      const contents = await this.contentRepository.findRelatedContent(contentId, limit);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error(`Error finding related content for ${contentId}:`, error);
      throw error;
    }
  }

  // ===== PROGRESS TRACKING =====
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
    try {
      // Validate required fields
      if (!progressData.userId?.trim() || !progressData.contentId?.trim()) {
        throw new Error('userId and contentId are required');
      }

      // Set defaults for undefined values
      const safeData = {
        userId: progressData.userId,
        contentId: progressData.contentId,
        status: progressData.status || 'not_started',
        progressPercentage: progressData.progressPercentage ?? 0,
        timeSpentSeconds: progressData.timeSpentSeconds ?? 0,
        lastPositionSeconds: progressData.lastPositionSeconds ?? 0,
        completionRating: progressData.completionRating,
        completionFeedback: progressData.completionFeedback
      };

      // Additional validation
      if (safeData.progressPercentage < 0 || safeData.progressPercentage > 100) {
        throw new Error('Progress percentage must be between 0 and 100');
      }

      if (safeData.timeSpentSeconds < 0) {
        throw new Error('Time spent cannot be negative');
      }

      if (safeData.lastPositionSeconds < 0) {
        throw new Error('Last position cannot be negative');
      }

      if (safeData.completionRating !== undefined && 
          (safeData.completionRating < 1 || safeData.completionRating > 5)) {
        throw new Error('Completion rating must be between 1 and 5');
      }

      logger.info(`Tracking progress for user ${safeData.userId} on content ${safeData.contentId}`);
      
      return await this.contentRepository.trackProgress(
        safeData.userId, 
        safeData.contentId, 
        {
          status: safeData.status,
          progressPercentage: safeData.progressPercentage,
          timeSpentSeconds: safeData.timeSpentSeconds,
          lastPositionSeconds: safeData.lastPositionSeconds,
          completionRating: safeData.completionRating,
          completionFeedback: safeData.completionFeedback
        }
      );
    } catch (error) {
      logger.error('Error tracking user progress:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      if (!userId?.trim()) {
        throw new Error('userId es requerido');
      }

      logger.info(`Getting user progress for user: ${userId}`);
      return await this.contentRepository.getUserProgressHistory(userId);
    } catch (error) {
      logger.error(`Error getting user progress for ${userId}:`, error);
      throw error;
    }
  }

  async getCompletedContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      if (!userId?.trim()) {
        throw new Error('userId es requerido');
      }

      logger.info(`Getting completed content for user: ${userId}`);
      const contents = await this.contentRepository.getCompletedContent(userId);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error(`Error getting completed content for ${userId}:`, error);
      throw error;
    }
  }

  async getInProgressContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      if (!userId?.trim()) {
        throw new Error('userId es requerido');
      }

      logger.info(`Getting in-progress content for user: ${userId}`);
      const contents = await this.contentRepository.getInProgressContent(userId);
      return contents.map(content => ({ ...content, contentTopics: content.contentTopics || [] }));
    } catch (error) {
      logger.error(`Error getting in-progress content for ${userId}:`, error);
      throw error;
    }
  }

  // ===== INTERACTION LOGGING =====
  async logInteraction(interactionData: {
    userId: string;
    contentId: string;
    sessionId: string;
    action: InteractionAction;
    progressAtAction?: number | null;
    timeSpentSeconds?: number | null;
    deviceType?: DeviceType | null;
    platform?: PlatformType | null;
    abandonmentReason?: AbandonmentReason | null;
    cameFrom?: CameFromType | null;
    metadata?: Record<string, any> | null;
  }): Promise<ContentInteractionLog> {
    try {
      // Validate required fields
      if (!interactionData.userId?.trim() || !interactionData.contentId?.trim() || !interactionData.action) {
        throw new Error('userId, contentId and action are required');
      }

      const interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'> = {
        userId: interactionData.userId,
        contentId: interactionData.contentId,
        sessionId: interactionData.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: interactionData.action,
        progressAtAction: interactionData.progressAtAction ?? null,
        timeSpentSeconds: interactionData.timeSpentSeconds ?? null,
        deviceType: interactionData.deviceType ?? null,
        platform: interactionData.platform ?? null,
        abandonmentReason: interactionData.abandonmentReason ?? null,
        cameFrom: interactionData.cameFrom ?? null,
        metadata: interactionData.metadata ?? null
      };

      logger.info(`Logging interaction for user ${interactionData.userId} on content ${interactionData.contentId}`);
      return await this.contentRepository.logInteraction(interaction);
    } catch (error) {
      logger.error('Error logging interaction:', error);
      throw error;
    }
  }

  // ===== ANALYTICS =====
  async getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics> {
    try {
      if (!contentId?.trim()) {
        throw new Error('contentId es requerido');
      }

      logger.info(`Getting abandonment analytics for content: ${contentId}`);
      return await this.contentRepository.getAbandonmentAnalytics(contentId);
    } catch (error) {
      logger.error(`Error getting abandonment analytics for ${contentId}:`, error);
      throw error;
    }
  }

  async getEffectivenessAnalytics(contentId: string): Promise<EffectivenessAnalytics> {
    try {
      if (!contentId?.trim()) {
        throw new Error('contentId es requerido');
      }

      logger.info(`Getting effectiveness analytics for content: ${contentId}`);
      return await this.contentRepository.getEffectivenessAnalytics(contentId);
    } catch (error) {
      logger.error(`Error getting effectiveness analytics for ${contentId}:`, error);
      throw error;
    }
  }

  async identifyProblematicContent(threshold: number = 0.3): Promise<ProblematicContent[]> {
    try {
      if (threshold < 0 || threshold > 1) {
        throw new Error('El umbral debe estar entre 0 y 1');
      }

      const percentageThreshold = threshold * 100;
      logger.info(`Identifying problematic content with threshold: ${percentageThreshold}%`);
      
      return await this.contentRepository.findProblematicContent(percentageThreshold, 20);
    } catch (error) {
      logger.error('Error identifying problematic content:', error);
      throw error;
    }
  }

  async findProblematicContent(threshold: number = 30): Promise<ProblematicContent[]> {
    try {
      logger.info(`Finding problematic content with threshold: ${threshold}%`);
      
      const problematicContent = await this.contentRepository.findProblematicContent(threshold, 20);

      // Add recommendations based on abandonment point and completion rate
      return problematicContent.map((content: ProblematicContent) => {
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
    } catch (error) {
      logger.error('Error finding problematic content:', error);
      throw error;
    }
  }

  // ===== TOPIC CRUD OPERATIONS =====
  async getAllTopics(): Promise<Topic[]> {
    try {
      logger.info('Getting all topics');
      // This would need to be implemented in the repository
      // For now, returning empty array
      return [];
    } catch (error) {
      logger.error('Error getting all topics:', error);
      throw error;
    }
  }

  async createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    try {
      // Validaciones
      if (!data.name?.trim()) {
        throw new Error('El nombre del tema es requerido');
      }

      if (!data.slug?.trim()) {
        throw new Error('El slug del tema es requerido');
      }

      if (data.target_age_min !== undefined && data.target_age_max !== undefined) {
        if (data.target_age_min > data.target_age_max) {
          throw new Error('La edad mínima no puede ser mayor que la edad máxima');
        }
      }

      logger.info(`Creating topic: ${data.name}`);
      // This would need to be implemented in the repository
      throw new Error('Topic creation not implemented in repository');
    } catch (error) {
      logger.error('Error creating topic:', error);
      throw error;
    }
  }

  async getTopicById(id: string): Promise<Topic | null> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Getting topic by id: ${id}`);
      // This would need to be implemented in the repository
      return null;
    } catch (error) {
      logger.error(`Error getting topic by id ${id}:`, error);
      throw error;
    }
  }

  async updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Topic> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      // Validaciones
      if (data.name !== undefined && !data.name.trim()) {
        throw new Error('El nombre del tema no puede estar vacío');
      }

      if (data.slug !== undefined && !data.slug.trim()) {
        throw new Error('El slug del tema no puede estar vacío');
      }

      if (data.target_age_min !== undefined && data.target_age_max !== undefined) {
        if (data.target_age_min > data.target_age_max) {
          throw new Error('La edad mínima no puede ser mayor que la edad máxima');
        }
      }

      logger.info(`Updating topic: ${id}`);
      // This would need to be implemented in the repository
      throw new Error('Topic update not implemented in repository');
    } catch (error) {
      logger.error(`Error updating topic ${id}:`, error);
      throw error;
    }
  }

  async deleteTopic(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Deleting topic: ${id}`);
      // This would need to be implemented in the repository
      throw new Error('Topic deletion not implemented in repository');
    } catch (error) {
      logger.error(`Error deleting topic ${id}:`, error);
      throw error;
    }
  }

  // ===== TIP CRUD OPERATIONS =====
  async getAllTips(): Promise<Tip[]> {
    try {
      logger.info('Getting all tips');
      // This would need to be implemented in the repository
      return [];
    } catch (error) {
      logger.error('Error getting all tips:', error);
      throw error;
    }
  }

  async createTip(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { metadata?: Record<string, any> | null }): Promise<Tip> {
    try {
      // Validaciones
      if (!data.title?.trim()) {
        throw new Error('El título del tip es requerido');
      }

      if (!data.content?.trim()) {
        throw new Error('El contenido del tip es requerido');
      }

      if (data.target_age_min !== undefined && data.target_age_max !== undefined) {
        if (data.target_age_min > data.target_age_max) {
          throw new Error('La edad mínima no puede ser mayor que la edad máxima');
        }
      }

      if (data.estimated_time_minutes !== undefined && data.estimated_time_minutes !== null && data.estimated_time_minutes < 0) {
        throw new Error('El tiempo estimado no puede ser negativo');
      }

      logger.info(`Creating tip: ${data.title}`);
      // This would need to be implemented in the repository
      throw new Error('Tip creation not implemented in repository');
    } catch (error) {
      logger.error('Error creating tip:', error);
      throw error;
    }
  }

  async getTipById(id: string): Promise<Tip | null> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tip es requerido');
      }

      logger.info(`Getting tip by id: ${id}`);
      // This would need to be implemented in the repository
      return null;
    } catch (error) {
      logger.error(`Error getting tip by id ${id}:`, error);
      throw error;
    }
  }

  async updateTip(id: string, data: Partial<Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Tip> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tip es requerido');
      }

      // Validaciones similares a create pero opcionales
      if (data.title !== undefined && !data.title.trim()) {
        throw new Error('El título del tip no puede estar vacío');
      }

      if (data.content !== undefined && !data.content.trim()) {
        throw new Error('El contenido del tip no puede estar vacío');
      }

      if (data.target_age_min !== undefined && data.target_age_max !== undefined) {
        if (data.target_age_min > data.target_age_max) {
          throw new Error('La edad mínima no puede ser mayor que la edad máxima');
        }
      }

      if (data.estimated_time_minutes !== undefined && data.estimated_time_minutes !== null && data.estimated_time_minutes < 0) {
        throw new Error('El tiempo estimado no puede ser negativo');
      }

      logger.info(`Updating tip: ${id}`);
      // This would need to be implemented in the repository
      throw new Error('Tip update not implemented in repository');
    } catch (error) {
      logger.error(`Error updating tip ${id}:`, error);
      throw error;
    }
  }

  async deleteTip(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('ID del tip es requerido');
      }

      logger.info(`Deleting tip: ${id}`);
      // This would need to be implemented in the repository
      throw new Error('Tip deletion not implemented in repository');
    } catch (error) {
      logger.error(`Error deleting tip ${id}:`, error);
      throw error;
    }
  }

  // ===== CONTENT-TOPIC RELATIONSHIP OPERATIONS =====
  async addTopicToContent(contentId: string, topicId: string, isPrimary = false): Promise<void> {
    try {
      if (!contentId?.trim() || !topicId?.trim()) {
        throw new Error('contentId y topicId son requeridos');
      }

      logger.info(`Adding topic ${topicId} to content ${contentId} (primary: ${isPrimary})`);
      await this.contentRepository.addTopicToContent(contentId, topicId, isPrimary);
    } catch (error) {
      logger.error(`Error adding topic ${topicId} to content ${contentId}:`, error);
      throw error;
    }
  }

  async removeTopicFromContent(contentId: string, topicId: string): Promise<void> {
    try {
      if (!contentId?.trim() || !topicId?.trim()) {
        throw new Error('contentId y topicId son requeridos');
      }

      logger.info(`Removing topic ${topicId} from content ${contentId}`);
      await this.contentRepository.removeTopicFromContent(contentId, topicId);
    } catch (error) {
      logger.error(`Error removing topic ${topicId} from content ${contentId}:`, error);
      throw error;
    }
  }

  async setPrimaryTopic(contentId: string, topicId: string): Promise<void> {
    try {
      if (!contentId?.trim() || !topicId?.trim()) {
        throw new Error('contentId y topicId son requeridos');
      }

      logger.info(`Setting primary topic ${topicId} for content ${contentId}`);
      await this.contentRepository.setPrimaryTopic(contentId, topicId);
    } catch (error) {
      logger.error(`Error setting primary topic ${topicId} for content ${contentId}:`, error);
      throw error;
    }
  }

  // ===== BULK OPERATIONS =====
  async bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }>): Promise<void> {
    try {
      if (!Array.isArray(progressData) || progressData.length === 0) {
        throw new Error('Los datos de progreso son requeridos');
      }

      // Validar cada elemento
      for (const data of progressData) {
        if (!data.userId?.trim() || !data.contentId?.trim()) {
          throw new Error('userId y contentId son requeridos para cada elemento');
        }
        if (data.progressPercentage < 0 || data.progressPercentage > 100) {
          throw new Error('El porcentaje de progreso debe estar entre 0 y 100');
        }
        if (data.timeSpentSeconds < 0) {
          throw new Error('El tiempo dedicado no puede ser negativo');
        }
      }

      logger.info(`Bulk tracking progress for ${progressData.length} entries`);
      await this.contentRepository.bulkTrackProgress(progressData);
    } catch (error) {
      logger.error('Error bulk tracking progress:', error);
      throw error;
    }
  }

  async bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void> {
    try {
      if (!Array.isArray(interactions) || interactions.length === 0) {
        throw new Error('Las interacciones son requeridas');
      }

      // Validate each interaction
      for (const interaction of interactions) {
        if (!interaction.userId?.trim() || !interaction.contentId?.trim() || !interaction.action) {
          throw new Error('userId, contentId y action son requeridos para cada interacción');
        }
      }

      logger.info(`Bulk logging ${interactions.length} interactions`);
      await this.contentRepository.bulkLogInteractions(interactions);
    } catch (error) {
      logger.error('Error bulk logging interactions:', error);
      throw error;
    }
  }
}