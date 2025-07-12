import { PrismaClient, ContentInteractionLog } from '@prisma/client';

const prisma = new PrismaClient();

export class ContentInteractionLogRepository {
  async create(data: Omit<ContentInteractionLog, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<ContentInteractionLog> {
    return prisma.contentInteractionLog.create({ data: { ...data, metadata: JSON.stringify((data as any).metadata) } });
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

  // Métodos avanzados (stubs, para implementar luego si tu dominio lo requiere)
  // async findLogsByContentId(contentId: string): Promise<ContentInteractionLog[]> {
  //   throw new Error('Not implemented');
  // }

}