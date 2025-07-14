import { PrismaClient } from '@prisma/client';
import { IContentTopicRepository, ContentTopic, Topic } from '@domain/repositories/contentTopic.repository';

const prisma = new PrismaClient();

export class ContentTopicRepository implements IContentTopicRepository {
  private toDomain(dbTopic: any): ContentTopic {
    return {
      id: dbTopic.id,
      contentId: dbTopic.content_id,
      topicId: dbTopic.topic_id,
      isPrimary: dbTopic.is_primary,
      createdAt: dbTopic.created_at,
      updatedAt: dbTopic.updated_at,
      deletedAt: dbTopic.deleted_at,
      topic: dbTopic.topic
    };
  }

  private toDatabase(topic: Partial<ContentTopic>): any {
    return {
      content_id: topic.contentId,
      topic_id: topic.topicId,
      is_primary: topic.isPrimary,
      created_at: topic.createdAt,
      updated_at: topic.updatedAt,
      deleted_at: topic.deletedAt
    };
  }

  async create(data: Omit<ContentTopic, 'id' | 'created_at'>): Promise<ContentTopic> {
    const dbTopic = await prisma.contentTopic.create({ data: this.toDatabase(data) });
    return this.toDomain(dbTopic);
  }

  async findById(id: string): Promise<ContentTopic | null> {
    const dbTopic = await prisma.contentTopic.findUnique({ where: { id } });
    return dbTopic ? this.toDomain(dbTopic) : null;
  }

  async findAll(): Promise<ContentTopic[]> {
    const topics = await prisma.contentTopic.findMany();
    return topics.map(this.toDomain);
  }

  async update(id: string, data: Partial<ContentTopic>): Promise<ContentTopic> {
    const dbTopic = await prisma.contentTopic.update({ where: { id }, data: this.toDatabase(data) });
    return this.toDomain(dbTopic);
  }

  async delete(id: string): Promise<ContentTopic> {
    const dbTopic = await prisma.contentTopic.delete({ where: { id } });
    return this.toDomain(dbTopic);
  }

  async addTopicToContent(contentId: string, topicId: string, isPrimary = false): Promise<void> {
    await prisma.contentTopic.create({
      data: this.toDatabase({
        contentId,
        topicId,
        isPrimary
      })
    });
  }

  async removeTopicFromContent(contentId: string, topicId: string): Promise<void> {
    await prisma.contentTopic.deleteMany({
      where: {
        content_id: contentId,
        topic_id: topicId
      }
    });
  }

  async setPrimaryTopic(contentId: string, topicId: string): Promise<void> {
    await prisma.$transaction([
      prisma.contentTopic.updateMany({
        where: { content_id: contentId },
        data: { is_primary: false }
      }),
      prisma.contentTopic.updateMany({
        where: { 
          content_id: contentId,
          topic_id: topicId 
        },
        data: { is_primary: true }
      })
    ]);
  }

  async getContentTopics(contentId: string): Promise<ContentTopic[]> {
    const topics = await prisma.contentTopic.findMany({
      where: { content_id: contentId },
      include: { topic: true }
    });
    return topics.map(this.toDomain);
  }

  async findAllTopics(): Promise<Topic[]> {
    const topics = await prisma.topic.findMany();
    return topics.map(t => this.toDomainTopic(t));
  }

  async createTopic(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    const topic = await prisma.topic.create({
      data: this.toDatabaseTopic(data)
    });
    return this.toDomainTopic(topic);
  }

  async findTopicById(id: string): Promise<Topic | null> {
    const topic = await prisma.topic.findUnique({ where: { id } });
    return topic ? this.toDomainTopic(topic) : null;
  }

  async updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    const topic = await prisma.topic.update({
      where: { id },
      data: this.toDatabaseTopic(data)
    });
    return this.toDomainTopic(topic);
  }

  async deleteTopic(id: string): Promise<void> {
    await prisma.topic.delete({ where: { id } });
  }

  private toDomainTopic(dbTopic: any): Topic {
    return {
      id: dbTopic.id,
      name: dbTopic.name,
      description: dbTopic.description,
      color_hex: dbTopic.color_hex,
      prerequisites: dbTopic.prerequisites,
      created_at: dbTopic.created_at,
      updated_at: dbTopic.updated_at,
      deleted_at: dbTopic.deleted_at
    };
  }

  private toDatabaseTopic(topic: Partial<Topic>): any {
    return {
      name: topic.name,
      description: topic.description,
      color_hex: topic.color_hex,
      prerequisites: topic.prerequisites,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      deleted_at: topic.deleted_at
    };
  }
}
