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

  // Métodos de dominio avanzados 
  async findTopics(): Promise<Array<{ id: string; name: string; }>> {
    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        name: true
      },
      where: {
        deleted_at: null
      }
    });
    return topics;
  }

  async findTopicById(id: string): Promise<{ id: string; name: string; } | null> {
    const topic = await prisma.topic.findUnique({
      select: {
        id: true,
        name: true
      },
      where: {
        id,
        deleted_at: null
      }
    });
    return topic;
  }
}
