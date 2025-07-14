import { inject, injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IContentAnalyticsRepository } from '@domain/repositories/contentAnalytics.repository';
import { ContentAnalytics, AbandonmentAnalytics, EffectivenessAnalytics, ProblematicContent } from '@domain/entities/content.entity';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';

@injectable()
export class ContentAnalyticsRepository implements IContentAnalyticsRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient
  ) {}

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

  async getEffectivenessAnalytics(contentId: string): Promise<EffectivenessAnalytics> {
    try {
      // Get content with its topics
      const content = await this.prisma.content.findUnique({
        where: { id: contentId },
        include: {
          contentTopics: {
            include: {
              topic: {
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
              }
            }
          }
        }
      });

      if (!content || !content.contentTopics.length) {
        throw new Error('Content or topics not found');
      }

      // Use the first topic for analysis (you might want to modify this logic)
      const topic = content.contentTopics[0].topic;
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
        topicId: topic.id,
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
      logger.error(`Error getting effectiveness analytics for content ${contentId}:`, error);
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
                where: { status: 'COMPLETED' }
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
            avgAbandonmentPoint: 50, // This would be calculated with more logic
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
      logger.error('Error finding problematic content:', error);
      throw error;
    }
  }
}