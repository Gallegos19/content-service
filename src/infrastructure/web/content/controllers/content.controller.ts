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
  CameFromType
} from '@domain/entities/content.entity';
import { CreateTipDto, UpdateTipDto } from '../dtos/tip.dto';
import { CreateTopicDto, UpdateTopicDto } from '../dtos/topic.dto';
import { z } from 'zod';
import { createTipSchema } from '../dto/tip.dto';
import { Content } from '../../../../domain/entities/content.entity';
import { ContentType, DifficultyLevel } from '../../../../domain/enums/content.enum';
import { ErrorResponse } from '../dto/content.dto';
import { Tip } from '@domain/entities/content.entity';
import { updateContentSchema } from '../dto/content.dto';
import { UpdateContentUseCase } from '@application/use-cases/content/update-content.use-case';
import bodyParser from 'body-parser';

const jsonParser = bodyParser.json();

// Define DTOs locally to avoid import issues
interface CreateContentDto {
  title: string;
  description?: string;
  content_type: string;
  main_media_id?: string;
  thumbnail_media_id?: string;
  difficulty_level?: string;
  target_age_min?: number;
  target_age_max?: number;
  reading_time_minutes?: number;
  duration_minutes?: number;
  is_downloadable?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
  published_at?: Date;
  metadata?: Record<string, any>;
}

interface UpdateContentDto extends Partial<CreateContentDto> {}

interface TrackProgressDto {
  user_id: string;
  content_id: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progress_percentage?: number;
  time_spent_seconds?: number;
  last_position_seconds?: number;
  completion_rating?: number;
  completion_feedback?: string;
}

interface TrackInteractionDto {
  user_id: string;
  content_id: string;
  session_id: string;
  action: string;
  progress_at_action?: number;
  time_spent_seconds?: number;
  device_type?: string;
  platform?: string;
  abandonment_reason?: string;
  came_from?: string;
  metadata?: Record<string, any>;
}

