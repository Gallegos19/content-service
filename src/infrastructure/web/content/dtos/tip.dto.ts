import { DifficultyLevel } from '@domain/entities/content.entity';

export interface CreateTipDto {
  content_id: string;
  title: string;
  description?: string | null;
  tip_type?: string; // e.g., 'GENERAL', 'HINT', etc.
  difficulty_level: DifficultyLevel;
  is_active?: boolean;
  usage_count?: number;
  created_by?: string | null;
  updated_by?: string | null;
  // Agrega aquí otros campos opcionales según tu modelo
}

export interface UpdateTipDto {
  title?: string;
  description?: string | null;
  tip_type?: string;
  difficulty_level?: DifficultyLevel;
  is_active?: boolean;
  usage_count?: number;
  updated_by?: string | null;
  // Otros campos opcionales
}
