import { Expose, Type } from 'class-transformer';
import { Content, ContentWithTopics } from '@domain/entities/content.entity';

export class ContentResponse {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  static fromEntity(content: Content | ContentWithTopics): ContentResponse {
    const response = new ContentResponse();
    Object.assign(response, content);
    return response;
  }

  static fromEntities(contents: Content[] | ContentWithTopics[]): ContentResponse[] {
    return contents.map(content => this.fromEntity(content));
  }
}

export class ContentWithTopicsResponse extends ContentResponse {
  @Expose()
  topics: Array<{
    id: string;
    name: string;
  }>;

  static fromEntity(content: ContentWithTopics): ContentWithTopicsResponse {
    const response = new ContentWithTopicsResponse();
    Object.assign(response, content);
    return response;
  }

  static fromEntities(contents: ContentWithTopics[]): ContentWithTopicsResponse[] {
    return contents.map(content => this.fromEntity(content));
  }
}
