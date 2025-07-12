
import { IContentRepository } from '../../../domain/repositories/content.repository';
import { Content, PrismaClient } from '@prisma/client';
import {
  ContentWithTopics, ContentFilters, UserProgress, ContentAnalytics, AbandonmentAnalytics, EffectivenessAnalytics, ProblematicContent, ContentInteractionLog, Tip, Topic
} from '../../../domain/entities/content.entity';
import { PaginatedResult } from '@shared/constants/types';

const prisma = new PrismaClient();

export class ContentRepository implements IContentRepository {
  async create(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Content> {
    const prismaData = { ...data, metadata: typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata) };
    const created = await prisma.content.create({ data: prismaData });
    // Devuelve metadata como objeto, no string
    let parsedMetadata = null;
    if (created.metadata) {
      try {
        parsedMetadata = typeof created.metadata === 'string' ? JSON.parse(created.metadata) : created.metadata;
      } catch {
        parsedMetadata = null;
      }
    }
    return { ...created, metadata: parsedMetadata } as Content;
  }

  async findById(id: string): Promise<ContentWithTopics | null> {
    const result = await prisma.content.findUnique({ where: { id }, include: { contentTopics: true } });
    if (!result) return null;
    return {
      ...result,
      metadata: result.metadata ? (typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata) : null,
    } as ContentWithTopics;
  }

