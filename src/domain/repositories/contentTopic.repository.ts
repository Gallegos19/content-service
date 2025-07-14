import { ContentTopic } from '../entities/content.entity';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  color_hex?: string;
  prerequisites?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface IContentTopicRepository {
  // Content-Topic relationship methods
  addTopicToContent(contentId: string, topicId: string, isPrimary?: boolean): Promise<void>;
  removeTopicFromContent(contentId: string, topicId: string): Promise<void>;
  setPrimaryTopic(contentId: string, topicId: string): Promise<void>;
  getContentTopics(contentId: string): Promise<ContentTopic[]>;
  
  // Topic CRUD methods
  findAllTopics(): Promise<Topic[]>;
  createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic>;
  findTopicById(id: string): Promise<Topic | null>;
  updateTopic(id: string, data: Partial<Topic>): Promise<Topic>;
  deleteTopic(id: string): Promise<void>;
}