import { logger } from '@shared/utils/logger';
import { ApiError } from '@shared/middlewares/error.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@injectable()
export class ContentController {
  private readonly logger = logger;

  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService,
    @inject(TYPES.UpdateContentUseCase) private readonly updateContentUseCase: UpdateContentUseCase
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
      this.logger.error(`Error al obtener módulos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Crea un nuevo contenido
   */
  public createContent = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Mapeo seguro y valores por defecto
      const body = req.body;
      const contentData: CreateContentDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        content_type: body.content_type as ContentType,
        metadata: typeof body.metadata === 'object' ? body.metadata : {},
        view_count: body.view_count ?? 0,
        completion_count: body.completion_count ?? 0,
        rating_average: body.rating_average ?? null,
        rating_count: body.rating_count ?? 0,
        is_downloadable: body.is_downloadable ?? false,
        is_featured: body.is_featured ?? false,
        is_published: body.is_published ?? false,
        created_by: body.created_by ?? null,
        updated_by: body.updated_by ?? null,
        // otros campos opcionales según tu modelo
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
      this.logger.error(`Error al crear contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener contenido ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un contenido
   */
  public updateContent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      console.log(`Updating content with ID: ${id}`);
      
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          status: 'error', 
          message: 'ID del contenido es requerido' 
        });
      }
      
      const validatedData = updateContentSchema.parse({
        ...req.body,
        metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : null
      });
      
      const result = await this.updateContentUseCase.execute(
        id,
        {
          id,
          ...validatedData,
          updated_by: req.user?.id
        }
      );
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Datos inválidos',
          errors: error.errors
        });
      }
      
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
      this.logger.error(`Error deleting content ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene todos los tips
   */
  public getAllTips = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const tips = await this.contentService.getAllTips();
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: tips
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Crea un nuevo tip
   */
  public createTip = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const validatedData = createTipSchema.parse(req.body);
      
      const result = await this.contentService.createTip({
        title: validatedData.title,
        content: validatedData.content,
        tip_type: 'ARTICLE', 
        difficulty_level: 'BEGINNER', 
        target_age_min: validatedData.target_age_min ?? 0,
        target_age_max: validatedData.target_age_max ?? 100,
        estimated_time_minutes: validatedData.estimated_time_minutes ?? null,
        created_by: req.user?.id ?? null,
        metadata: validatedData.metadata ?? {},
      } as Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { metadata?: Record<string, any> | null });

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'Validation error',
          errors: error.errors.map(e => ({ code: e.code, message: e.message }))
        };
        return res.status(400).json(response);
      }
      
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error('Error creating tip:', error);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un tip por ID
   */
  public getTipById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const tip = await this.contentService.getTipById(req.params.id);
      if (!tip) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'Tip no encontrado'
        };
        return res.status(404).json(response);
      }
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: tip
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al obtener tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un tip
   */
  public updateTip = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;
      const updateData: UpdateTipDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        tip_type: body.tip_type,
        is_active: body.is_active,
        usage_count: body.usage_count,
        updated_by: body.updated_by,
        // otros campos opcionales según tu modelo
      };
      const tip = await this.contentService.updateTip(req.params.id, updateData as any);
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: tip
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al actualizar tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Elimina un tip
   */
  public deleteTip = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.contentService.deleteTip(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al eliminar tip ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene todos los temas
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
      this.logger.error(`Error al obtener temas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Crea un nuevo tema
   */
  public createTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;
      const topicData: CreateTopicDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        is_active: body.is_active ?? true,
        sort_order: body.sort_order ?? 0,
        prerequisites: Array.isArray(body.prerequisites) ? body.prerequisites : [],
        created_by: body.created_by ?? null,
        updated_by: body.updated_by ?? null,
        // otros campos opcionales según tu modelo
      };
      const topic = await this.contentService.createTopic(topicData as any);
      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al crear tema: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Obtiene un tema por ID
   */
  public getTopicById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const topic = await this.contentService.getTopicById(req.params.id);
      if (!topic) {
        const response: ErrorResponse = {
          status: 'error',
          message: 'Tema no encontrado'
        };
        return res.status(404).json(response);
      }
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al obtener tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Actualiza un tema
   */
  public updateTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;
      const updateData: UpdateTopicDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        is_active: body.is_active,
        sort_order: body.sort_order,
        prerequisites: Array.isArray(body.prerequisites) ? body.prerequisites : [],
        updated_by: body.updated_by,
        // otros campos opcionales según tu modelo
      };
      const topic = await this.contentService.updateTopic(req.params.id, updateData as any);
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al actualizar tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Elimina un tema
   */
  public deleteTopic = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.contentService.deleteTopic(req.params.id);
      return res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const response: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      this.logger.error(`Error al eliminar tema ${req.params.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener módulo ${req.params.moduleId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener contenido por tema ${req.params.topicId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener contenido para edad ${req.params.age}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

      // Log raw body for debugging
      console.log('Raw request body:', req.body);
      
      if (!req.body || typeof req.body !== 'object') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid request body format'
        });
      }

      // Extract values
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

      console.log('Processed progress data:', progressData);
      
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
      this.logger.error('Error tracking progress:', error);
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
      this.logger.error(`Error al obtener progreso del usuario ${req.params.userId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };

  /**
   * Registra una interacción del usuario con el contenido
   */
  public trackInteraction = async (req: Request, res: Response): Promise<Response> => {
    try {
      const interactionData: TrackInteractionDto = req.body;
      
      // Map the DTO to match the service expected format
      const interaction = await this.contentService.logInteraction({
        userId: interactionData.user_id,
        contentId: interactionData.content_id,
        sessionId: interactionData.session_id,
        action: interactionData.action as InteractionAction,
        progressAtAction: interactionData.progress_at_action ?? null,
        timeSpentSeconds: interactionData.time_spent_seconds ?? null,
        deviceType: interactionData.device_type as DeviceType,
        platform: interactionData.platform as PlatformType,
        cameFrom: interactionData.came_from as CameFromType,
        abandonmentReason: interactionData.abandonment_reason as AbandonmentReason,
        metadata: interactionData.metadata ?? null
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
      this.logger.error(`Error al registrar interacción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener analíticas de abandono para contenido ${req.params.contentId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener analíticas de efectividad para tema ${req.params.topicId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      this.logger.error(`Error al obtener contenido problemático: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return res.status(500).json(response);
    }
  };
}