import { ContentTopic } from '../entities/content.entity';
import { Content } from '../entities/content.entity';
import { DifficultyLevel } from '@domain/entities/content.entity';

export interface ContentWithTopics extends Content {
  contentTopics: ContentTopic[];
}

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon_url: string | null;
  color_hex: string;
  category: string | null;
  difficulty_level: DifficultyLevel;
  target_age_min: number;
  target_age_max: number;
  prerequisites: string[];
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface IContentTopicRepository {
  // Content-Topic relationship methods
  addTopicToContent(contentId: string, topicId: string, isPrimary?: boolean): Promise<void>;
  removeTopicFromContent(contentId: string, topicId: string): Promise<void>;
  setPrimaryTopic(contentId: string, topicId: string): Promise<void>;
  getContentTopics(contentId: string): Promise<ContentTopic[]>;
  findContentByTopic(topicId: string): Promise<ContentWithTopics[]>;
  
  // Topic CRUD methods
  findAllTopics(): Promise<Topic[]>;
  createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic>;
  findTopicById(id: string): Promise<Topic | null>;
  updateTopic(id: string, data: Partial<Topic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
}
