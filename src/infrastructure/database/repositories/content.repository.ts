import { inject, injectable } from 'inversify';
import { PrismaClient, Prisma, ContentType, DifficultyLevel } from '@prisma/client';
import { IContentRepository } from '../../../domain/repositories/content.repository';
import { 
  Content, 
  ContentWithTopics, 
  ContentFilters, 
  UserProgress, 
  ContentAnalytics, 
  AbandonmentAnalytics, 
  EffectivenessAnalytics, 
  ProblematicContent, 
  ContentInteractionLog, 
  Tip, 
  Topic, 
  CameFromType
} from '../../../domain/entities/content.entity';
import { 
  InteractionAction, 
  DeviceType, 
  PlatformType, 
  AbandonmentReason,  
} from '@domain/enums';
import { PaginatedResult, TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { date } from 'zod';

type PrismaTip = {
  id: string;
  title: string;
  content: string;
  difficulty_level: string;
  target_age_min: number;
  target_age_max: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  content_id: string | null;
  metadata: Record<string, any> | null;
};

type TipWithMetadata = Omit<PrismaTip, 'metadata'> & { metadata: Record<string, any> };

@injectable()
export class ContentRepository implements IContentRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  // Content CRUD operations
  async create(
    data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'contentTopics'> & {
      contentTopics?: Array<{
        topic_id: string;
        is_primary: boolean;
      }>
    }
  ): Promise<Content> {
    try {
      // Remove topic_ids if it exists
      const { topic_ids, ...prismaData } = data as any;
      
      const created = await this.prisma.content.create({
        data: {
          ...prismaData,
          content_type: this.mapContentType(prismaData.content_type),
          difficulty_level: this.mapDifficultyLevel(prismaData.difficulty_level),
          metadata: prismaData.metadata ? JSON.stringify(prismaData.metadata) : Prisma.JsonNull,
          target_age_min: prismaData.target_age_min === null ? undefined : prismaData.target_age_min,
          target_age_max: prismaData.target_age_max === null ? undefined : prismaData.target_age_max,
          reading_time_minutes: prismaData.reading_time_minutes === null ? undefined : prismaData.reading_time_minutes,
          duration_minutes: prismaData.duration_minutes === null ? undefined : prismaData.duration_minutes,
          rating_average: prismaData.rating_average === null ? undefined : prismaData.rating_average,
          published_at: prismaData.published_at === null ? undefined : prismaData.published_at,
          created_by: prismaData.created_by === null ? undefined : prismaData.created_by,
          updated_by: prismaData.updated_by === null ? undefined : prismaData.updated_by,
          contentTopics: prismaData.contentTopics ? {
            create: prismaData.contentTopics.map((topic: { topic_id: string; is_primary: boolean }) => ({
              topic: { connect: { id: topic.topic_id } },
              is_primary: topic.is_primary
            }))
          } : undefined
        },
        include: { contentTopics: true }
      });

      return this.transformToContentWithTopics(created);
    } catch (error) {
      logger.error('Error creating content:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<ContentWithTopics | null> {
    try {
      const result = await this.prisma.content.findUnique({
        where: { id },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        }
      });

      if (!result) return null;

      return this.transformToContentWithTopics(result);
    } catch (error) {
      logger.error(`Error finding content by id ${id}:`, error);
      throw error;
    }
  }

  async findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>> {
    try {
      const page = filters.page ?? 1;
      const itemsPerPage = filters.limit ?? 10;
      const skip = (page - 1) * itemsPerPage;

      const where = this.buildWhereClause(filters);

      const [items, totalItems] = await Promise.all([
        this.prisma.content.findMany({
          where,
          include: {
            contentTopics: {
              include: {
                topic: true
              }
            }
          },
          skip,
          take: itemsPerPage,
          orderBy: this.buildOrderBy(filters),
        }),
        this.prisma.content.count({ where }),
      ]);

      return {
        items: items.map(item => this.transformToContentWithTopics(item)),
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage,
          totalPages: Math.ceil(totalItems / itemsPerPage),
          currentPage: page,
        },
      };
    } catch (error) {
      logger.error('Error finding content with filters:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> & {
      topic_ids?: string[];
    }
  ): Promise<ContentWithTopics> {
    try {
      const updateData: Prisma.ContentUpdateInput = {
        title: data.title,
        description: data.description,
        content_type: data.content_type ? this.mapContentType(data.content_type) : undefined,
        difficulty_level: data.difficulty_level ? this.mapDifficultyLevel(data.difficulty_level) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : Prisma.JsonNull,
        updated_at: new Date()
      };
      
      // Eliminar topic_ids ya que se manejará por separado
      delete data.topic_ids;

      const updated = await this.prisma.content.update({
        where: { id },
        data: updateData,
        include: { contentTopics: true }
      });

      // Actualizar topics si se proporcionaron
      if (data.topic_ids && Array.isArray(data.topic_ids)) {
        await this.prisma.contentTopic.deleteMany({
          where: { content_id: id }
        });
        
        const topicIds: string[] = data.topic_ids;
        await this.prisma.contentTopic.createMany({
          data: topicIds.map((topic_id) => ({
            content_id: id,
            topic_id
          }))
        });
      }

      return this.transformToContentWithTopics(updated);
    } catch (error) {
      logger.error(`Error updating content ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.content.delete({ where: { id } });
      return true;
    } catch (error) {
      logger.error(`Error deleting content ${id}:`, error);
      throw error;
    }
  }

  // Content-Topic relationship
  async addTopicToContent(contentId: string, topicId: string, isPrimary = false): Promise<void> {
    try {
      // Si es primary, primero quitar el flag primary de otros topics del mismo contenido
      if (isPrimary) {
        await this.prisma.contentTopic.updateMany({
          where: { content_id: contentId },
          data: { is_primary: false }
        });
      }

      await this.prisma.contentTopic.upsert({
        where: {
          content_id_topic_id: {
            content_id: contentId,
            topic_id: topicId
          }
        },
        update: { is_primary: isPrimary },
        create: {
          content_id: contentId,
          topic_id: topicId,
          is_primary: isPrimary
        }
      });
    } catch (error) {
      logger.error(`Error adding topic ${topicId} to content ${contentId}:`, error);
      throw error;
    }
  }

  async removeTopicFromContent(contentId: string, topicId: string): Promise<void> {
    try {
      await this.prisma.contentTopic.delete({
        where: {
          content_id_topic_id: {
            content_id: contentId,
            topic_id: topicId
          }
        }
      });
    } catch (error) {
      logger.error(`Error removing topic ${topicId} from content ${contentId}:`, error);
      throw error;
    }
  }

  async setPrimaryTopic(contentId: string, topicId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Quitar primary de todos los topics del contenido
        await tx.contentTopic.updateMany({
          where: { content_id: contentId },
          data: { is_primary: false }
        });

        // Establecer el topic como primary
        await tx.contentTopic.update({
          where: {
            content_id_topic_id: {
              content_id: contentId,
              topic_id: topicId
            }
          },
          data: { is_primary: true }
        });
      });
    } catch (error) {
      logger.error(`Error setting primary topic ${topicId} for content ${contentId}:`, error);
      throw error;
    }
  }

  // Content progress tracking
  async getUserProgress(userId: string, contentId: string): Promise<UserProgress | null> {
    try {
      const progress = await this.prisma.contentProgress.findUnique({
        where: {
          user_id_content_id: {
            user_id: userId,
            content_id: contentId
          }
        },
        include: {
          content: true
        }
      });

      if (!progress) return null;

      return {
        contentId: progress.content_id,
        title: progress.content.title,
        status: progress.status as any,
        progressPercentage: progress.progress_percentage,
        timeSpentSeconds: progress.time_spent_seconds,
        lastPositionSeconds: progress.last_position_seconds,
        lastAccessedAt: progress.last_accessed_at,
        completedAt: progress.completed_at,
        completionRating: Number(progress.completion_rating),
        completionFeedback: String(progress.completion_feedback),
      };
    } catch (error) {
      logger.error(`Error getting user progress for user ${userId} and content ${contentId}:`, error);
      throw error;
    }
  }

  async trackProgress(userId: string, contentId: string, data: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress> {
    try {
      logger.info(`Tracking user progress for user ${userId} and content ${contentId}`);
      
      // Validate required fields
      if (!userId || !contentId) {
        throw new Error('User ID and Content ID are required');
      }

      const contentExists = await this.prisma.content.findUnique({
        where: { id: contentId }
      });
      
      if (!contentExists) {
        throw new Error(`Content with ID ${contentId} does not exist`);
      }
      
      const now = new Date();
      
      // Set default values for undefined fields
      const safeData = {
        status: data.status || 'not_started',
        progressPercentage: data.progressPercentage ?? 0,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
        lastPositionSeconds: data.lastPositionSeconds ?? 0,
        completionRating: data.completionRating,
        completionFeedback: data.completionFeedback
      };
      
      const updateData: any = {
        last_accessed_at: now
      };
      
      if (safeData.status) updateData.status = safeData.status.toUpperCase().replace('-', '_');
      if (safeData.progressPercentage !== undefined) updateData.progress_percentage = safeData.progressPercentage;
      if (safeData.timeSpentSeconds !== undefined) updateData.time_spent_seconds = safeData.timeSpentSeconds;
      if (safeData.lastPositionSeconds !== undefined) updateData.last_position_seconds = safeData.lastPositionSeconds;
      if (safeData.completionRating !== undefined) updateData.completion_rating = safeData.completionRating;
      if (safeData.completionFeedback !== undefined) updateData.completion_feedback = safeData.completionFeedback;
      if (safeData.status === 'completed') updateData.completed_at = now;
      
      const progress = await this.prisma.contentProgress.upsert({
        where: {
          user_id_content_id: {
            user_id: userId,
            content_id: contentId
          }
        },
        update: updateData,
        create: {
          user_id: userId,
          content_id: contentId,
          status: safeData.status.toUpperCase().replace('-', '_'),
          progress_percentage: safeData.progressPercentage,
          time_spent_seconds: safeData.timeSpentSeconds,
          last_position_seconds: safeData.lastPositionSeconds,
          completion_rating: safeData.completionRating,
          completion_feedback: safeData.completionFeedback,
          first_accessed_at: now,
          last_accessed_at: now,
          completed_at: safeData.status === 'completed' ? now : null,
        },
        include: {
          content: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!progress.content) {
        throw new Error('Content not found for progress record');
      }

      return {
        contentId: progress.content_id,
        title: progress.content.title,
        status: progress.status.toLowerCase().replace('_', '-') as any,
        progressPercentage: progress.progress_percentage,
        timeSpentSeconds: progress.time_spent_seconds,
        lastPositionSeconds: progress.last_position_seconds,
        lastAccessedAt: progress.last_accessed_at,
        completedAt: progress.completed_at,
        completionRating: progress.completion_rating ? Number(progress.completion_rating) : undefined,
        completionFeedback: progress.completion_feedback ? String(progress.completion_feedback) : undefined,
      };
    } catch (error) {
      logger.error(`Error tracking progress for user ${userId} and content ${contentId}:`, error);
      throw error;
    }
  }

  async logInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    try {
      const logged = await this.prisma.contentInteractionLog.create({
        data: {
          user_id: interaction.userId,
          content_id: interaction.contentId,
          session_id: interaction.sessionId,
          action: interaction.action,
          action_timestamp: new Date(),
          progress_at_action: interaction.progressAtAction ? new Prisma.Decimal(interaction.progressAtAction) : null,
          time_spent_seconds: interaction.timeSpentSeconds || 0,
          device_type: interaction.deviceType,
          platform: interaction.platform,
          abandonment_reason: interaction.abandonmentReason,
          came_from: interaction.cameFrom,
          metadata: interaction.metadata ? JSON.stringify(interaction.metadata) : Prisma.JsonNull,
        }
      });

      return {
        id: logged.id,
        userId: logged.user_id,
        contentId: logged.content_id,
        sessionId: logged.session_id,
        action: logged.action as InteractionAction,
        actionTimestamp: logged.action_timestamp,
        progressAtAction: logged.progress_at_action ? Number(logged.progress_at_action) : null,
        timeSpentSeconds: Number(logged.time_spent_seconds),
        deviceType: logged.device_type as DeviceType | null,
        platform: logged.platform as PlatformType | null,
        abandonmentReason: logged.abandonment_reason as AbandonmentReason | null,
        cameFrom: logged.came_from as CameFromType | null,
        metadata: logged.metadata ? JSON.parse(logged.metadata as string) : null,
      };
    } catch (error) {
      logger.error('Error logging interaction:', error);
      throw error;
    }
  }

  async getUserInteractions(userId: string, contentId?: string): Promise<ContentInteractionLog[]> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        where: {
          user_id: userId,
          ...(contentId && { content_id: contentId })
        },
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      }));
    } catch (error) {
      logger.error(`Error getting user interactions for user ${userId}:`, error);
      throw error;
    }
  }

  async getContentInteractions(contentId: string, action?: string): Promise<ContentInteractionLog[]> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        where: {
          content_id: contentId,
          ...(action && { action })
        },
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      }));
    } catch (error) {
      logger.error(`Error getting content interactions for content ${contentId}:`, error);
      throw error;
    }
  }

  async trackInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    return this.logInteraction(interaction);
  }

  // Content discovery
  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentTopics: {
            some: {
              topic_id: topicId
            }
          },
          is_published: true
        },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return contents.map(content => this.transformToContentWithTopics(content));
    } catch (error) {
      logger.error(`Error finding content by topic ${topicId}:`, error);
      throw error;
    }
  }

  async findContentByAge(age: number): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          target_age_min: { lte: age },
          target_age_max: { gte: age },
          is_published: true
        },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return contents.map(content => this.transformToContentWithTopics(content));
    } catch (error) {
      logger.error(`Error finding content by age ${age}:`, error);
      throw error;
    }
  }

  async findFeaturedContent(limit = 10): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          is_featured: true,
          is_published: true
        },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        },
        take: limit,
        orderBy: { created_at: 'desc' }
      });

      return contents.map(content => this.transformToContentWithTopics(content));
    } catch (error) {
      logger.error('Error finding featured content:', error);
      throw error;
    }
  }

  async findRelatedContent(contentId: string, limit = 5): Promise<ContentWithTopics[]> {
    try {
      // Obtener los topics del contenido actual
      const contentTopics = await this.prisma.contentTopic.findMany({
        where: { content_id: contentId },
        select: { topic_id: true }
      });

      const topicIds = contentTopics.map(ct => ct.topic_id);

      const contents = await this.prisma.content.findMany({
        where: {
          id: { not: contentId },
          contentTopics: {
            some: {
              topic_id: { in: topicIds }
            }
          },
          is_published: true
        },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        },
        take: limit,
        orderBy: { view_count: 'desc' }
      });

      return contents.map(content => this.transformToContentWithTopics(content));
    } catch (error) {
      logger.error(`Error finding related content for ${contentId}:`, error);
      throw error;
    }
  }

  // User progress
  async getUserProgressHistory(userId: string): Promise<UserProgress[]> {
    try {
      const progressList = await this.prisma.contentProgress.findMany({
        where: { user_id: userId },
        include: { content: true },
        orderBy: { last_accessed_at: 'desc' }
      });

      return progressList.map(progress => ({
        contentId: progress.content_id,
        title: progress.content.title,
        status: progress.status as any,
        progressPercentage: progress.progress_percentage,
        timeSpentSeconds: progress.time_spent_seconds,
        lastPositionSeconds: progress.last_position_seconds,
        lastAccessedAt: progress.last_accessed_at,
        completedAt: progress.completed_at,
        completionRating: progress.completion_rating,
        completionFeedback: progress.completion_feedback,
      }));
    } catch (error) {
      logger.error(`Error getting user progress history for user ${userId}:`, error);
      throw error;
    }
  }

  async getCompletedContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      const completedProgress = await this.prisma.contentProgress.findMany({
        where: {
          user_id: userId,
          status: 'completed'
        },
        include: {
          content: {
            include: {
              contentTopics: {
                include: {
                  topic: true
                }
              }
            }
          }
        },
        orderBy: { completed_at: 'desc' }
      });

      return completedProgress.map(progress => this.transformToContentWithTopics(progress.content));
    } catch (error) {
      logger.error(`Error getting completed content for user ${userId}:`, error);
      throw error;
    }
  }

  async getInProgressContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      const inProgressContent = await this.prisma.contentProgress.findMany({
        where: {
          user_id: userId,
          status: 'in_progress'
        },
        include: {
          content: {
            include: {
              contentTopics: {
                include: {
                  topic: true
                }
              }
            }
          }
        },
        orderBy: { last_accessed_at: 'desc' }
      });

      return inProgressContent.map(progress => this.transformToContentWithTopics(progress.content));
    } catch (error) {
      logger.error(`Error getting in-progress content for user ${userId}:`, error);
      throw error;
    }
  }

  // Topic operations
  async getAllTopics(): Promise<Topic[]> {
    try {
      const topics = await this.prisma.topic.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      });

      return topics.map(topic => ({
        ...topic,
        prerequisites: topic.prerequisites && typeof topic.prerequisites === 'string' ? JSON.parse(topic.prerequisites) : []
      }));
    } catch (error) {
      logger.error('Error getting all topics:', error);
      throw error;
    }
  }

  async createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    try {
      const created = await this.prisma.topic.create({
        data: {
          ...data,
          color_hex: data.color_hex ?? undefined,
          prerequisites: JSON.stringify(data.prerequisites || []),
        }
      });

      return {
        ...created,
        prerequisites: created.prerequisites && typeof created.prerequisites === 'string' ? JSON.parse(created.prerequisites) : []
      };
    } catch (error) {
      logger.error('Error creating topic:', error);
      throw error;
    }
  }

  async getTopicById(id: string): Promise<Topic | null> {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id }
      });

      if (!topic) return null;

      return {
        ...topic,
        prerequisites: topic.prerequisites && typeof topic.prerequisites === 'string' ? JSON.parse(topic.prerequisites) : []
      };
    } catch (error) {
      logger.error(`Error getting topic by id ${id}:`, error);
      throw error;
    }
  }

  async updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Topic> {
    try {
      const updated = await this.prisma.topic.update({
        where: { id },
        data: {
          ...data,
          color_hex: data.color_hex ?? undefined,
          prerequisites: data.prerequisites ? JSON.stringify(data.prerequisites) : undefined,
          updated_at: new Date(),
        }
      });

      return {
        ...updated,
        prerequisites: updated.prerequisites && typeof updated.prerequisites === 'string' ? JSON.parse(updated.prerequisites) : []
      };
    } catch (error) {
      logger.error(`Error updating topic ${id}:`, error);
      throw error;
    }
  }

  async deleteTopic(id: string): Promise<boolean> {
    try {
      await this.prisma.topic.delete({ where: { id } });
      return true;
    } catch (error) {
      logger.error(`Error deleting topic ${id}:`, error);
      throw error;
    }
  }

  async findTopics(): Promise<Array<{ id: string; name: string; }>> {
    try {
      const topics = await this.prisma.topic.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { sort_order: 'asc' }
      });

      return topics;
    } catch (error) {
      logger.error('Error finding topics:', error);
      throw error;
    }
  }

  async findTopicById(id: string): Promise<{ id: string; name: string; } | null> {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id },
        select: { id: true, name: true }
      });

      return topic;
    } catch (error) {
      logger.error(`Error finding topic by id ${id}:`, error);
      throw error;
    }
  }

  // Module operations
  async findAllModules(): Promise<Array<{ id: string; name: string }>> {
    try {
      return await this.prisma.module.findMany({
        select: { id: true, name: true }
      });
    } catch (error) {
      logger.error('Error finding all modules:', error);
      throw error;
    }
  }

  async findModuleById(id: string): Promise<{ id: string; name: string } | null> {
    try {
      return await this.prisma.module.findUnique({
        where: { id },
        select: { id: true, name: true }
      });
    } catch (error) {
      logger.error(`Error finding module by id ${id}:`, error);
      throw error;
    }
  }

  // Tip operations
  async getAllTips(): Promise<Tip[]> {
    try {
      const tips = await this.prisma.tip.findMany();
      return tips.map(tip => ({
        id: tip.id,
        title: tip.title,
        content: tip.content,
        tip_type: tip.tip_type || '',
        category: null,
        target_age_min: tip.target_age_min,
        target_age_max: tip.target_age_max,
        difficulty_level: tip.difficulty_level,
        action_required: false,
        action_instructions: null,
        estimated_time_minutes: 0,
        impact_level: 'MEDIUM',
        source_url: null,
        image_url: null,
        is_active: true,
        is_featured: false,
        prerequisites: [],
        related_tips: [],
        valid_from: null,
        valid_until: null,
        usage_count: 0,
        created_at: tip.created_at,
        updated_at: tip.updated_at,
        deleted_at: tip.deleted_at,
        created_by: tip.created_by,
        updated_by: tip.updated_by,
        content_id: tip.content_id,
        metadata: tip.metadata ? tip.metadata as Record<string, any> : {}
      }));
    } catch (error) {
      logger.error('Error getting all tips:', error);
      throw error;
    }
  }

  async createTip(
    data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { metadata?: Record<string, any> | null }
  ): Promise<Tip> {
    try {
      const createdTip = await this.prisma.tip.create({
        data: {
          ...data,
          metadata: data.metadata || {}
        }
      });

      return {
        ...createdTip,
        metadata: createdTip.metadata ? createdTip.metadata as Record<string, any> : {}
      };
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

      const tip = await this.prisma.tip.findUnique({
        where: { id },
      });

      return tip ? {
        id: tip.id,
        title: tip.title,
        content: tip.content,
        tip_type: tip.tip_type || '',
        category: null,
        target_age_min: tip.target_age_min,
        target_age_max: tip.target_age_max,
        difficulty_level: tip.difficulty_level,
        action_required: false,
        action_instructions: null,
        estimated_time_minutes: 0,
        impact_level: 'MEDIUM',
        source_url: null,
        image_url: null,
        is_active: true,
        is_featured: false,
        prerequisites: [],
        related_tips: [],
        valid_from: null,
        valid_until: null,
        usage_count: 0,
        created_at: tip.created_at,
        updated_at: tip.updated_at,
        deleted_at: tip.deleted_at,
        created_by: tip.created_by,
        updated_by: tip.updated_by,
        content_id: tip.content_id,
        metadata: tip.metadata && typeof tip.metadata === 'string' ? JSON.parse(tip.metadata) : tip.metadata
      } : null;
    } catch (error) {
      logger.error(`Error finding tip by id ${id}:`, error);
      throw error;
    }
  }

  async updateTip(
    id: string,
    data: Partial<Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { 
      metadata?: Record<string, any> | null | undefined 
    }
  ): Promise<Tip> {
    try {
      // Transform null content_id to undefined
      const updateData = {
        ...data,
        content_id: data.content_id === null ? undefined : data.content_id,
        metadata: data.metadata ? JSON.stringify(data.metadata) : Prisma.JsonNull
      };

      const updatedTip = await this.prisma.tip.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedTip,
        metadata: updatedTip.metadata && typeof updatedTip.metadata === 'string' ? JSON.parse(updatedTip.metadata) : null
      };
    } catch (error) {
      logger.error(`Error updating tip ${id}:`, error);
      throw error;
    }
  }

  async deleteTip(id: string): Promise<boolean> {
    try {
      await this.prisma.tip.delete({ where: { id } });
      return true;
    } catch (error) {
      logger.error(`Error deleting tip ${id}:`, error);
      throw error;
    }
  }

  // Analytics (implementaciones básicas)
  async getContentAnalytics(contentId: string): Promise<ContentAnalytics> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentProgress: true,
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      if (!content) {
        throw new Error('Content not found');
      }

      const totalViews = content.view_count;
      const totalCompletions = content.completion_count;
      const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

      return {
        content_id: contentId,
        title: content.title,
        total_views: totalViews,
        total_completions: totalCompletions,
        completion_rate: completionRate,
        average_time_spent: content.contentProgress.reduce((acc, p) => acc + p.time_spent_seconds, 0) / content.contentProgress.length || 0,
        average_rating: content.rating_average || 0,
        last_updated: content.updated_at,
        engagement_score: (completionRate + (content.rating_average || 0) * 20) / 2,
        abandonment_rate: 100 - completionRate,
        popular_topics: content.contentTopics.map(ct => ({
          topic_id: ct.topic_id,
          name: ct.topic.name,
          view_count: totalViews,
          completion_rate: completionRate
        }))
      };
    } catch (error) {
      logger.error(`Error getting content analytics for ${contentId}:`, error);
      throw error;
    }
  }

  async getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        where: { content_id: contentId }
      });

      const starts = interactions.filter(i => i.action === 'start').length;
      const completions = interactions.filter(i => i.action === 'complete').length;
      const abandons = interactions.filter(i => i.action === 'abandon');

      const avgAbandonmentPoint = abandons.length > 0 
        ? abandons.reduce((acc, a) => acc + (Number(a.progress_at_action) || 0), 0) / abandons.length 
        : 0;

      const abandonmentByDevice = abandons.reduce((acc, a) => {
        const device = a.device_type || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        contentId,
        totalStarts: starts,
        totalCompletions: completions,
        completionRate: starts > 0 ? (completions / starts) * 100 : 0,
        avgAbandonmentPoint,
        abandonmentByDevice
      };
    } catch (error) {
      logger.error(`Error getting abandonment analytics for ${contentId}:`, error);
      throw error;
    }
  }

  async getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics> {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          contentTopics: {
            include: {
              content: {
                include: {
                  contentProgress: true
                }
              }
            }
          }
        }
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      const contents = topic.contentTopics.map(ct => ct.content);
      const totalContent = contents.length;
      const totalViews = contents.reduce((acc, c) => acc + c.view_count, 0);
      const totalCompletions = contents.reduce((acc, c) => acc + c.completion_count, 0);
      const averageCompletionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

      const allProgress = contents.flatMap(c => c.contentProgress);
      const averageTimeSpent = allProgress.length > 0 
        ? allProgress.reduce((acc, p) => acc + p.time_spent_seconds, 0) / allProgress.length 
        : 0;

      const averageRating = contents.reduce((acc, c) => acc + (c.rating_average || 0), 0) / totalContent || 0;

      return {
        topicId,
        topicName: topic.name,
        totalContent,
        totalViews,
        totalCompletions,
        averageCompletionRate,
        averageTimeSpent,
        averageRating,
        mostEngagedContent: contents
          .sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0))
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            title: c.title,
            completionRate: c.view_count > 0 ? (c.completion_count / c.view_count) * 100 : 0,
            averageRating: c.rating_average || 0
          })),
        leastEngagedContent: contents
          .sort((a, b) => (a.rating_average || 0) - (b.rating_average || 0))
          .slice(0, 5)
          .map(c => ({
            id: c.id,
            title: c.title,
            completionRate: c.view_count > 0 ? (c.completion_count / c.view_count) * 100 : 0,
            averageRating: c.rating_average || 0
          }))
      };
    } catch (error) {
      logger.error(`Error getting effectiveness analytics for topic ${topicId}:`, error);
      throw error;
    }
  }

  async findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: { is_published: true },
        include: {
          _count: {
            select: {
              contentProgress: {
                where: { status: 'completed' }
              }
            }
          }
        },
        take: limit
      });

      const problematicContent = contents
        .map(content => {
          const completionRate = content.view_count > 0 
            ? (content._count.contentProgress / content.view_count) * 100 
            : 0;
          
          return {
            contentId: content.id,
            title: content.title,
            completionRate,
            avgAbandonmentPoint: 50, // Este sería calculado con más lógica
            priority: completionRate < 20 ? 'CRÍTICO' as const :
                     completionRate < 40 ? 'ALTO' as const :
                     completionRate < 60 ? 'MEDIO' as const : 'BAJO' as const,
            recommendation: completionRate < 20 
              ? 'Revisión urgente necesaria'
              : completionRate < 40 
                ? 'Considerar rediseñar contenido'
                : 'Revisar para mejoras menores'
          };
        })
        .filter(content => content.completionRate < threshold);

      return problematicContent;
    } catch (error) {
      logger.error(`Error finding problematic content:`, error);
      throw error;
    }
  }

  // Bulk operations
  async bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const data of progressData) {
          await tx.contentProgress.upsert({
            where: {
              user_id_content_id: {
                user_id: data.userId,
                content_id: data.contentId
              }
            },
            update: {
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              last_accessed_at: new Date(),
              updated_at: new Date(),
            },
            create: {
              user_id: data.userId,
              content_id: data.contentId,
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              first_accessed_at: new Date(),
              last_accessed_at: new Date(),
            }
          });
        }
      });
    } catch (error) {
      logger.error('Error bulk tracking progress:', error);
      throw error;
    }
  }

  async bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void> {
    try {
      await this.prisma.contentInteractionLog.createMany({
        data: interactions.map(interaction => ({
          user_id: interaction.userId,
          content_id: interaction.contentId,
          session_id: interaction.sessionId,
          action: interaction.action,
          action_timestamp: new Date(),
          progress_at_action: interaction.progressAtAction ? Number(interaction.progressAtAction) : null,
          time_spent_seconds: interaction.timeSpentSeconds || 0,
          device_type: interaction.deviceType,
          platform: interaction.platform,
          abandonment_reason: interaction.abandonmentReason,
          came_from: interaction.cameFrom,
          metadata: interaction.metadata ? JSON.stringify(interaction.metadata) : Prisma.JsonNull,
        }))
      });
    } catch (error) {
      logger.error('Error bulk logging interactions:', error);
      throw error;
    }
  }

  // Private helper methods
  private transformToContent(content: any): Content {
    return {
      ...content,
      metadata: content.metadata && typeof content.metadata === 'string' ? JSON.parse(content.metadata) : content.metadata,
      contentTopics: content.contentTopics || []
    };
  }

  private transformToContentWithTopics(content: any): ContentWithTopics {
    return {
      ...content,
      metadata: content.metadata && typeof content.metadata === 'string' ? JSON.parse(content.metadata) : content.metadata,
      contentTopics: content.contentTopics?.map((ct: any) => ({
        ...ct,
        topic: ct.topic ? {
          ...ct.topic,
          prerequisites: ct.topic.prerequisites && typeof ct.topic.prerequisites === 'string' ? JSON.parse(ct.topic.prerequisites) : []
        } : undefined
      })) || []
    };
  }

  private buildWhereClause(filters: ContentFilters): any {
    const where: any = {};

    if (filters.contentIds?.length) {
      where.id = { in: filters.contentIds };
    }

    if (filters.topicId) {
      where.contentTopics = {
        some: { topic_id: filters.topicId }
      };
    }

    if (filters.age !== undefined) {
      where.target_age_min = { lte: filters.age };
      where.target_age_max = { gte: filters.age };
    }

    if (filters.difficultyLevel) {
      where.difficulty_level = this.mapDifficultyLevel(filters.difficultyLevel as string);
    }

    if (filters.contentType) {
      where.content_type = this.mapContentType(filters.contentType as string);
    }

    if (filters.isPublished !== undefined) {
      where.is_published = filters.isPublished;
    }

    if (filters.searchTerm) {
      where.OR = [
        { title: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } }
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    return where;
  }

  private buildOrderBy(filters: ContentFilters): any {
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }

  private mapContentType(contentType: string): ContentType {
    const lowerType = contentType.toLowerCase();
    switch (lowerType) {
      case 'video': return 'VIDEO';
      case 'article': return 'ARTICLE';
      case 'quiz': return 'QUIZ';
      case 'interactive': return 'INTERACTIVE';
      case 'presentation': return 'INTERACTIVE';
      case 'document': return 'ARTICLE';
      default: return 'OTHER';
    }
  }

  private mapDifficultyLevel(level: string): DifficultyLevel {
    return DifficultyLevel[level.toUpperCase() as keyof typeof DifficultyLevel];
  }
}