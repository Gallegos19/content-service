import { PrismaClient, Prisma } from '@prisma/client';
import { 
  Content, 
  ContentWithTopics, 
  ContentTopic, 
  Topic, 
  Tip, 
  ContentAnalytics, 
  AbandonmentAnalytics, 
  EffectivenessAnalytics, 
  ProblematicContent, 
  UserProgress, 
  ContentProgress,
  ContentFilters,
  ContentInteractionLog,
  InteractionAction,
  DeviceType,
  PlatformType,
  AbandonmentReason,
  CameFromType,
  ProgressStatus
} from '../../../domain/entities/content.entity';

import { PaginatedResult } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { TYPES } from '@shared/constants/types';
import { Logger } from 'winston';
import { IContentRepository } from '../../../domain/repositories/content.repository';
import { AnalyticsFilters } from '../../../domain/dtos/analytics-filters.dto';
import { Injectable, inject } from '@nestjs/common';

interface PrismaContentData extends Prisma.ContentGetPayload<{}> {}
interface PrismaContentWithTopics extends Prisma.ContentGetPayload<{
  include: {
    contentTopics: {
      include: {
        topic: true
      }
    },
    contentInteractionLog: true,
    contentProgress: true
  }
}> {}

@Injectable()
export class PrismaContentRepository implements IContentRepository {
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<Content | null> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id },
        include: {
          contentTopics: {
            include: { topic: true }
          },
          contentInteractionLog: true,
          contentProgress: true
        }
      });

      if (!content) {
        return null;
      }

      return this.convertPrismaContentWithTopicsToDomain(content);
    } catch (error) {
      this.logger.error('Error finding content by id:', { error, id });
      throw error;
    }
  }

  async findByTopicId(topicId: string): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentTopics: {
            some: {
              topic_id: topicId
            }
          }
        },
        include: {
          contentTopics: {
            where: { topic_id: topicId },
            include: { topic: true }
          },
          contentInteractionLog: true,
          contentProgress: true
        }
      });

      return contents.map(content => this.convertPrismaContentWithTopicsToDomain(content));
    } catch (error) {
      this.logger.error('Error finding content by topic id:', { error, topicId });
      throw error;
    }
  }

  async create(content: Content): Promise<Content> {
    try {
      const created = await this.prisma.content.create({
        data: {
          ...content,
          metadata: content.metadata || null,
          progressAtAction: content.progressAtAction || null
        }
      });

      return this.convertPrismaContentToDomain(created);
    } catch (error) {
      this.logger.error('Error creating content:', { error, content });
      throw error;
    }
  }

  async update(id: string, content: Partial<Content>): Promise<Content> {
    try {
      const updated = await this.prisma.content.update({
        where: { id },
        data: {
          ...content,
          metadata: content.metadata || null,
          progressAtAction: content.progressAtAction || null
        }
      });

      return this.convertPrismaContentToDomain(updated);
    } catch (error) {
      this.logger.error('Error updating content:', { error, id, content });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.content.delete({
        where: { id }
      });
    } catch (error) {
      this.logger.error('Error deleting content:', { error, id });
      throw error;
    }
  }

  async addTopic(contentId: string, topicId: string): Promise<void> {
    try {
      await this.prisma.contentTopic.create({
        data: {
          content_id: contentId,
          topic_id: topicId
        }
      });
    } catch (error) {
      this.logger.error('Error adding topic to content:', { error, contentId, topicId });
      throw error;
    }
  }

  async removeTopic(contentId: string, topicId: string): Promise<void> {
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
      this.logger.error('Error removing topic from content:', { error, contentId, topicId });
      throw error;
    }
  }

  async getAnalytics(filters: ContentFilters): Promise<ContentAnalytics[]> {
    try {
      const analytics = await this.prisma.content.groupBy({
        by: ['id'],
        where: {
          ...filters,
          deleted_at: null
        },
        _count: {
          contentInteractionLog: true,
          contentProgress: true
        },
        _avg: {
          rating: true,
          progressAtAction: true
        }
      });

      return analytics.map(a => ({
        contentId: a.id,
        totalViews: a._count.contentInteractionLog,
        totalCompletions: a._count.contentProgress,
        averageRating: Number(a._avg.rating) || 0,
        averageProgress: Number(a._avg.progressAtAction) || 0
      }));
    } catch (error) {
      this.logger.error('Error getting content analytics:', { error, filters });
      throw error;
    }
  }

  async logInteraction(userId: string, contentId: string, interaction: ContentInteractionLog): Promise<void> {
    try {
      await this.prisma.contentInteractionLog.create({
        data: {
          ...interaction,
          user_id: userId,
          content_id: contentId
        }
      });
    } catch (error) {
      this.logger.error('Error logging content interaction:', { error, userId, contentId, interaction });
      throw error;
    }
  }

  async trackProgress(userId: string, contentId: string, progress: ContentProgress): Promise<void> {
    try {
      await this.prisma.contentProgress.upsert({
        where: {
          user_id_content_id: {
            user_id: userId,
            content_id: contentId
          }
        },
        create: {
          ...progress,
          user_id: userId,
          content_id: contentId
        },
        update: {
          ...progress
        }
      });
    } catch (error) {
      this.logger.error('Error tracking content progress:', { error, userId, contentId, progress });
      throw error;
    }
  }

  async getUserProgressHistory(userId: string): Promise<ContentProgress[]> {
    try {
      const progress = await this.prisma.contentProgress.findMany({
        where: {
          user_id: userId
        },
        include: {
          content: true
        },
        orderBy: {
          updated_at: 'desc'
        }
      });

      return progress.map(p => ({
        contentId: p.content_id,
        progress: p.progress,
        completedAt: p.completed_at,
        lastUpdatedAt: p.updated_at
      }));
    } catch (error) {
      this.logger.error('Error getting user progress history:', { error, userId });
      throw error;
    }
  }

  async addTopicToContent(contentId: string, topicId: string, isPrimary = false): Promise<void> {
    try {
      await this.prisma.contentTopic.create({
        data: {
          content_id: contentId,
          topic_id: topicId,
          is_primary: isPrimary,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Error adding topic ${topicId} to content ${contentId}:`, error);
      throw error;
    }
  }

  async removeTopicFromContent(contentId: string, topicId: string): Promise<void> {
    try {
      await this.prisma.contentTopic.deleteMany({
        where: {
          content_id: contentId,
          topic_id: topicId
        }
      });
    } catch (error) {
      this.logger.error(`Error removing topic ${topicId} from content ${contentId}:`, error);
      throw error;
    }
  }

  async setPrimaryTopic(contentId: string, topicId: string): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.contentTopic.updateMany({
          where: { content_id: contentId },
          data: { is_primary: false }
        }),
        this.prisma.contentTopic.updateMany({
          where: { content_id: contentId, topic_id: topicId },
          data: { is_primary: true }
        })
      ]);
    } catch (error) {
      this.logger.error(`Error setting primary topic ${topicId} for content ${contentId}:`, error);
      throw error;
    }
  }

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

      if (!progress) {
        return null;
      }

      return {
        contentId: progress.content_id,
        title: progress.content.title,
        status: progress.status as ProgressStatus,
        progressPercentage: Number(progress.progress_percentage),
        timeSpentSeconds: Number(progress.time_spent_seconds),
        lastPositionSeconds: Number(progress.last_position_seconds),
        lastAccessedAt: progress.updated_at,
        completedAt: progress.completed_at,
        completionRating: progress.completion_rating ? Number(progress.completion_rating) : undefined,
        completionFeedback: progress.completion_feedback || undefined
      };
    } catch (error) {
      this.logger.error(`Error getting user progress for ${userId} on content ${contentId}:`, error);
      throw error;
    }
  }

  async trackProgress(userId: string, contentId: string, progressData: ProgressData): Promise<UserProgress> {
    try {
      const progress = await this.prisma.contentProgress.upsert({
        where: {
          user_id_content_id: {
            user_id: userId,
            content_id: contentId
          }
        },
        create: {
          user_id: userId,
          content_id: contentId,
          status: progressData.status,
          progress_percentage: progressData.progressPercentage,
          time_spent_seconds: progressData.timeSpentSeconds,
          last_position_seconds: progressData.lastPositionSeconds || 0,
          completion_rating: progressData.completionRating,
          completion_feedback: progressData.completionFeedback,
          created_at: new Date(),
          updated_at: new Date()
        },
        update: {
          status: progressData.status,
          progress_percentage: progressData.progressPercentage,
          time_spent_seconds: progressData.timeSpentSeconds,
          last_position_seconds: progressData.lastPositionSeconds,
          completion_rating: progressData.completionRating,
          completion_feedback: progressData.completionFeedback,
          updated_at: new Date()
        },
        include: {
          content: true
        }
      });

      return {
        contentId: progress.content_id,
        title: progress.content.title,
        status: progress.status as ProgressStatus,
        progressPercentage: Number(progress.progress_percentage),
        timeSpentSeconds: Number(progress.time_spent_seconds),
        lastPositionSeconds: Number(progress.last_position_seconds),
        lastAccessedAt: progress.updated_at,
        completedAt: progress.completed_at,
        completionRating: progress.completion_rating ? Number(progress.completion_rating) : undefined,
        completionFeedback: progress.completion_feedback || undefined
      };
    } catch (error) {
      this.logger.error(`Error tracking progress for user ${userId} on content ${contentId}:`, error);
      throw error;
    }
  }

  async bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void> {
    try {
      await this.prisma.$transaction(
        interactions.map(interaction =>
          this.prisma.contentInteractionLog.create({
            data: {
              userId: interaction.userId,
              contentId: interaction.contentId,
              sessionId: interaction.sessionId,
              action: interaction.action,
              progressAtAction: interaction.progressAtAction,
              timeSpentSeconds: interaction.timeSpentSeconds,
              deviceType: interaction.deviceType,
              platform: interaction.platform,
              abandonmentReason: interaction.abandonmentReason,
              cameFrom: interaction.cameFrom,
              metadata: interaction.metadata,
              actionTimestamp: new Date()
            }
          })
        )
      );
    } catch (error) {
      this.logger.error('Error logging interactions:', error);
      throw error;
    }
  }

  async getContentAnalytics(filters: ContentFilters): Promise<ContentAnalytics[]> {
    try {
      const analytics = await this.prisma.content.findMany({
        where: {
          id: filters.contentIds ? { in: filters.contentIds } : undefined,
          deleted_at: null,
          ...filters.topicId && {
            contentTopics: {
              some: {
                topic_id: filters.topicId
              }
            }
          },
          ...filters.age && {
            target_age_min: { lte: filters.age },
            target_age_max: { gte: filters.age }
          },
          ...filters.difficultyLevel && {
            difficulty_level: filters.difficultyLevel
          },
          ...filters.contentType && {
            content_type: filters.contentType
          },
          ...filters.isPublished && {
            is_published: filters.isPublished
          }
        },
        select: {
          id: true,
          title: true,
          view_count: true,
          completion_count: true,
          rating_average: true,
          contentTopics: {
            include: {
              topic: true
            }
          },
          contentInteractionLog: {
            where: {
              action: 'start'
            },
            _count: true
          }
        }
      });

      return analytics.map(content => ({
        content_id: content.id,
        title: content.title,
        total_views: content.view_count,
        total_completions: content.completion_count,
        completion_rate: content.completion_count / content.view_count,
        average_time_spent: content.contentInteractionLog._count / content.view_count,
        average_rating: content.rating_average,
        last_updated: new Date(),
        engagement_score: content.completion_count / content.view_count * 100,
        abandonment_rate: 0, // This would require additional queries
        popular_topics: content.contentTopics.map(topic => ({
          topic_id: topic.topic_id,
          name: topic.topic.name,
          view_count: 0, // This would require additional queries
          completion_rate: 0 // This would require additional queries
        }))
      }));
    } catch (error) {
      this.logger.error('Error getting content analytics:', error);
      throw error;
    }
  }

  async getAbandonmentAnalytics(filters: ContentFilters): Promise<AbandonmentAnalytics[]> {
    try {
      const analytics = await this.prisma.contentInteractionLog.groupBy({
        by: ['content_id'],
        _count: {
          _all: true
        },
        _avg: {
          progressAtAction: true
        },
        where: {
          action: 'abandon',
          ...filters.startDate && {
            actionTimestamp: {
              gte: filters.startDate
            }
          },
          ...filters.endDate && {
            actionTimestamp: {
              lte: filters.endDate
            }
          },
          ...filters.contentIds && {
            contentId: { in: filters.contentIds }
          },
          ...filters.userIds && {
            userId: { in: filters.userIds }
          }
        }
      });

      const contents = await this.prisma.content.findMany({
        where: {
          id: analytics.map(a => a.content_id),
          deleted_at: null
        },
        select: {
          id: true,
          title: true
        }
      });

      const contentMap = new Map(contents.map(c => [c.id, c]));

      return analytics.map(a => ({
        contentId: a.content_id,
        title: contentMap.get(a.content_id)?.title || '',
        totalStarts: 0, // This would require additional queries
        totalCompletions: 0, // This would require additional queries
        completionRate: 0, // This would require additional queries
        avgAbandonmentPoint: a._avg.progressAtAction || 0,
        abandonmentByDevice: {} // This would require additional queries
      }));
    } catch (error) {
      this.logger.error('Error getting abandonment analytics:', error);
      throw error;
    }
  }

  async getEffectivenessAnalytics(filters: ContentFilters): Promise<EffectivenessAnalytics[]> {
    try {
      const analytics = await this.prisma.topic.findMany({
        where: {
          contentTopics: {
            some: {
              content: {
                deleted_at: null,
                ...filters.contentIds && {
                  id: { in: filters.contentIds }
                },
                ...filters.age && {
                  target_age_min: { lte: filters.age },
                  target_age_max: { gte: filters.age }
                },
                ...filters.difficultyLevel && {
                  difficulty_level: filters.difficultyLevel
                },
                ...filters.contentType && {
                  content_type: filters.contentType
                },
                ...filters.isPublished && {
                  is_published: filters.isPublished
                }
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          contentTopics: {
            include: {
              content: {
                select: {
                  id: true,
                  title: true,
                  contentProgress: {
                    where: {
                      status: 'COMPLETED'
                    },
                    _count: true
                  }
                }
              }
            }
          }
        }
      });

      return analytics.map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        totalContent: topic.contentTopics.length,
        totalViews: 0, // This would require additional queries
        totalCompletions: topic.contentTopics.reduce((sum, ct) => sum + ct.content.contentProgress._count, 0),
        averageCompletionRate: topic.contentTopics.reduce((sum, ct) => sum + ct.content.contentProgress._count, 0) / topic.contentTopics.length,
        averageTimeSpent: 0, // This would require additional queries
        averageRating: 0, // This would require additional queries
        mostEngagedContent: [], // This would require additional queries
        leastEngagedContent: [] // This would require additional queries
      }));
    } catch (error) {
      this.logger.error('Error getting effectiveness analytics:', error);
      throw error;
    }
  }

  async findProblematicContent(filters: ContentFilters): Promise<ProblematicContent[]> {
    try {
      const analytics = await this.prisma.content.findMany({
        where: {
          deleted_at: null,
          ...filters.contentIds && {
            id: { in: filters.contentIds }
          },
          ...filters.age && {
            target_age_min: { lte: filters.age },
            target_age_max: { gte: filters.age }
          },
          ...filters.difficultyLevel && {
            difficulty_level: filters.difficultyLevel
          },
          ...filters.contentType && {
            content_type: filters.contentType
          },
          ...filters.isPublished && {
            is_published: filters.isPublished
          }
        },
        select: {
          id: true,
          title: true,
          contentInteractionLog: {
            where: {
              action: 'abandon'
            },
            _count: true
          },
          contentProgress: {
            where: {
              status: 'COMPLETED'
            },
            _count: true
          }
        }
      });

      return analytics.map(content => ({
        contentId: content.id,
        title: content.title,
        completionRate: content.contentProgress._count / content.contentInteractionLog._count,
        avgAbandonmentPoint: 0, // This would require additional queries
        priority: 'BAJO', // This would be calculated based on metrics
        recommendation: '' // This would be generated based on metrics
      }));
    } catch (error) {
      this.logger.error('Error finding problematic content:', error);
      throw error;
    }
  }

  async getAnalytics(filters: AnalyticsFilters): Promise<ContentAnalytics> {
    try {
      const [totalViews, totalInteractions, avgTimeSpent, completionRate] = await Promise.all([
        this.prisma.contentInteractionLog.count({
          where: {
            action: 'start',
            created_at: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          }
        }),
        this.prisma.contentInteractionLog.count({
          where: {
            created_at: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          }
        }),
        this.prisma.contentInteractionLog.aggregate({
          where: {
            created_at: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          },
          _avg: {
            time_spent_seconds: true
          }
        }),
        this.prisma.contentProgress.count({
          where: {
            status: 'completed',
            created_at: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          }
        })
      ]);

      return {
        totalViews,
        totalInteractions,
        avgTimeSpent: avgTimeSpent._avg.time_spent_seconds || 0,
        completionRate: (completionRate / totalViews) * 100 || 0,
        engagementMetrics: await this.prisma.contentInteractionLog.groupBy({
          by: ['platform', 'device_type', 'browser', 'os'],
          _count: true,
          where: {
            created_at: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          }
        })
      };
    } catch (error) {
      this.logger.error('Error getting content analytics:', error);
      throw error;
    }
  }

  async findRelatedContent(contentId: string, limit = 5): Promise<ContentWithTopics[]> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        }
      });

      if (!content || !content.contentTopics?.length) {
        return [];
      }

      const related = await this.prisma.content.findMany({
        where: {
          AND: [
            {
              contentTopics: {
                some: {
                  topic_id: {
                    in: content.contentTopics.map(ct => ct.topic_id)
                  }
                }
              }
            },
            {
              id: {
                not: contentId
              }
            }
          ]
        },
        include: {
          contentTopics: {
            include: {
              topic: true
            }
          }
        },
        take: limit
      });

      return related;
    } catch (error) {
      this.logger.error(`Error finding related content for ${contentId}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<ContentWithTopics | null> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });
      
      if (!content) {
        return null;
      }

      return {
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.id,
          topic_id: ct.topic_id,
          is_primary: ct.is_primary,
          topic: {
            id: ct.topic.id,
            name: ct.topic.name
          }
        }))
      };
    } catch (error) {
      logger.error(`Error finding content by id ${id}:`, error);
      throw error;
    }
  }

  async findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>> {
    try {
      const { page = 1, limit = 10, ...prismaFilters } = filters;
      const skip = (page - 1) * limit;

      const [total, contents] = await Promise.all([
        this.prisma.content.count({ where: prismaFilters }),
        this.prisma.content.findMany({
          where: prismaFilters,
          include: {
            contentTopics: {
              include: { topic: true }
            }
          },
          skip,
          take: limit
        })
      ]);

      return {
        total,
        page,
        limit,
        data: contents.map(content => ({
          ...content,
          contentTopics: content.contentTopics.map((ct: any) => ({
            id: ct.id,
            content_id: content.id,
            topic_id: ct.topic_id,
            is_primary: ct.is_primary,
            created_at: ct.created_at,
            updated_at: ct.updated_at,
            deleted_at: ct.deleted_at,
            topic: {
              id: ct.topic.id,
              name: ct.topic.name,
              created_at: ct.topic.created_at,
              updated_at: ct.topic.updated_at,
              deleted_at: ct.topic.deleted_at
            }
          }))
        })) as ContentWithTopics[]
      };
    } catch (error) {
      logger.error('Error finding content:', error);
      throw error;
    }
  }

  async create(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Content> {
    try {
      const content = await this.prisma.content.create({
        data: {
          ...data,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      return content;
    } catch (error) {
      logger.error('Error creating content:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Content> {
    try {
      const content = await this.prisma.content.update({
        where: { id },
        data: {
          ...data,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          updated_at: new Date()
        }
      });
      return content;
    } catch (error) {
      logger.error(`Error updating content ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id }
      });

      if (!content) {
        return false;
      }

      await this.prisma.content.update({
        where: { id },
        data: { deleted_at: new Date() }
      });

      return true;
    } catch (error) {
      logger.error(`Error deleting content ${id}:`, error);
      throw error;
    }
  }

  async getContentInteractions(contentId: string, action?: string): Promise<ContentInteractionLog[]> {
    try {
      const where: Prisma.ContentInteractionLogWhereInput = { content_id: contentId };
      if (action) {
        where.action = action;
      }
      const prismaInteractions = await this.prisma.contentInteractionLog.findMany({
        where,
        orderBy: { action_timestamp: 'desc' }
      });
      
      return prismaInteractions.map(interaction => {
        const mappedAction = interaction.action as InteractionAction;
        const mappedDeviceType = interaction.device_type as DeviceType | null;
        const mappedPlatform = interaction.platform as PlatformType | null;
        const mappedAbandonmentReason = interaction.abandonment_reason as AbandonmentReason | null;
        const mappedCameFrom = interaction.came_from as CameFromType | null;

        return {
          id: interaction.id,
          userId: interaction.user_id,
          contentId: interaction.content_id,
          sessionId: interaction.session_id,
          action: mappedAction,
          actionTimestamp: interaction.action_timestamp,
          progressAtAction: interaction.progress_at_action,
          timeSpentSeconds: interaction.time_spent_seconds,
          deviceType: mappedDeviceType,
          platform: mappedPlatform,
          abandonmentReason: mappedAbandonmentReason,
          cameFrom: mappedCameFrom,
          metadata: interaction.metadata
        };
      });
    } catch (error) {
      logger.error(`Error getting content interactions for ${contentId}:`, error);
      throw error;
    }
  }

  async getAbandonmentAnalyticsForContent(contentId: string): Promise<AbandonmentAnalytics> {
    try {
      const totalStarts = await this.prisma.contentInteractionLog.count({
        where: {
          content_id: contentId,
          action: 'start'
        }
      });

      const totalCompletions = await this.prisma.contentInteractionLog.count({
        where: {
          content_id: contentId,
          action: 'complete'
        }
      });

      const abandonmentResult = await this.prisma.contentInteractionLog.aggregate({
        where: {
          content_id: contentId,
          action: 'abandon'
        },
        _avg: {
          progress_at_action: true
        },
        _count: true
      });

      const abandonmentByDevice = await this.prisma.contentInteractionLog.groupBy({
        by: ['device_type'],
        where: {
          content_id: contentId,
          action: 'abandon',
          device_type: {
            not: null
          }
        },
        _count: true
      });

      const abandonmentByDeviceMap = abandonmentByDevice.reduce((acc: Record<string, number>, item: any) => {
        if (item.deviceType) {
          acc[item.deviceType] = item._count;
        }
        return acc;
      }, {} as Record<string, number>);

      return {
        contentId,
        totalStarts,
        totalCompletions,
        completionRate: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
        avgAbandonmentPoint: Number(abandonmentResult._avg.progress_at_action) || 0,
        abandonmentByDevice: abandonmentByDeviceMap
      };
    } catch (error) {
      logger.error(`Error getting abandonment analytics for content ${contentId}:`, error);
      throw error;
    }
  }

  async getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics> {
    try {
      const totalContent = await this.prisma.content.count({
        where: {
          contentTopics: {
            some: {
              topic_id: topicId
            }
          }
        }
      });
      
      const totalCompletions = await this.prisma.contentProgress.count({
        where: {
          content: {
            contentTopics: {
              some: {
                topic_id: topicId
              }
            }
          },
          status: 'completed'
        }
      });
      
      const avgCompletionTime = await this.prisma.contentProgress.aggregate({
        where: {
          content: {
            contentTopics: {
              some: {
                topic_id: topicId
              }
            }
          },
          status: 'completed'
        },
        _avg: { time_spent_seconds: true }
      });

      return {
        topicId,
        totalContent,
        totalCompletions,
        completionRate: totalContent > 0 ? (totalCompletions / totalContent) * 100 : 0,
        averageCompletionTime: Number(avgCompletionTime._avg.time_spent_seconds) || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Error getting effectiveness analytics for topic ${topicId}:`, error);
      throw error;
    }
  }

  async findProblematicContent(threshold: number = 30, limit: number = 20): Promise<ProblematicContent[]> {
    try {
      const problematicContent = await this.prisma.$queryRaw<ProblematicContent[]>`
        WITH content_metrics AS (
          SELECT 
            c.id as "contentId",
            c.title,
            COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.userId ELSE NULL END) * 100.0 / 
            COUNT(DISTINCT cp.userId) as "completionRate",
            COUNT(DISTINCT cp.userId) as "totalUsers"
          FROM content c
          LEFT JOIN content_progress cp ON c.id = cp.content_id
          GROUP BY c.id, c.title
        )
        SELECT * FROM content_metrics
        WHERE completionRate < ${threshold}
        ORDER BY completionRate ASC
        LIMIT ${limit}
      `;

      return problematicContent;
    } catch (error) {
      logger.error('Error finding problematic content:', error);
      throw error;
    }
  }

  async getAllTopics(): Promise<Topic[]> {
    try {
      return await this.prisma.topic.findMany({
        where: { deleted_at: null },
        orderBy: { sort_order: 'asc' }
      });
    } catch (error) {
      logger.error('Error getting all topics:', error);
      throw error;
    }
  }

  async createTopic(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Topic> {
    try {
      return await this.prisma.topic.create({
        data: {
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error('Error creating topic:', error);
      throw error;
    }
  }

  async getTopicById(id: string): Promise<{ id: string; name: string; } | null> {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id },
        select: {
          id: true,
          name: true
        }
      });
      return topic;
    } catch (error) {
      logger.error(`Error getting topic by id ${id}:`, error);
      throw error;
    }
  }

  async updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Topic> {
    try {
      return await this.prisma.topic.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date()
        }
      });
    } catch (error) {
      logger.error(`Error updating topic ${id}:`, error);
      throw error;
    }
  }

  async deleteTopic(id: string): Promise<void> {
    try {
      await this.prisma.topic.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
    } catch (error) {
      logger.error(`Error deleting topic ${id}:`, error);
      throw error;
    }
  }

  async getUserInteractions(userId: string, contentId?: string): Promise<ContentInteractionLog[]> {
    try {
      const where: Prisma.ContentInteractionLogWhereInput = { user_id: userId };
      if (contentId) {
        where.content_id = contentId;
      }

      const interactions = await this.prisma.contentInteractionLog.findMany({
        where,
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        ...interaction,
        progress_at_action: Number(interaction.progress_at_action),
        time_spent_seconds: Number(interaction.time_spent_seconds)
      }));
    } catch (error) {
      logger.error(`Error getting user interactions for ${userId}:`, error);
      throw error;
    }
  }

  async trackInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    return this.logInteraction(interaction);
  }

  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentTopics: {
            some: {
              topic_id: topicId
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map((content: any) => ({
        ...content,
        contentTopics: content.contentTopics.map((ct: any) => ({
          id: ct.id,
          content_id: content.id,
          topic_id: ct.topic_id,
          is_primary: ct.is_primary,
          created_at: ct.created_at,
          updated_at: ct.updated_at,
          deleted_at: ct.deleted_at,
          topic: {
            id: ct.topic.id,
            name: ct.topic.name,
            created_at: ct.topic.created_at,
            updated_at: ct.topic.updated_at,
            deleted_at: ct.topic.deleted_at
          }
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      logger.error(`Error finding content by topic ${topicId}:`, error);
      throw error;
    }
  }

  async findContentByAge(age: number): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          age_range: {
            contains: age.toString()
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map((ct: any) => ({
          id: ct.id,
          content_id: content.id,
          topic_id: ct.topic_id,
          is_primary: ct.is_primary,
          created_at: ct.created_at,
          updated_at: ct.updated_at,
          deleted_at: ct.deleted_at,
          topic: {
            id: ct.topic.id,
            name: ct.topic.name,
            created_at: ct.topic.created_at,
            updated_at: ct.topic.updated_at,
            deleted_at: ct.topic.deleted_at
          }
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      logger.error(`Error finding content by age ${age}:`, error);
      throw error;
    }
  }

  async findFeaturedContent(limit: number = 10): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          is_featured: true,
          deleted_at: null
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map((ct: any) => ({
          id: ct.id,
          content_id: content.id,
          topic_id: ct.topic_id,
          is_primary: ct.is_primary,
          created_at: ct.created_at,
          updated_at: ct.updated_at,
          deleted_at: ct.deleted_at,
          topic: {
            id: ct.topic.id,
            name: ct.topic.name,
            created_at: ct.topic.created_at,
            updated_at: ct.topic.updated_at,
            deleted_at: ct.topic.deleted_at
          }
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      this.logger.error('Error finding featured content:', { error });
      throw error;
    }
  }

  async findRelatedContent(contentId: string, limit: number = 5): Promise<ContentWithTopics[]> {
    try {
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      if (!content) {
        return [];
      }

      const relatedContents = await this.prisma.content.findMany({
        where: {
          id: { not: contentId },
          contentTopics: {
            some: {
              topic_id: {
                in: content.contentTopics.map(ct => ct.topic_id)
              }
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        },
        orderBy: {
          view_count: 'desc'
        },
        take: limit
      });

      return relatedContents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.id,
          content_id: content.id,
          topic_id: ct.topic_id,
          is_primary: ct.is_primary,
          created_at: ct.created_at,
          updated_at: ct.updated_at,
          deleted_at: ct.deleted_at,
          topic: {
            id: ct.topic.id,
            name: ct.topic.name,
            created_at: ct.topic.created_at,
            updated_at: ct.topic.updated_at,
            deleted_at: ct.topic.deleted_at
          }
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      this.logger.error(`Error finding related content for ${contentId}:`, { error, contentId });
      throw error;
    }
  }

  async getUserProgressHistory(userId: string): Promise<UserProgress[]> {
    try {
      const progress = await this.prisma.contentProgress.findMany({
        where: { user_id: userId },
        include: { content: true },
        orderBy: { last_accessed_at: 'desc' }
      });

      return progress.map(p => ({
        contentId: p.content_id,
        title: p.content.title,
        status: p.status as ProgressStatus,
        progressPercentage: Number(p.progress_percentage),
        timeSpentSeconds: Number(p.time_spent_seconds),
        lastPositionSeconds: Number(p.last_position_seconds),
        lastAccessedAt: p.last_accessed_at,
        completedAt: p.completed_at,
        completionRating: p.completion_rating ? Number(p.completion_rating) : undefined,
        completionFeedback: p.completion_feedback || undefined
      }));
    } catch (error) {
      logger.error(`Error getting user progress history for ${userId}:`, error);
      throw error;
    }
  }
  }

  async getCompletedContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'completed',
              deleted_at: null
            }
          },
          deleted_at: null
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        },
        orderBy: {
          contentProgress: {
            completed_at: 'desc'
          }
        }
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.topic_id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      logger.error(`Error getting completed content for ${userId}:`, error);
      throw error;
    }
  }
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'completed'
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.topic.id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      }));
    } catch (error) {
      logger.error(`Error getting completed content for ${userId}:`, error);
      throw error;
    }
  }
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'completed'
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map(content => ({
        ...content,
        topics: content.contentTopics.map(ct => ({
          id: ct.topic.id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      }));
    } catch (error) {

  async getInProgressContent(userId: string): Promise<ContentWithTopics[]> {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'in_progress',
              deleted_at: null
            }
          },
          deleted_at: null
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        },
        orderBy: {
          contentProgress: {
            last_accessed_at: 'desc'
          }
        }
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.topic_id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      })) as ContentWithTopics[];
    } catch (error) {
      logger.error(`Error getting in-progress content for ${userId}:`, error);
      throw error;
    }
  }
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'in_progress',
              progress_percentage: {
                gt: 0,
                lt: 100
              }
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map(content => ({
        ...content,
        contentTopics: content.contentTopics.map(ct => ({
          id: ct.topic.id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      }));
    } catch (error) {
      logger.error(`Error getting in-progress content for ${userId}:`, error);
      throw error;
    }
  }
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          contentProgress: {
            some: {
              user_id: userId,
              status: 'in_progress'
            }
          }
        },
        include: {
          contentTopics: {
            include: { topic: true }
          }
        }
      });

      return contents.map(content => ({
        ...content,
        topics: content.contentTopics.map(ct => ({
          id: ct.topic.id,
          name: ct.topic.name,
          isPrimary: ct.is_primary
        }))
      }));
    } catch (error) {
      logger.error(`Error getting in-progress content for ${userId}:`, error);
      throw error;
    }
  }

  async bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void> {
    try {
      await this.prisma.$transaction(
        progressData.map(data =>
          this.prisma.contentProgress.upsert({
            where: {
              user_id_content_id: {
                user_id: data.userId,
                content_id: data.contentId
              }
            },
            create: {
              user_id: data.userId,
              content_id: data.contentId,
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              created_at: new Date(),
              updated_at: new Date()
            },
            update: {
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              updated_at: new Date()
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk progress tracking:', error);
      throw error;
    }
  }
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void> {
    try {
      await this.prisma.$transaction(
        progressData.map(data =>
          this.prisma.contentProgress.upsert({
            where: {
              user_id_content_id: {
                user_id: data.userId,
                content_id: data.contentId
              }
            },
            create: {
              user_id: data.userId,
              content_id: data.contentId,
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              created_at: new Date(),
              updated_at: new Date()
            },
            update: {
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              updated_at: new Date()
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk progress tracking:', error);
      throw error;
    }
  }
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void> {
    try {
      await this.prisma.$transaction(
        progressData.map(data =>
          this.prisma.contentProgress.upsert({
            where: {
              user_id_content_id: {
                user_id: data.userId,
                content_id: data.contentId
              }
            },
            create: {
              user_id: data.userId,
              content_id: data.contentId,
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              created_at: new Date(),
              updated_at: new Date()
            },
            update: {
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              updated_at: new Date()
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk progress tracking:', error);
      throw error;
    }
  }
    try {
      await this.prisma.$transaction(
        progressData.map(data =>
          this.prisma.contentProgress.upsert({
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
              last_accessed_at: new Date()
            },
            create: {
              user_id: data.userId,
              content_id: data.contentId,
              status: data.status,
              progress_percentage: data.progressPercentage,
              time_spent_seconds: data.timeSpentSeconds,
              first_accessed_at: new Date(),
              last_accessed_at: new Date()
            }
          });
        }
      });
    } catch (error) {
      logger.error('Error in bulk track progress:', error);
      throw error;
    }
  }

  async bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void> {
    try {
      await this.prisma.$transaction(
        interactions.map(interaction =>
          this.prisma.contentInteractionLog.create({
            data: {
              ...interaction,
              action_timestamp: new Date(),
              progress_at_action: Number(interaction.progressAtAction),
              time_spent_seconds: Number(interaction.timeSpentSeconds),
              metadata: interaction.metadata as Prisma.JsonValue | null
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk interaction logging:', error);
      throw error;
    }
  }
    try {
      await this.prisma.$transaction(
        interactions.map(interaction =>
          this.prisma.contentInteractionLog.create({
            data: {
              ...interaction,
              action_timestamp: new Date(),
              progress_at_action: Number(interaction.progress_at_action),
              time_spent_seconds: Number(interaction.time_spent_seconds)
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk interaction logging:', error);
      throw error;
    }
  }
    try {
      await this.prisma.$transaction(
        interactions.map(interaction =>
          this.prisma.contentInteractionLog.create({
            data: {
              ...interaction,
              action_timestamp: new Date(),
              progress_at_action: Number(interaction.progress_at_action),
              time_spent_seconds: Number(interaction.time_spent_seconds)
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk interaction logging:', error);
      throw error;
    }
  }
    try {
      await this.prisma.$transaction(
        interactions.map(interaction =>
          this.prisma.contentInteractionLog.create({
            data: {
              ...interaction,
              action_timestamp: new Date(),
              progress_at_action: Number(interaction.progress_at_action),
              time_spent_seconds: Number(interaction.time_spent_seconds)
            }
          })
        )
      );
    } catch (error) {
      logger.error('Error in bulk interaction logging:', error);
      throw error;
    }
  }
    try {
      await this.prisma.contentInteractionLog.createMany({
        data: interactions.map(interaction => ({
          user_id: interaction.userId,
          content_id: interaction.contentId,
          session_id: interaction.sessionId,
          action: interaction.action,
          progress_at_action: interaction.progressAtAction,
          time_spent_seconds: interaction.timeSpentSeconds,
          device_type: interaction.deviceType as any,
          platform: interaction.platform as any,
          abandonment_reason: interaction.abandonmentReason as any,
          came_from: interaction.cameFrom as any
        }))
      });

      // Update view counts for 'start' actions
      const contentIds = interactions
        .filter(i => i.action === 'start')
        .map(i => i.contentId);

      if (contentIds.length > 0) {
        await this.prisma.content.updateMany({
          where: {
            id: {
              in: [...new Set(contentIds)] // Remove duplicates
            }
          },
          data: {
            view_count: {
              increment: 1
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error in bulk log interactions:', error);
      throw error;
    }
  }
}
