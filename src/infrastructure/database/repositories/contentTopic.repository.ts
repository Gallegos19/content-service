import { PrismaClient, ContentTopic } from '@prisma/client';

const prisma = new PrismaClient();

export class ContentTopicRepository {
  async create(data: Omit<ContentTopic, 'id' | 'created_at'>): Promise<ContentTopic> {
    return prisma.contentTopic.create({ data });
  }

  async findById(id: string): Promise<ContentTopic | null> {
    return prisma.contentTopic.findUnique({ where: { id } });
  }

  async findAll(): Promise<ContentTopic[]> {
    return prisma.contentTopic.findMany();
  }

  async update(id: string, data: Partial<ContentTopic>): Promise<ContentTopic> {
    return prisma.contentTopic.update({ where: { id }, data });
  }

  async delete(id: string): Promise<ContentTopic> {
    return prisma.contentTopic.delete({ where: { id } });
  }
}
