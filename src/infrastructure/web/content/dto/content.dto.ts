// src/infrastructure/web/content/dto/content.dto.ts

import { z } from 'zod';

// Common schemas
const contentTypes = ['VIDEO', 'ARTICLE', 'QUIZ', 'INTERACTIVE', 'OTHER'] as const;
const difficultyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
const progressStatuses = ['not_started', 'in_progress', 'completed', 'paused'] as const;
const interactionActions = ['start', 'pause', 'resume', 'complete', 'abandon'] as const;
const deviceTypes = ['mobile', 'tablet', 'desktop'] as const;
const platforms = ['ios', 'android', 'web'] as const;

// Content Schema
export const createContentSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título no puede tener más de 255 caracteres'),
  description: z.string().nullable().optional(),
  content_type: z.enum(contentTypes),
  main_media_id: z.string().nullable().optional(),
  thumbnail_media_id: z.string().nullable().optional(),
  difficulty_level: z.enum(difficultyLevels).default('BEGINNER'),
  target_age_min: z.number().int().min(0, 'La edad mínima debe ser 0 o más').default(8),
  target_age_max: z.number().int().min(1, 'La edad máxima debe ser 1 o más').default(18),
  reading_time_minutes: z.number().int().positive('El tiempo de lectura debe ser un número positivo').nullable().optional(),
  duration_minutes: z.number().int().positive('La duración debe ser un número positivo').nullable().optional(),
  is_downloadable: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  published_at: z.string().datetime().optional().nullable(),
  topic_ids: z.array(z.string()).default([]),
  metadata: z.record(z.any()).nullable().optional(),
  view_count: z.number().int().min(0).default(0),
  completion_count: z.number().int().min(0).default(0),
  rating_average: z.number().min(0).max(5).nullable().optional(),
  rating_count: z.number().int().min(0).default(0),
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional()
});

export type CreateContentDto = z.infer<typeof createContentSchema>;

// Update Content Schema
export const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  content_type: z.enum(contentTypes).optional(),
  main_media_id: z.string().nullable().optional(),
  thumbnail_media_id: z.string().nullable().optional(),
  difficulty_level: z.enum(difficultyLevels).optional(),
  target_age_min: z.number().int().min(0).optional(),
  target_age_max: z.number().int().min(0).optional(),
  duration_minutes: z.number().int().min(0).optional(),
  topic_ids: z.array(z.string()).optional(),
  metadata: z.record(z.any()).nullable().optional(),
  updated_by: z.string().nullable().optional()
});

export type UpdateContentDto = z.infer<typeof updateContentSchema>;

// Content Progress Schema
export const trackProgressSchema = z.object({
  user_id: z.string().min(1, 'ID de usuario es requerido'),
  content_id: z.string().min(1, 'ID de contenido es requerido'),
  status: z.enum(progressStatuses).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  last_position_seconds: z.number().int().min(0).optional(),
  completion_rating: z.number().min(1).max(5).optional(),
  completion_feedback: z.string().optional(),
});

export type TrackProgressDto = z.infer<typeof trackProgressSchema>;

// Interaction Log Schema
export const trackInteractionSchema = z.object({
  user_id: z.string().min(1, 'ID de usuario es requerido'),
  content_id: z.string().min(1, 'ID de contenido es requerido'),
  session_id: z.string().min(1, 'ID de sesión es requerido'),
  action: z.enum(interactionActions),
  progress_at_action: z.number().int().min(0).max(100).nullable().optional(),
  time_spent_seconds: z.number().int().min(0).nullable().optional(),
  device_type: z.enum(deviceTypes).nullable().optional(),
  platform: z.enum(platforms).nullable().optional(),
  abandonment_reason: z.string().nullable().optional(),
  came_from: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export type TrackInteractionDto = z.infer<typeof trackInteractionSchema>;

// Tip Schema
export const createTipSchema = z.object({
  title: z.string().min(1, 'El título del tip es requerido'),
  content: z.string().min(1, 'El contenido del tip es requerido'),
  target_age_min: z.number().int().min(0).optional(),
  target_age_max: z.number().int().min(1).optional(),
  estimated_time_minutes: z.number().int().min(0).nullable().optional(),
  is_featured: z.boolean().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export type CreateTipDto = z.infer<typeof createTipSchema>;

// Topic Schema
export const createTopicSchema = z.object({
  name: z.string().min(1, 'El nombre del tema es requerido'),
  description: z.string().nullable().optional(),
  slug: z.string().min(1, 'El slug es requerido'),
  icon_url: z.string().url().nullable().optional(),
  color_hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color hex inválido').default('#4CAF50'),
  category: z.string().nullable().optional(),
  difficulty_level: z.enum(difficultyLevels).default('BEGINNER'),
  target_age_min: z.number().int().min(0).default(8),
  target_age_max: z.number().int().min(1).default(18),
  prerequisites: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type CreateTopicDto = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = createTopicSchema.partial();
export type UpdateTopicDto = z.infer<typeof updateTopicSchema>;

export interface ErrorResponse {
  status: 'error' | 'success';
  message: string;
  errors?: Array<{ code: string; message: string }>;
}