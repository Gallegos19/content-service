import { IContentRepository } from '../database/repositories/content.repository';
import { Content, ContentWithTopics } from '@domain/entities/content.entity';
import { logger } from '@shared/utils/logger';

export class ContentRepositoryAdapter implements IContentServiceRepository {
  constructor(private readonly repository: IContentRepository) {}

  private transformToContent(contentWithTopics: ContentWithTopics): Content {
    const { contentTopics, ...contentData } = contentWithTopics;
    
    // Handle metadata conversion with strict type checking
    let finalMetadata: Record<string, any> | null = null;
    
    if (contentData.metadata !== null && contentData.metadata !== undefined) {
      try {
        // If metadata is a string, parse it
        if (typeof contentData.metadata === 'string') {
          const parsed = JSON.parse(contentData.metadata);
          // Only accept plain objects, not arrays or other types
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            finalMetadata = parsed;
          }
        }
        // If it's already an object, verify it's a plain object
        else if (typeof contentData.metadata === 'object' && 
                 !Array.isArray(contentData.metadata) &&
                 contentData.metadata !== null) {
          finalMetadata = contentData.metadata as Record<string, any>;
        }
      } catch (e) {
        logger.warn(`Failed to parse metadata: ${e.message}`);
      }
    }
    
    return {
      ...contentData,
      metadata: finalMetadata
    } as Content;
  }

  async findById(id: string): Promise<Content | null> {
    const result = await this.repository.findById(id);
    return result ? this.transformToContent(result) : null;
  }

  async create(data: Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Content> {
    const result = await this.repository.create({
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    });
    return this.transformToContent(result);
  }

  async update(id: string, data: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Content> {
    const result = await this.repository.update(id, {
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    });
    return this.transformToContent(result);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
