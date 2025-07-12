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
  DifficultyLevel,
  ContentType
} from '@domain/entities/content.entity';
import { CreateTipDto, UpdateTipDto } from '../dtos/tip.dto';
import { CreateTopicDto, UpdateTopicDto } from '../dtos/topic.dto';


type CameFromType = 'home' | 'search' | 'recommendation' | 'topic';

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

@injectable()
export class ContentController {
  constructor(
    @inject(TYPES.ContentService) private readonly contentService: ContentService
  ) {}

  /**
   * Obtiene todos los módulos de contenido
   */
  public getModules = async (_req: Request, res: Response): Promise<void> => {
    try {
      const modules = await this.contentService.findAllModules();
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: modules,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener módulos';
      logger.error(`Error al obtener módulos: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Crea un nuevo contenido
   */
  public createContent = async (req: Request, res: Response): Promise<void> => {
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
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: content
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear contenido';
      logger.error(`Error al crear contenido: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene un contenido por ID
   */
  public getContentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const content = await this.contentService.getContentById(req.params.id);
      if (!content) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Contenido no encontrado');
      }
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: content
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener contenido';
      logger.error(`Error al obtener contenido ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Actualiza un contenido
   */
  public updateContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const updateData: UpdateContentDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        content_type: body.content_type as ContentType,
        metadata: typeof body.metadata === 'object' ? body.metadata : {},
        // Solo actualiza si los campos vienen en el body, si no, ignóralos
        view_count: body.view_count,
        completion_count: body.completion_count,
        rating_average: body.rating_average,
        rating_count: body.rating_count,
        is_downloadable: body.is_downloadable,
        is_featured: body.is_featured,
        is_published: body.is_published,
        updated_by: body.updated_by,
        // otros campos opcionales según tu modelo
      };
      const content = await this.contentService.updateContent(req.params.id, updateData as any);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: content
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar contenido';
      logger.error(`Error al actualizar contenido ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };


  /**
   * Elimina un contenido
   */
  public deleteContent = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.contentService.deleteContent(req.params.id);
      res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar contenido';
      logger.error(`Error al eliminar contenido ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene todos los tips
   */
  public getAllTips = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tips = await this.contentService.getAllTips();
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: tips
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener tips';
      logger.error(`Error al obtener tips: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Crea un nuevo tip
   */
  public createTip = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const tipData: CreateTipDto = {
        ...body,
        difficulty_level: body.difficulty_level as DifficultyLevel,
        tip_type: body.tip_type ?? 'GENERAL',
        is_active: body.is_active ?? true,
        usage_count: body.usage_count ?? 0,
        created_by: body.created_by ?? null,
        updated_by: body.updated_by ?? null,
        // otros campos opcionales según tu modelo
      };
      const tip = await this.contentService.createTip(tipData as any);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: tip
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear tip';
      logger.error(`Error al crear tip: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene un tip por ID
   */
  public getTipById = async (req: Request, res: Response): Promise<void> => {
    try {
      const tip = await this.contentService.getTipById(req.params.id);
      if (!tip) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Tip no encontrado');
      }
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: tip
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener tip';
      logger.error(`Error al obtener tip ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Actualiza un tip
   */
  public updateTip = async (req: Request, res: Response): Promise<void> => {
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
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: tip
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tip';
      logger.error(`Error al actualizar tip ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Elimina un tip
   */
  public deleteTip = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.contentService.deleteTip(req.params.id);
      res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tip';
      logger.error(`Error al eliminar tip ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene todos los temas
   */
  public getAllTopics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const topics = await this.contentService.getAllTopics();
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: topics
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener temas';
      logger.error(`Error al obtener temas: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Crea un nuevo tema
   */
  public createTopic = async (req: Request, res: Response): Promise<void> => {
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
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear tema';
      logger.error(`Error al crear tema: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene un tema por ID
   */
  public getTopicById = async (req: Request, res: Response): Promise<void> => {
    try {
      const topic = await this.contentService.getTopicById(req.params.id);
      if (!topic) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Tema no encontrado');
      }
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener tema';
      logger.error(`Error al obtener tema ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Actualiza un tema
   */
  public updateTopic = async (req: Request, res: Response): Promise<void> => {
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
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: topic
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tema';
      logger.error(`Error al actualizar tema ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Elimina un tema
   */
  public deleteTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.contentService.deleteTopic(req.params.id);
      res.status(StatusCodes.NO_CONTENT).json({
        status: 'success'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tema';
      logger.error(`Error al eliminar tema ${req.params.id}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene un módulo por su ID
   */
  public getModuleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { moduleId } = req.params;
      const module = await this.contentService.findModuleById(moduleId);
      
      if (!module) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Módulo no encontrado');
      }
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: module,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener módulo';
      logger.error(`Error al obtener módulo ${req.params.moduleId}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene contenido por ID de tema
   */
  public getContentByTopic = async (req: Request, res: Response): Promise<void> => {
    try {
      const { topicId } = req.params;
      const content = await this.contentService.findContentByTopic(topicId);
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: content,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener contenido por tema';
      logger.error(`Error al obtener contenido por tema ${req.params.topicId}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene contenido por rango de edad
   */
  public getContentByAge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { age } = req.params;
      const ageNum = parseInt(age, 10);
      
      if (isNaN(ageNum) || ageNum < 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'La edad debe ser un número positivo');
      }
      
      const content = await this.contentService.findContentByAge(ageNum);
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: content,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener contenido por edad';
      logger.error(`Error al obtener contenido para edad ${req.params.age}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Registra el progreso de un usuario en un contenido
   */
  public trackProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const progressData: TrackProgressDto = req.body;
      
      // Transform snake_case to camelCase
      const transformedData = {
        userId: progressData.user_id,
        contentId: progressData.content_id,
        status: progressData.status,
        progressPercentage: progressData.progress_percentage,
        timeSpentSeconds: progressData.time_spent_seconds,
        lastPositionSeconds: progressData.last_position_seconds,
        completionRating: progressData.completion_rating,
        completionFeedback: progressData.completion_feedback
      };
      
      const progress = await this.contentService.trackUserProgress(transformedData);
      
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: progress,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar progreso';
      logger.error(`Error al registrar progreso: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene el progreso de un usuario
   */
  public getUserProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const progress = await this.contentService.getUserProgress(userId);
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: progress,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener progreso del usuario';
      logger.error(`Error al obtener progreso del usuario ${req.params.userId}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Registra una interacción del usuario con el contenido
   */
  public trackInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
      const interactionData: TrackInteractionDto = req.body;
      
      // Map the DTO to match the service expected format
      const interaction = await this.contentService.logInteraction({
        userId: interactionData.user_id,
        contentId: interactionData.content_id,
        sessionId: interactionData.session_id,
        action: interactionData.action as InteractionAction,
        progressAtAction: interactionData.progress_at_action,
        timeSpentSeconds: interactionData.time_spent_seconds,
        deviceType: interactionData.device_type as DeviceType,
        platformType: interactionData.platform as PlatformType,
        cameFrom: interactionData.came_from as CameFromType,
        metadata: interactionData.metadata,
        timestamp: new Date()
      });
      
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: interaction,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar interacción';
      logger.error(`Error al registrar interacción: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene estadísticas de abandono para un contenido
   */
  public getAbandonmentAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contentId } = req.params;
      const analytics = await this.contentService.getAbandonmentAnalytics(contentId);
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: analytics,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener analíticas de abandono';
      logger.error(`Error al obtener analíticas de abandono para contenido ${req.params.contentId}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene estadísticas de efectividad para un tema
   */
  public getEffectivenessAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { topicId } = req.params;
      const analytics = await this.contentService.getEffectivenessAnalytics(topicId);
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: analytics,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener analíticas de efectividad';
      logger.error(`Error al obtener analíticas de efectividad para tema ${req.params.topicId}: ${errorMessage}`);
      throw error;
    }
  };

  /**
   * Obtiene contenido problemático
   */
  public getProblematicContent = async (_req: Request, res: Response): Promise<void> => {
    try {
      const problematicContent = await this.contentService.findProblematicContent();
      
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: problematicContent,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener contenido problemático';
      logger.error(`Error al obtener contenido problemático: ${errorMessage}`);
      throw error;
    }
  };
}