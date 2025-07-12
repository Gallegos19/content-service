import { DifficultyLevel } from '@domain/entities/content.entity';

export interface CreateTopicDto {
  name: string;
  description?: string | null;
  difficulty_level: DifficultyLevel;
  is_active?: boolean;
  sort_order?: number;
  prerequisites?: string[];
  created_by?: string | null;
  updated_by?: string | null;
  // Otros campos opcionales según tu modelo
}

export interface UpdateTopicDto {
  name?: string;
  description?: string | null;
  difficulty_level?: DifficultyLevel;
  is_active?: boolean;
  sort_order?: number;
  prerequisites?: string[];
  updated_by?: string | null;
  // Otros campos opcionales
}
