import { Tip } from '@prisma/client';

export interface ITipsRepository {
  create(tip: Omit<Tip, 'id' | 'created_at' | 'updated_at'>): Promise<Tip>;
  findAll(): Promise<Tip[]>;
  findById(id: string): Promise<Tip | null>;
  update(id: string, tip: Partial<Tip>): Promise<Tip>;
  delete(id: string): Promise<boolean>;
}