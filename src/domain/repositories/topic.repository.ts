import { Topic } from '@prisma/client';

export interface ITopicRepository {
  create(topic: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<Topic>;
  findAll(): Promise<Topic[]>;
  findById(id: string): Promise<Topic | null>;
  update(id: string, topic: Partial<Topic>): Promise<Topic>;
  delete(id: string): Promise<boolean>;
}