  async findMany(filters: ContentFilters): Promise<PaginatedResult<ContentWithTopics>> {
    const page = filters.page ?? 1;
    const itemsPerPage = filters.limit ?? 10;
    const skip = (page - 1) * itemsPerPage;

    // Utilidad para mapear ContentFilters a ContentWhereInput
    function mapFiltersToWhereInput(filters: any): any {
      const where: any = {};
      if (filters.contentIds) {
        where.id = { in: filters.contentIds };
      }
      if (filters.topicId) {
        where.contentTopics = { some: { topic_id: filters.topicId } };
      }
      if (filters.age) {
        where.target_age_min = { lte: filters.age };
        where.target_age_max = { gte: filters.age };
      }
      if (filters.difficultyLevel) {
        where.difficulty_level = filters.difficultyLevel;
      }
      if (filters.contentType) {
        where.content_type = filters.contentType;
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
      return where;
    }

    const where = mapFiltersToWhereInput(filters);

    const [items, totalItems] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          contentTopics: {
            select: {
              id: true,
              content_id: true,
              topic_id: true,
              is_primary: true,
              created_at: true,
              updated_at: true,
              deleted_at: true,
              // Add 'topic: true' if you want nested topic info
            }
          }
        },
        skip,
        take: itemsPerPage,
      }),
      prisma.content.count({ where }),
    ]);

    return {
      items: items.map(result => ({
        ...result,
        metadata: result.metadata ? (typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata) : null,
        contentTopics: result.contentTopics?.map(topic => ({
          id: topic.id,
          content_id: topic.content_id,
          topic_id: topic.topic_id,
          is_primary: topic.is_primary,
          created_at: topic.created_at,
          updated_at: topic.updated_at,
          deleted_at: topic.deleted_at,
        })) ?? [],
      })),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        currentPage: page,
      },
    };
  }

  async update(
    id: string,
    data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>
  ): Promise<Content> {
    const prismaData = {
      ...data,
      metadata:
        data.metadata === null || typeof data.metadata === 'string'
          ? data.metadata
          : JSON.stringify(data.metadata),
    };

    const updated = await prisma.content.update({ where: { id }, data: prismaData });

    // Normaliza metadata a objeto para el dominio
    let parsedMetadata: Record<string, any> | null = null;
    if (updated.metadata !== undefined && updated.metadata !== null) {
      if (typeof updated.metadata === 'string') {
        try {
          const parsed = JSON.parse(updated.metadata);
          parsedMetadata = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null;
        } catch {
          parsedMetadata = null;
        }
      } else if (typeof updated.metadata === 'object' && !Array.isArray(updated.metadata)) {
        parsedMetadata = updated.metadata as Record<string, any>;
      }
    }

    // Fuerza el tipo Content y elimina campos extra
    const result: Content = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      content_type: updated.content_type,
      main_media_id: updated.main_media_id,
      thumbnail_media_id: updated.thumbnail_media_id,
      difficulty_level: updated.difficulty_level,
      is_published: updated.is_published,
      published_at: updated.published_at,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      deleted_at: updated.deleted_at,
      created_by: updated.created_by,
      updated_by: updated.updated_by,
      metadata: parsedMetadata,
    };

    return result;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.content.delete({ where: { id } });
    return true;
  }

  async addTopicToContent(contentId: string, topicId: string, isPrimary?: boolean): Promise<void> {
    throw new Error('Not implemented');
  }

  async removeTopicFromContent(contentId: string, topicId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async setPrimaryTopic(contentId: string, topicId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getUserProgress(userId: string, contentId: string): Promise<UserProgress | null> {
    throw new Error('Not implemented');
  }

  async trackProgress(userId: string, contentId: string, data: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage?: number;
    timeSpentSeconds?: number;
    lastPositionSeconds?: number;
    completionRating?: number;
    completionFeedback?: string;
  }): Promise<UserProgress> {
    throw new Error('Not implemented');
  }

  async getContentAnalytics(contentId: string): Promise<ContentAnalytics> {
    throw new Error('Not implemented');
  }

  async getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics> {
    throw new Error('Not implemented');
  }

  async getEffectivenessAnalytics(topicId: string): Promise<EffectivenessAnalytics> {
    throw new Error('Not implemented');
  }

  async findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]> {
    throw new Error('Not implemented');
  }

  async logInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    throw new Error('Not implemented');
  }

  async getUserInteractions(userId: string, contentId?: string): Promise<ContentInteractionLog[]> {
    throw new Error('Not implemented');
  }

  async getContentInteractions(contentId: string, action?: string): Promise<ContentInteractionLog[]> {
    throw new Error('Not implemented');
  }

  async trackInteraction(interaction: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    throw new Error('Not implemented');
  }

  async findContentByTopic(topicId: string): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async findContentByAge(age: number): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async findFeaturedContent(limit?: number): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async findRelatedContent(contentId: string, limit?: number): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async getUserProgressHistory(userId: string): Promise<UserProgress[]> {
    throw new Error('Not implemented');
  }

  async getCompletedContent(userId: string): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async getInProgressContent(userId: string): Promise<ContentWithTopics[]> {
    throw new Error('Not implemented');
  }

  async getAllTopics(): Promise<Topic[]> {
    throw new Error('Not implemented');
  }

  async createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    throw new Error('Not implemented');
  }

  async getTopicById(id: string): Promise<Topic | null> {
    throw new Error('Not implemented');
  }

  async updateTopic(id: string, data: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Topic> {
    throw new Error('Not implemented');
  }

  async deleteTopic(id: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async getAllTips(): Promise<Tip[]> {
    throw new Error('Not implemented');
  }

  async createTip(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Tip> {
    throw new Error('Not implemented');
  }

  async getTipById(id: string): Promise<Tip | null> {
    throw new Error('Not implemented');
  }

  async updateTip(id: string, data: Partial<Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Tip> {
    throw new Error('Not implemented');
  }

  async deleteTip(id: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async findTopics(): Promise<Array<{ id: string; name: string; }>> {
    throw new Error('Not implemented');
  }

  async findTopicById(id: string): Promise<{ id: string; name: string; } | null> {
    throw new Error('Not implemented');
  }

  async bulkTrackProgress(progressData: Array<{
    userId: string;
    contentId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused';
    progressPercentage: number;
    timeSpentSeconds: number;
  }>): Promise<void> {
    throw new Error('Not implemented');
  }

  async bulkLogInteractions(interactions: Array<Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>>): Promise<void> {
    throw new Error('Not implemented');
  }
}
