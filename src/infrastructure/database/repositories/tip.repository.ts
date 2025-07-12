import { PrismaClient, Tip } from '@prisma/client';

const prisma = new PrismaClient();


export class TipRepository {
  async create(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Tip> {
    const created = await prisma.tip.create({ data });
    return created as Tip;
  }

  async findById(id: string): Promise<Tip | null> {
    return prisma.tip.findUnique({ where: { id } });
  }

  async findAll(): Promise<Tip[]> {
    return prisma.tip.findMany();
  }

  async update(id: string, data: Partial<Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Tip> {
    const updated = await prisma.tip.update({ where: { id }, data });
    return updated as Tip;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.tip.delete({ where: { id } });
    return true;
  }

  // Métodos avanzados (stubs, para implementar luego si tu dominio lo requiere)
  // async findTips(): Promise<Array<{ id: string; name: string; }>> {
  //   throw new Error('Not implemented');
  // }
}

