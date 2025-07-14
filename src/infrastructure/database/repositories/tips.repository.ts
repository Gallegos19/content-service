import { ITipsRepository } from '@domain/repositories/tips.repository';
import { PrismaClient, Tip, Prisma } from '@prisma/client';

const prisma = new PrismaClient();


export class TipsRepository implements ITipsRepository {
  async create(data: Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Tip> {
    const inputData = {
      ...data,
      metadata: data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : Prisma.JsonNull
    };
    const created = await prisma.tip.create({ data: inputData });
    return created as Tip;
  }

  async findById(id: string): Promise<Tip | null> {
    return prisma.tip.findUnique({ where: { id } });
  }

  async findAll(): Promise<Tip[]> {
    console.log("findAll");
    return prisma.tip.findMany();
  }

  async update(id: string, data: Partial<Tip>): Promise<Tip> {
    return prisma.tip.update({
      where: { id },
      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === null ? undefined : value
        ])
      )
    });
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
