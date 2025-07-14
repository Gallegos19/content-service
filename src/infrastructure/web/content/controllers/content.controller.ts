// src/infrastructure/web/content/controllers/content.controller.ts

import { Request, Response } from 'express';
import * as StatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '../../../../shared/constants/types';
import { 
  InteractionAction, 
  DeviceType, 
  PlatformType, 
  AbandonmentReason,
  CameFromType,
  ContentType,
  DifficultyLevel
} from '@domain/entities/content.entity';
import { z } from 'zod';
import { logger } from '@shared/utils/logger';
import { updateContentSchema } from '../dto/content.dto';

// Define DTOs locally to avoid import issues
interface CreateContentDto {
  title: string;
  description?: string | null;
  content_type: ContentType;
  main_media_id?: string | null;
  thumbnail_media_id?: string | null;
  difficulty_level?: DifficultyLevel;
  target_age_min?: number;
  target_age_max?: number;
  reading_time_minutes?: number | null;
  duration_minutes?: number | null;
  is_downloadable?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  published_at?: Date | null;
  metadata?: Record<string, any> | null;
  view_count?: number;
  completion_count?: number;
  rating_average?: number | null;
  rating_count?: number;
  created_by?: string | null;
  updated_by?: string | null;
  topic_ids?: string[];
}

interface UpdateContentDto extends Partial<CreateContentDto> {}

interface TrackProgressDto {
  userId: string;
  contentId: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage?: number;
  timeSpentSeconds?: number;
  lastPositionSeconds?: number;
  completionRating?: number;
  completionFeedback?: string;
}

interface TrackInteractionDto {
  userId: string;
  contentId: string;
  sessionId: string;
  action: InteractionAction;
  progressAtAction?: number | null;
  timeSpentSeconds?: number | null;
  deviceType?: DeviceType | null;
  platform?: PlatformType | null;
  abandonmentReason?: AbandonmentReason | null;
  cameFrom?: CameFromType | null;
  metadata?: Record<string, any> | null;
}

interface ErrorResponse {
  status: 'error' | 'success';
  message: string;
  errors?: Array<{ code: string; message: string }>;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@injectable()
export class ContentController {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService,
  ) {}

  /**
   * Obtiene todos los módulos de contenido
   */
  public getModules = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const modules = await this.contentService.findAllModules();
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: modules,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener módulos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Crea un nuevo contenido
   */
  public createContent = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;
      
