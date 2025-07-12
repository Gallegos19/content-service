import { PrismaClient, Topic } from '@prisma/client';

const prisma = new PrismaClient();

export class TopicRepository /* implements ITopicRepository */ {
  async create(data: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Topic> {
    const created = await prisma.topic.create({ data: { ...data, prerequisites: JSON.stringify((data as any).prerequisites) } });
    return { ...created, prerequisites: created.prerequisites ? JSON.parse(created.prerequisites as any) : [] } as Topic;
  }

  async findById(id: string): Promise<Topic | null> {
    return prisma.topic.findUnique({ where: { id } });
  }

  async findAll(): Promise<Topic[]> {
    return prisma.topic.findMany();
  }

  async update(id: string, data: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Topic> {
    const updated = await prisma.topic.update({ where: { id }, data: { ...data, prerequisites: JSON.stringify((data as any).prerequisites) } });
    return { ...updated, prerequisites: updated.prerequisites ? JSON.parse(updated.prerequisites as any) : [] } as Topic;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.topic.delete({ where: { id } });
    return true;
  }

  // Métodos de dominio avanzados (stubs, para implementar luego)
  async findTopics(): Promise<Array<{ id: string; name: string; }>> {
    throw new Error('Not implemented');
  }

  async findTopicById(id: string): Promise<{ id: string; name: string; } | null> {
    throw new Error('Not implemented');
  }
}
