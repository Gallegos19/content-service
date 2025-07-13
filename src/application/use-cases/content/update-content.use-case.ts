import { Content, ContentWithTopics } from "@domain/index";
import { ContentService } from "@domain/services";
import { TYPES } from "@shared/constants/types";
import { logger } from "@shared/utils/logger";
import { inject, injectable } from "inversify";
import { ContentType, DifficultyLevel } from '@prisma/client';

export interface UpdateContentInput {
    id: string;
    title?: string;
    description?: string;
    content_type?: string;
    main_media_id?: string;
    thumbnail_media_id?: string;
    difficulty_level?: string;
    target_age_min?: number;
    target_age_max?: number;
    reading_time_minutes?: number;
    duration_minutes?: number;
    is_downloadable?: boolean;
    is_featured?: boolean;
    is_published?: boolean;
    published_at?: Date;
    metadata?: Record<string, any>;
    view_count?: number;
    completion_count?: number;
    rating_average?: number;
    rating_count?: number;
    updated_by?: string;
    topic_ids?: string[];
  }
  
@injectable()
export class UpdateContentUseCase {
    constructor(
      @inject(TYPES.ContentService) private readonly contentService: ContentService
    ) {}
  
    private mapContentType(contentType?: string): ContentType | undefined {
    if (!contentType) return undefined;
    
    const lowerType = contentType.toLowerCase();
    switch (lowerType) {
      case 'video': return 'VIDEO';
      case 'document':
      case 'article': return 'ARTICLE';
      case 'quiz': return 'QUIZ';
      case 'presentation':
      case 'interactive': return 'INTERACTIVE';
      default: return 'OTHER';
    }
  }

  private mapDifficultyLevel(level?: string): DifficultyLevel | undefined {
    if (!level) return undefined;
    
    const upperLevel = level.toUpperCase();
    return Object.values(DifficultyLevel).includes(upperLevel as DifficultyLevel) 
      ? upperLevel as DifficultyLevel 
      : undefined;
  }

    async execute(id: string, data: UpdateContentInput): Promise<ContentWithTopics> {
      try {
        if (!id?.trim()) {
          throw new Error('ID del contenido es requerido');
        }

        // Validaciones similares a create pero opcionales
        if (data.title !== undefined && !data.title.trim()) {
          throw new Error('El título no puede estar vacío');
        }
  
        if (data.target_age_min !== undefined && data.target_age_max !== undefined) {
          if (data.target_age_min > data.target_age_max) {
            throw new Error('La edad mínima no puede ser mayor que la edad máxima');
          }
        }
  
        if (data.reading_time_minutes !== undefined && data.reading_time_minutes < 0) {
          throw new Error('El tiempo de lectura no puede ser negativo');
        }
  
        if (data.duration_minutes !== undefined && data.duration_minutes < 0) {
          throw new Error('La duración no puede ser negativa');
        }
  
        if (data.difficulty_level !== undefined && !this.mapDifficultyLevel(data.difficulty_level)) {
          throw new Error('Nivel de dificultad no válido');
        }
  
        // Ensure metadata is properly typed
        const updateData = {
          ...data,
          content_type: this.mapContentType(data.content_type),
          difficulty_level: this.mapDifficultyLevel(data.difficulty_level),
          metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata
        };

        logger.info(`Executing UpdateContentUseCase for content: ${id}`);
        const updatedContent = await this.contentService.updateContent(id, updateData);
        
        if (!updatedContent) {
          throw new Error('Content not found');
        }
        
        return updatedContent;
      } catch (error) {
        logger.error(`Error in UpdateContentUseCase for content ${id}:`, error);
        throw error;
      }
    }
  }