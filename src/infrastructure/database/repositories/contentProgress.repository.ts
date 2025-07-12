import { PrismaClient, ContentProgress } from '@prisma/client';

const prisma = new PrismaClient();

export class ContentProgressRepository {
  async create(data: Omit<ContentProgress, 'id' | 'created_at' | 'updated_at'>): Promise<ContentProgress> {
    return prisma.contentProgress.create({ data });
  }

  async findById(id: string): Promise<ContentProgress | null> {
    return prisma.contentProgress.findUnique({ where: { id } });
  }

  async findAll(): Promise<ContentProgress[]> {
    return prisma.contentProgress.findMany();
  }

  async update(id: string, data: Partial<ContentProgress>): Promise<ContentProgress> {
    return prisma.contentProgress.update({ where: { id }, data });
  }

  async delete(id: string): Promise<ContentProgress> {
    return prisma.contentProgress.delete({ where: { id } });
  }
}
