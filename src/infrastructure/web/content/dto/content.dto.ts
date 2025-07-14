import { z } from 'zod';
import { ContentWithTopics } from "@domain/entities";
import { ContentType, DifficultyLevel } from "@domain/enums";

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
  description: z.string().nullable(),
  content_type: z.enum(contentTypes),
  main_media_id: z.string().uuid('ID de archivo multimedia no válido'),
  thumbnail_media_id: z.string().uuid('ID de miniatura no válido'),
  difficulty_level: z.enum(difficultyLevels).default('BEGINNER'),
  target_age_min: z.number().int().min(0, 'La edad mínima debe ser 0 o más'),
  target_age_max: z.number().int().min(1, 'La edad máxima debe ser 1 o más'),
  reading_time_minutes: z.number().int().positive('El tiempo de lectura debe ser un número positivo').nullable().optional().default(null),
  duration_minutes: z.number().int().positive('La duración debe ser un número positivo').optional(),
  is_downloadable: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  published_at: z.string().datetime().optional().nullable(),
  topic_ids: z.array(z.string().uuid('ID de tema no válido')).default([]),
  metadata: z.record(z.any()).default({}),
});

export type CreateContentDto = z.infer<typeof createContentSchema>;

// Update Content Schema
export const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  content_type: z.nativeEnum(ContentType).optional(),
  main_media_id: z.string().uuid().optional(),
  thumbnail_media_id: z.string().uuid().optional(),
  difficulty_level: z.enum(difficultyLevels).optional(),
  target_age_min: z.number().int().min(0).optional(),
  target_age_max: z.number().int().min(0).optional(),
  duration_minutes: z.number().int().min(0).optional(),
  topic_ids: z.array(z.string().uuid()).optional()
});

export type UpdateContentDto = z.infer<typeof updateContentSchema>;

// Content Progress Schema
export const trackProgressSchema = z.object({
  user_id: z.string().uuid('ID de usuario no válido'),
  content_id: z.string().uuid('ID de contenido no válido'),
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
  user_id: z.string().uuid('ID de usuario no válido'),
  content_id: z.string().uuid('ID de contenido no válido'),
  session_id: z.string().uuid('ID de sesión no válido'),
  action: z.enum(interactionActions),
  progress_at_action: z.number().int().min(0).max(100).default(0),
  time_spent_seconds: z.number().int().min(0).default(0),
  device_type: z.enum(deviceTypes).optional(),
  platform: z.enum(platforms).optional(),
  abandonment_reason: z.string().optional(),
  came_from: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  platforms: z.enum(['ios', 'android', 'web']).optional(),
  abandonmentReason: z.enum(['difficulty', 'boring', 'error', 'other']).optional(),
  cameFrom: z.enum(['home', 'search', 'recommendation', 'topic']).optional(),
});

export type TrackInteractionDto = z.infer<typeof trackInteractionSchema>;

// Esquema para la respuesta de contenido
export const contentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  contentType: z.string(),
  contentUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  difficultyLevel: z.string(),
  targetAgeMin: z.number(),
  targetAgeMax: z.number(),
  readingTimeMinutes: z.number().nullable(),
  isDownloadable: z.boolean(),
  isFeatured: z.boolean(),
  viewCount: z.number(),
  completionCount: z.number(),
  ratingAverage: z.number().nullable(),
  ratingCount: z.number(),
  isPublished: z.boolean(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  topics: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    isPrimary: z.boolean(),
  })),
});

export type ContentResponseDto = z.infer<typeof contentResponseSchema>;

// Esquema para la respuesta de progreso de usuario
export const userProgressResponseSchema = z.object({
  contentId: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  progressPercentage: z.number(),
  timeSpentSeconds: z.number(),
  lastPositionSeconds: z.number(),
  lastAccessedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export type UserProgressResponseDto = z.infer<typeof userProgressResponseSchema>;

// Esquema para la respuesta de analíticas de abandono
export const abandonmentAnalyticsResponseSchema = z.object({
  contentId: z.string().uuid(),
  totalStarts: z.number(),
  totalCompletions: z.number(),
  completionRate: z.number(),
  avgAbandonmentPoint: z.number(),
  abandonmentByDevice: z.record(z.number()),
});

export type AbandonmentAnalyticsResponseDto = z.infer<typeof abandonmentAnalyticsResponseSchema>;

// Esquema para la respuesta de contenido problemático
export const problematicContentResponseSchema = z.object({
  contentId: z.string().uuid(),
  title: z.string(),
  completionRate: z.number(),
  avgAbandonmentPoint: z.number(),
  priority: z.enum(['BAJO', 'MEDIO', 'ALTO', 'CRÍTICO']),
  recommendation: z.string(),
});

export type ProblematicContentResponseDto = z.infer<typeof problematicContentResponseSchema>;

export const contentDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  content_type: z.nativeEnum(ContentType),
  main_media_id: z.string().uuid().nullable(),
  thumbnail_media_id: z.string().uuid().nullable(),
  difficulty_level: z.nativeEnum(DifficultyLevel),
  target_age_min: z.number(),
  target_age_max: z.number(),
  reading_time_minutes: z.number().nullable(),
  duration_minutes: z.number().nullable(),
  is_downloadable: z.boolean(),
  is_featured: z.boolean(),
  view_count: z.number(),
  completion_count: z.number(),
  rating_average: z.number().nullable(),
  rating_count: z.number(),
  metadata: z.record(z.any()).nullable(),
  is_published: z.boolean(),
  published_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
});

export type ContentDto = z.infer<typeof contentDtoSchema>;

export interface ErrorResponse {
  status: 'error' | 'success';
  message: string;
  errors?: Array<{ code: string; message: string }>;
}
