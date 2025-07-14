

export interface IModuleRepository {
  findAllModules(): Promise<Array<{ id: string; name: string }>>;
  findModuleById(id: string): Promise<{ id: string; name: string } | null>;
}
