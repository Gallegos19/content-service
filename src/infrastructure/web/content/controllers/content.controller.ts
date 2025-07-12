import { Request, Response } from 'express';
import * as StatusCodes from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { ContentService } from '@domain/services/content.service';
import { TYPES } from '../../../../shared/constants/types';
import { 
  InteractionAction, 
  DeviceType, 
  PlatformType, 
  AbandonmentReason
} from '@domain/enums/content.enum';

type CameFromType = 'home' | 'search' | 'recommendation' | 'topic';
import { 
  CreateContentDto, 
  UpdateContentDto, 
  TrackProgressDto, 
  TrackInteractionDto,
  contentResponseSchema,
  userProgressResponseSchema,
  abandonmentAnalyticsResponseSchema,
  problematicContentResponseSchema
} from '../dto/content.dto';
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
      const contentData: CreateContentDto = req.body;
      const content = await this.contentService.createContent(contentData);
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
      const updateData: UpdateContentDto = req.body;
      const content = await this.contentService.updateContent(req.params.id, updateData);
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
      const tipData = req.body;
      const tip = await this.contentService.createTip(tipData);
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
      const updateData = req.body;
      const tip = await this.contentService.updateTip(req.params.id, updateData);
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
      const topicData = req.body;
      const topic = await this.contentService.createTopic(topicData);
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
      const updateData = req.body;
      const topic = await this.contentService.updateTopic(req.params.id, updateData);
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
  }

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
      const interaction = await this.contentService.trackInteraction({
        userId: interactionData.user_id,
        contentId: interactionData.content_id,
        sessionId: interactionData.session_id,
        action: interactionData.action as InteractionAction,
        progressAtAction: interactionData.progress_at_action,
        timeSpentSeconds: interactionData.time_spent_seconds,
        deviceType: interactionData.device_type as DeviceType | null,
        platform: interactionData.platform as PlatformType | null,
        abandonmentReason: interactionData.abandonment_reason as AbandonmentReason | null,
        cameFrom: interactionData.came_from as CameFromType | null,
        metadata: interactionData.metadata
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