      // Validate required fields
      if (!body.title || !body.content_type) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Title and content_type are required'
        });
      }

      const contentData: CreateContentDto = {
        title: body.title,
        description: body.description || null,
        content_type: body.content_type,
        main_media_id: body.main_media_id || null,
        thumbnail_media_id: body.thumbnail_media_id || null,
        difficulty_level: body.difficulty_level || 'BEGINNER',
        target_age_min: body.target_age_min || 8,
        target_age_max: body.target_age_max || 18,
        reading_time_minutes: body.reading_time_minutes || null,
        duration_minutes: body.duration_minutes || null,
        is_downloadable: body.is_downloadable || false,
        is_featured: body.is_featured || false,
        is_published: body.is_published || false,
        published_at: body.published_at ? new Date(body.published_at) : null,
        metadata: body.metadata || null,
        view_count: body.view_count || 0,
        completion_count: body.completion_count || 0,
        rating_average: body.rating_average || null,
        rating_count: body.rating_count || 0,
        created_by: body.created_by || null,
        updated_by: body.updated_by || null,
        topic_ids: body.topic_ids || []
      };

      const content = await this.contentService.createContent(contentData as any);
      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: content
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al crear contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un contenido por ID
   */
  public getContentById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const content = await this.contentService.getContentById(req.params.id);
      if (!content) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'Contenido no encontrado'
        };
        return res.status(404).json(response);
      }
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: content
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener contenido ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un contenido
   */
  public updateContent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          status: 'error', 
          message: 'ID del contenido es requerido' 
        });
      }
      
      try {
        const validatedData = updateContentSchema.parse(req.body);
        
        const result = await this.contentService.updateContent(
          id,
          {
            ...validatedData,
            updated_by: req.user?.id || null
          }
        );
        
        return res.status(StatusCodes.OK).json({
          status: 'success',
          data: result
        });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Datos inválidos',
            errors: validationError.errors
          });
        }
        throw validationError;
      }
    } catch (error) {
      logger.error('Error updating content:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error interno del servidor'
      });
    }
  };

  /**
   * Elimina un contenido
   */
  public deleteContent = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.contentService.deleteContent(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error deleting content ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene todos los tips (stub implementation)
   */
  public getAllTips = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const tips = await this.contentService.getAllTips();
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: tips,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener tips: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Crea un nuevo tip (stub implementation)
   */
  public createTip = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Tip creation not implemented yet'
      });
    } catch (error) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error('Error creating tip:', error);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un tip por ID (stub implementation)
   */
  public getTipById = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Get tip by ID not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un tip (stub implementation)
   */
  public updateTip = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Tip update not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al actualizar tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Elimina un tip (stub implementation)
   */
  public deleteTip = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Tip deletion not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al eliminar tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene todos los temas (stub implementation)
   */
  public getAllTopics = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const topics = await this.contentService.getAllTopics();
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: topics
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener temas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Crea un nuevo tema (stub implementation)
   */
  public createTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Topic creation not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al crear tema: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un tema por ID (stub implementation)
   */
  public getTopicById = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Get topic by ID not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un tema (stub implementation)
   */
  public updateTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Topic update not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al actualizar tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Elimina un tema (stub implementation)
   */
  public deleteTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({
        status: 'error',
        message: 'Topic deletion not implemented yet'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al eliminar tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un módulo por su ID
   */
  public getModuleById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { moduleId } = req.params;
      const module = await this.contentService.findModuleById(moduleId);
      
      if (!module) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'Módulo no encontrado'
        };
        return res.status(404).json(response);
      }
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: module,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener módulo ${req.params.moduleId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene contenido por ID de tema
   */
  public getContentByTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { topicId } = req.params;
      const content = await this.contentService.findContentByTopic(topicId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: content,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener contenido por tema ${req.params.topicId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene contenido por rango de edad
   */
  public getContentByAge = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { age } = req.params;
      const ageNum = parseInt(age, 10);
      
      if (isNaN(ageNum) || ageNum < 0) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'La edad debe ser un número positivo'
        };
        return res.status(400).json(response);
      }
      
      const content = await this.contentService.findContentByAge(ageNum);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: content,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener contenido para edad ${req.params.age}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Registra el progreso de un usuario en un contenido
   */
  public trackProgress = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.is('application/json')) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error', 
          message: 'Content-Type must be application/json'
        });
      }

      if (!req.body || typeof req.body !== 'object') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid request body format'
        });
      }

      // Extract values (handling both snake_case and camelCase)
      const userId = req.body.user_id || req.body.userId;
      const contentId = req.body.content_id || req.body.contentId;
      const status = req.body.status;
      const progressPercentage = req.body.progress_percentage ?? req.body.progressPercentage;
      const timeSpentSeconds = req.body.time_spent_seconds ?? req.body.timeSpentSeconds;
      const lastPositionSeconds = req.body.last_position_seconds ?? req.body.lastPositionSeconds;
      const completionRating = req.body.completion_rating ?? req.body.completionRating;
      const completionFeedback = req.body.completion_feedback ?? req.body.completionFeedback;

      // Validate required fields
      if (!userId || !contentId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'userId and contentId are required'
        });
      }

      // Transform and validate data
      const progressData = {
        userId,
        contentId,
        status: status || 'not_started',
        progressPercentage: typeof progressPercentage === 'number' ? progressPercentage : 0,
        timeSpentSeconds: typeof timeSpentSeconds === 'number' ? timeSpentSeconds : 0,
        lastPositionSeconds: typeof lastPositionSeconds === 'number' ? lastPositionSeconds : 0,
        completionRating,
        completionFeedback
      };
      
      const result = await this.contentService.trackUserProgress(progressData);
      if (!result) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Failed to track progress'
        });
      }
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error tracking progress:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to track progress'
      });
    }
  };

  /**
   * Obtiene el progreso de un usuario
   */
  public getUserProgress = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const progress = await this.contentService.getUserProgress(userId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: progress,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener progreso del usuario ${req.params.userId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Registra una interacción del usuario con el contenido
   */
  public trackInteraction = async (req: Request, res: Response): Promise<Response> => {
    try {
      const interactionData: TrackInteractionDto = req.body;
      
      // Validate required fields
      if (!interactionData.userId || !interactionData.contentId || !interactionData.action) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'userId, contentId and action are required'
        });
      }

      const interaction = await this.contentService.logInteraction({
        userId: interactionData.userId,
        contentId: interactionData.contentId,
        sessionId: interactionData.sessionId,
        action: interactionData.action,
        progressAtAction: interactionData.progressAtAction,
        timeSpentSeconds: interactionData.timeSpentSeconds,
        deviceType: interactionData.deviceType,
        platform: interactionData.platform,
        cameFrom: interactionData.cameFrom,
        abandonmentReason: interactionData.abandonmentReason,
        metadata: interactionData.metadata
      });
      
      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: interaction,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al registrar interacción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene estadísticas de abandono para un contenido
   */
  public getAbandonmentAnalytics = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { contentId } = req.params;
      const analytics = await this.contentService.getAbandonmentAnalytics(contentId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: analytics,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener analíticas de abandono para contenido ${req.params.contentId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene estadísticas de efectividad para un tema
   */
  public getEffectivenessAnalytics = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { topicId } = req.params;
      const analytics = await this.contentService.getEffectivenessAnalytics(topicId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: analytics,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener analíticas de efectividad para tema ${req.params.topicId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene contenido problemático
   */
  public getProblematicContent = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const problematicContent = await this.contentService.findProblematicContent();
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: problematicContent,
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      logger.error(`Error al obtener contenido problemático: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };
}