import { PrismaClient } from '@prisma/client';
import { Module } from '@domain/entities/module.entity';
import { Topic } from '@domain/entities/content.entity';

const prisma = new PrismaClient();

export class ModuleRepository {
  async create(data: Omit<Module, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Module> {
    const created = await prisma.module.create({ data });
    return {
      ...created,
      topics: []
    };
  }

  async findById(id: string): Promise<Module | null> {
    const module = await prisma.module.findUnique({
      where: { id },
      include: { topics: true }
    });
    return module;
  }

  async findAll(): Promise<Module[]> {
    const modules = await prisma.module.findMany({
      where: { deleted_at: null },
      include: { topics: true }
    });
    return modules;
  }

  async update(id: string, data: Partial<Module>): Promise<Module> {
    const updated = await prisma.module.update({
      where: { id },
      data
    });
    return {
      ...updated,
      topics: []
    };
  }

  async delete(id: string): Promise<boolean> {
    await prisma.module.delete({ where: { id } });
    return true;
  }

  async addTopic(moduleId: string, topicId: string): Promise<void> {
    await prisma.topic.update({
      where: { id: topicId },
      data: { modules: { connect: { id: moduleId } } }
    });
  }

  async removeTopic(moduleId: string, topicId: string): Promise<void> {
    await prisma.topic.update({
      where: { id: topicId },
      data: { modules: { disconnect: { id: moduleId } } }
    });
  }
}
