import { IContentInteractionLogRepository } from '@domain/repositories/contentInteractionLog.repository';
import { PrismaClient, ContentInteractionLog } from '@prisma/client';

const prisma = new PrismaClient();

export class ContentInteractionLogRepository implements IContentInteractionLogRepository {
  async create(data: Omit<ContentInteractionLog, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<ContentInteractionLog> {
    return prisma.contentInteractionLog.create({ data: { ...data, metadata: JSON.stringify((data as any).metadata) } });
  }

  async findByContentId(contentId: string): Promise<ContentInteractionLog[]> {
    const logs = await prisma.contentInteractionLog.findMany({
      where: {
        content_id: contentId,
      }
    });
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata as string) : null
    }));
  }

  async findByUserId(userId: string): Promise<ContentInteractionLog[]> {
    const logs = await prisma.contentInteractionLog.findMany({
      where: {
        user_id: userId,
      }
    });
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata as string) : null
    }));
  }

  async findById(id: string): Promise<ContentInteractionLog | null> {
    return prisma.contentInteractionLog.findUnique({ where: { id } });
  }

  async findAll(): Promise<ContentInteractionLog[]> {
    return prisma.contentInteractionLog.findMany();
  }

  async update(id: string, data: Partial<Omit<ContentInteractionLog, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<ContentInteractionLog> {
    return prisma.contentInteractionLog.update({ where: { id }, data: { ...data, metadata: JSON.stringify((data as any).metadata) } });
  }

  async delete(id: string): Promise<boolean> {
    await prisma.contentInteractionLog.delete({ where: { id } });
    return true;
  }

}