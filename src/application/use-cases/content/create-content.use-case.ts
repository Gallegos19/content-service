import { Content } from '@domain/entities/content.entity';
import { ContentService } from '@domain/services';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';
import { inject, injectable } from 'inversify';
import { ContentType } from '@domain/entities/content.entity';
import { CreateContentDto } from '@infrastructure/web/content/dto/content.dto';
import { DifficultyLevel } from '@domain/entities/content.entity';

export interface CreateContentInput {
  title: string;
  description?: string | null;
  content_type: ContentType;
  main_media_id?: string | null;
  thumbnail_media_id?: string | null;
  difficulty_level?: string;
  target_age_min?: number;
  target_age_max?: number;
  reading_time_minutes?: number | null;
  duration_minutes?: number | null;
  is_downloadable?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  published_at?: Date;
  metadata?: Record<string, any> | null;
  view_count?: number;
  completion_count?: number;
  rating_average?: number;
  rating_count?: number;
  created_by?: string;
  updated_by?: string;
  contentTopics?: any;
}

@injectable()
export class CreateContentUseCase {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  async execute(input: CreateContentInput & {
    reading_time_minutes?: number | null;
    duration_minutes?: number | null;
  }): Promise<Content> {
    try {
      // Validaciones
      if (!input.title?.trim()) {
        throw new Error('Title is required');
      }

      if (!input.content_type) {
        throw new Error('Content type is required');
      }

      if (input.target_age_min !== undefined && input.target_age_max !== undefined) {
        if (input.target_age_min > input.target_age_max) {
          throw new Error('La edad mínima no puede ser mayor que la edad máxima');
        }
      }

      if (input.reading_time_minutes !== undefined && Number(input.reading_time_minutes) < 0) {
        throw new Error('El tiempo de lectura no puede ser negativo');
      }

      if (input.duration_minutes !== undefined && Number(input.duration_minutes) < 0) {
        throw new Error('La duración no puede ser negativa');
      }

      // Prepare data for service
      const contentData: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { metadata?: Record<string, any> | null } = {
        title: input.title,
        description: input.description ?? null,
        content_type: input.content_type,
        main_media_id: input.main_media_id ?? null,
        thumbnail_media_id: input.thumbnail_media_id ?? null,
        difficulty_level: (input.difficulty_level ?? 'BEGINNER') as DifficultyLevel,
        target_age_min: input.target_age_min ?? 0,
        target_age_max: input.target_age_max ?? 100,
        reading_time_minutes: input.reading_time_minutes ?? null,
        duration_minutes: input.duration_minutes ?? null,
        is_downloadable: input.is_downloadable ?? false,
        is_featured: input.is_featured ?? false,
        is_published: input.is_published ?? false,
        published_at: input.published_at ?? null,
        created_by: input.created_by ?? null,
        updated_by: input.updated_by ?? null,
        metadata: input.metadata ?? null,
        view_count: input.view_count ?? 0,
        completion_count: input.completion_count ?? 0,
        rating_count: input.rating_count ?? 0,
        rating_average: input.rating_average ?? null,
      };

      logger.info(`Executing CreateContentUseCase for content: ${input.title}`);
      const result = await this.contentService.createContent(contentData as any);
  
      return result;
    } catch (error) {
      logger.error('Error in CreateContentUseCase:', error);
      throw error;
    }
  }
}