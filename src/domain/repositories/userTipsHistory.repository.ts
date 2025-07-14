import { UserTipsHistory } from '@prisma/client';

export interface IUserTipsHistoryRepository {
  create(history: Omit<UserTipsHistory, 'id' | 'created_at'>): Promise<UserTipsHistory>;
  findByUserId(userId: string): Promise<UserTipsHistory[]>;
  findByTipId(tipId: string): Promise<UserTipsHistory[]>;
}
