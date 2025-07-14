import { IUserTipsHistoryRepository } from '@domain/repositories/userTipsHistory.repository';
import { PrismaClient, UserTipsHistory } from '@prisma/client';

const prisma = new PrismaClient();

export class UserTipsHistoryRepository implements IUserTipsHistoryRepository {
  async create(data: Omit<UserTipsHistory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<UserTipsHistory> {
    return prisma.userTipsHistory.create({ data });
  }

  async findById(id: string): Promise<UserTipsHistory | null> {
    return prisma.userTipsHistory.findUnique({ where: { id } });
  }

  async findAll(): Promise<UserTipsHistory[]> {
    return prisma.userTipsHistory.findMany();
  }

  async update(id: string, data: Partial<Omit<UserTipsHistory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<UserTipsHistory> {
    return prisma.userTipsHistory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    await prisma.userTipsHistory.delete({ where: { id } });
    return true;
  }

  async findByUserId(userId: string): Promise<UserTipsHistory[]> {
    return prisma.userTipsHistory.findMany({ where: { user_id: userId } });
  }

  async findByTipId(tipId: string): Promise<UserTipsHistory[]> {
    return prisma.userTipsHistory.findMany({ where: { tip_id: tipId } });
  }

  // Métodos avanzados (stubs, para implementar luego si tu dominio lo requiere)
  // async findHistoryByUser(userId: string): Promise<UserTipsHistory[]> {
  //   throw new Error('Not implemented');
  // }
}
