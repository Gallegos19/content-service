import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants/types';
import { IContentRepository } from '../repositories/content.repository';
import { IContentService } from './content.service.interface';
import { ContentInteractionLog } from '../entities/content.entity';
import { logger } from '@shared/utils/logger';

import { 
  Content, 
  Topic, 
  Tip, 
  ContentType,
} from '@prisma/client';
import { 
  AbandonmentAnalytics, 
  CameFromType, 
  ContentWithTopics, 
  DeviceType, 
  EffectivenessAnalytics, 
  InteractionAction, 
  PlatformType, 
  ProblematicContent, 
  UserProgress 
} from '@domain/entities';
import { AbandonmentReason } from '@domain/enums';
import { JsonValue } from '@prisma/client/runtime/library';

// Define DTOs
interface CreateContentDto extends Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}
interface UpdateContentDto extends Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> {
  color_hex?: string;
  prerequisites?: string[];
}

@injectable()
export class ContentService implements IContentService {
  constructor(
    @inject(TYPES.ContentRepository) private contentRepository: IContentRepository
  ) { }

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

  // ===== CONTENT DISCOVERY OPERATIONS =====
  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    try {
      if (!topicId?.trim()) {
        throw new Error('ID del tema es requerido');
      }

      logger.info(`Finding content by topic: ${topicId}`);
      return await this.contentRepository.findContentByTopic(topicId);
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
      return await this.contentRepository.findContentByAge(age);
    } catch (error) {
      logger.error(`Error finding content by age ${age}:`, error);
      throw error;
    }
  }

  async findFeaturedContent(limit: number = 10): Promise<ContentWithTopics[]> {
    try {
      logger.info(`Finding featured content with limit: ${limit}`);
      return await this.contentRepository.findFeaturedContent(limit);
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
      return await this.contentRepository.findRelatedContent(contentId, limit);
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
      console.log('Progress data:', progressData);
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
      return await this.contentRepository.getCompletedContent(userId);
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
      return await this.contentRepository.getInProgressContent(userId);
    } catch (error) {
      logger.error(`Error getting in-progress content for ${userId}:`, error);
      throw error;
    }
  }

  // ===== INTERACTION LOGGING =====
  async logInteraction(interactionData: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    try {
      return await this.contentRepository.logInteraction({
        ...interactionData,
        sessionId: interactionData.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
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

  // ===== CONTENT CRUD OPERATIONS =====
  async createContent(
    data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { 
      metadata?: Record<string, any> | null 
    }
  ): Promise<ContentWithTopics> {
    const content = await this.contentRepository.create(data);
    return {
      ...content,
      contentTopics: content.contentTopics || []
    };
  }

  async getContentById(id: string): Promise<ContentWithTopics | null> {
    return this.contentRepository.findById(id);
  }

  async updateContent(
    id: string,
    data: Partial<Omit<Content, 'id'>> & { metadata?: Record<string, any> | null }
  ): Promise<ContentWithTopics> {
    return this.contentRepository.update(id, data);
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

  // ===== TOPIC CRUD OPERATIONS =====
  async getAllTopics(): Promise<Topic[]> {
    try {
      logger.info('Getting all topics');
      const topics = await this.contentRepository.getAllTopics();
      return topics.map((topic: Topic) => ({
        ...topic,
        color_hex: topic.color_hex || '#000000'
      }));
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
      return await this.contentRepository.createTopic({
        ...data,
        prerequisites: Array.isArray(data.prerequisites) 
          ? data.prerequisites.filter(p => typeof p === 'string')
          : []
      });
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
      return await this.contentRepository.getTopicById(id);
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

      // Validaciones similares a create pero opcionales
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
      const updateData = {
        ...data,
        color_hex: data.color_hex === null ? undefined : data.color_hex || '#000000',
        prerequisites: data.prerequisites && Array.isArray(data.prerequisites) 
          ? data.prerequisites.filter(Boolean) as string[] 
          : undefined
      };
      return await this.contentRepository.updateTopic(id, updateData);
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
      await this.contentRepository.deleteTopic(id);
    } catch (error) {
      logger.error(`Error deleting topic ${id}:`, error);
      throw error;
    }
  }

  // ===== TIP CRUD OPERATIONS =====
  async getAllTips(): Promise<Tip[]> {
    try {
      logger.info('Getting all tips');
      return await this.contentRepository.getAllTips();
    } catch (error) {
      logger.error('Error getting all tips:', error);
      throw error;
    }
  }

  async createTip(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Tip> {
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
      return await this.contentRepository.createTip(data);
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
      return await this.contentRepository.getTipById(id);
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
      return await this.contentRepository.updateTip(id, data);
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
      await this.contentRepository.deleteTip(id);
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

  async bulkLogInteractions(interactions: Array<Omit<{ id: string; user_id: string; content_id: string; session_id: string; action: string; action_timestamp: Date; progress_at_action: number | null; time_spent_seconds: number | null; device_type: DeviceType | null; platform: PlatformType | null; abandonment_reason: AbandonmentReason | null; came_from: CameFromType | null; metadata: JsonValue; }, "id" | "action_timestamp">>): Promise<void> {
    try {
      if (!Array.isArray(interactions) || interactions.length === 0) {
        throw new Error('Las interacciones son requeridas');
      }

      // Convert snake_case to camelCase and validate
      const convertedInteractions = interactions.map(interaction => {
        if (!interaction.user_id?.trim() || !interaction.content_id?.trim() || !interaction.action) {
          throw new Error('user_id, content_id y action son requeridos para cada interacción');
        }
        
        return {
          userId: interaction.user_id,
          contentId: interaction.content_id,
          sessionId: interaction.session_id,
          action: interaction.action as InteractionAction,
          actionTimestamp: new Date(),
          progressAtAction: interaction.progress_at_action,
          timeSpentSeconds: interaction.time_spent_seconds,
          deviceType: interaction.device_type as DeviceType | null,
          platform: interaction.platform as PlatformType | null,
          abandonmentReason: interaction.abandonment_reason,
          cameFrom: interaction.came_from as CameFromType || null,
          metadata: interaction.metadata && typeof interaction.metadata === 'object' 
            ? interaction.metadata 
            : null
        };
      });

      logger.info(`Bulk logging ${interactions.length} interactions`);
      return this.contentRepository.bulkLogInteractions(convertedInteractions);
    } catch (error) {
      logger.error('Error bulk logging interactions:', error);
      throw error;
    }
  }

  private transformToContent(contentWithTopics: ContentWithTopics): Content {
    const { contentTopics, ...contentData } = contentWithTopics;
    
    // Handle all possible metadata cases
    let finalMetadata: Record<string, any> | null = null;
    
    if (contentData.metadata !== null && contentData.metadata !== undefined) {
      try {
        // If metadata is a string, parse it
        const parsedMetadata = typeof contentData.metadata === 'string' 
          ? JSON.parse(contentData.metadata) 
          : contentData.metadata;
        
        // Ensure it's an object (not array) or null
        if (typeof parsedMetadata === 'object' && !Array.isArray(parsedMetadata)) {
          finalMetadata = parsedMetadata;
        }
      } catch {
        finalMetadata = null;
      }
    }
    
    return {
      ...contentData,
      metadata: finalMetadata,
      contentTopics: contentTopics || []
    } as Content;
  }
}