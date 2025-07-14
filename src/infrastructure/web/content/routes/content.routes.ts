import { Router } from 'express';
import bodyParser from 'body-parser';
import { container } from '../../../config/container';
import { validate } from '@shared/middlewares/validation.middleware';
import { 
  createContentSchema, 
  updateContentSchema, 
  trackProgressSchema, 
  trackInteractionSchema 
} from '../dto/content.dto';
import { TYPES } from '../../../../shared/constants/types';
import { ContentController } from '@infrastructure/web/content/controllers/content.controller';
import { NextFunction, Request, Response } from 'express';

const router = Router();
const contentController = container.get<ContentController>(TYPES.ContentController);

// Add this for JSON body parsing
const jsonParser = bodyParser.json();

// ===== MODULES ROUTES =====

/**
 * @swagger
 * /api/content/modules:
 *   get:
 *     summary: Obtiene todos los módulos de contenido
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de módulos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Module'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/modules', (req, res) => contentController.getModules(req, res));

/**
 * @swagger
 * /api/content/module/{moduleId}:
 *   get:
 *     summary: Obtiene un módulo por su ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del módulo
 *     responses:
 *       200:
 *         description: Módulo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Module'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/module/:moduleId', (req, res) => contentController.getModuleById(req, res));

// ===== CONTENT ROUTES =====

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Crea un nuevo contenido educativo
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content_type, main_media_id, thumbnail_media_id]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introducción al Álgebra
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Conceptos básicos de álgebra
 *               content_type:
 *                 type: string
 *                 enum: [VIDEO, ARTICLE, QUIZ, INTERACTIVE, OTHER]
 *                 example: ARTICLE
 *               main_media_id:
 *                 type: string
 *                 format: uuid
 *               thumbnail_media_id:
 *                 type: string
 *                 format: uuid
 *               difficulty_level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                 default: BEGINNER
 *               target_age_min:
 *                 type: integer
 *                 default: 8
 *               target_age_max:
 *                 type: integer
 *                 default: 18
 *               reading_time_minutes:
 *                 type: integer
 *                 nullable: true
 *               duration_minutes:
 *                 type: integer
 *                 nullable: true
 *               is_downloadable:
 *                 type: boolean
 *                 default: false
 *               is_featured:
 *                 type: boolean
 *                 default: false
 *               is_published:
 *                 type: boolean
 *                 default: false
 *               published_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Contenido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', validate(createContentSchema), (req, res) => contentController.createContent(req, res));

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Obtiene un contenido por ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del contenido
 *     responses:
 *       200:
 *         description: Contenido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', (req, res) => contentController.getContentById(req, res));

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Actualiza un contenido existente
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del contenido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               content_type:
 *                 type: string
 *                 enum: [VIDEO, ARTICLE, QUIZ, INTERACTIVE, OTHER]
 *               main_media_id:
 *                 type: string
 *                 format: uuid
 *               thumbnail_media_id:
 *                 type: string
 *                 format: uuid
 *               difficulty_level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               target_age_min:
 *                 type: integer
 *               target_age_max:
 *                 type: integer
 *               duration_minutes:
 *                 type: integer
 *               topic_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Contenido actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Content'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', validate(updateContentSchema), contentController.updateContent);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Elimina un contenido
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del contenido
 *     responses:
 *       204:
 *         description: Contenido eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', (req, res) => contentController.deleteContent(req, res));

/**
 * @swagger
 * /api/content/by-topic/{topicId}:
 *   get:
 *     summary: Obtiene contenido por ID de tema
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tema
 *     responses:
 *       200:
 *         description: Lista de contenido para el tema especificado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Content'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/by-topic/:topicId', (req, res) => contentController.getContentByTopic(req, res));

/**
 * @swagger
 * /api/content/by-age/{age}:
 *   get:
 *     summary: Obtiene contenido por edad objetivo
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: age
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Edad del usuario
 *     responses:
 *       200:
 *         description: Lista de contenido apropiado para la edad especificada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Content'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/by-age/:age', (req, res) => contentController.getContentByAge(req, res));

// ===== TOPICS ROUTES =====

/**
 * @swagger
 * /api/content/topics:
 *   get:
 *     summary: Obtiene todos los temas
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de temas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Topic'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/topics', (req, res) => contentController.getAllTopics(req, res));

/**
 * @swagger
 * /api/content/topics:
 *   post:
 *     summary: Crea un nuevo tema
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Matemáticas
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Contenido relacionado con matemáticas
 *               slug:
 *                 type: string
 *                 example: matematicas
 *               icon_url:
 *                 type: string
 *                 nullable: true
 *               color_hex:
 *                 type: string
 *                 default: '#4CAF50'
 *               category:
 *                 type: string
 *                 nullable: true
 *               difficulty_level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                 default: BEGINNER
 *               target_age_min:
 *                 type: integer
 *                 default: 8
 *               target_age_max:
 *                 type: integer
 *                 default: 18
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: []
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               sort_order:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Tema creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Topic'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/topics', (req, res) => contentController.createTopic(req, res));

/**
 * @swagger
 * /api/content/topics/{id}:
 *   get:
 *     summary: Obtiene un tema por ID
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tema
 *     responses:
 *       200:
 *         description: Tema encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Topic'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/topics/:id', (req, res) => contentController.getTopicById(req, res));

/**
 * @swagger
 * /api/content/topics/{id}:
 *   put:
 *     summary: Actualiza un tema
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               slug:
 *                 type: string
 *               icon_url:
 *                 type: string
 *                 nullable: true
 *               color_hex:
 *                 type: string
 *               category:
 *                 type: string
 *                 nullable: true
 *               difficulty_level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               target_age_min:
 *                 type: integer
 *               target_age_max:
 *                 type: integer
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_active:
 *                 type: boolean
 *               sort_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tema actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Topic'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/topics/:id', (req, res) => contentController.updateTopic(req, res));

/**
 * @swagger
 * /api/content/topics/{id}:
 *   delete:
 *     summary: Elimina un tema
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tema
 *     responses:
 *       204:
 *         description: Tema eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/topics/:id', (req, res) => contentController.deleteTopic(req, res));

// ===== TIPS ROUTES =====

/**
 * @swagger
 * /api/content/tips:
 *   get:
 *     summary: Obtiene todos los tips
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tips obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tip'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/tips', (req, res) => contentController.getAllTips(req, res));

/**
 * @swagger
 * /api/content/tips:
 *   post:
 *     summary: Crea un nuevo tip
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Consejo de estudio
 *               content:
 *                 type: string
 *                 example: Toma descansos regulares para mejorar la retención
 *               tip_type:
 *                 type: string
 *                 default: GENERAL
 *               target_age_min:
 *                 type: integer
 *                 default: 8
 *               target_age_max:
 *                 type: integer
 *                 default: 18
 *               estimated_time_minutes:
 *                 type: integer
 *                 nullable: true
 *               is_featured:
 *                 type: boolean
 *                 default: false
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 default: {}
 *     responses:
 *       201:
 *         description: Tip creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tip'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/tips', (req, res) => contentController.createTip(req, res));

/**
 * @swagger
 * /api/content/tips/{id}:
 *   get:
 *     summary: Obtiene un tip por ID
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tip
 *     responses:
 *       200:
 *         description: Tip encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tip'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/tips/:id', (req, res) => contentController.getTipById(req, res));

/**
 * @swagger
 * /api/content/tips/{id}:
 *   put:
 *     summary: Actualiza un tip
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tip
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tip_type:
 *                 type: string
 *               target_age_min:
 *                 type: integer
 *               target_age_max:
 *                 type: integer
 *               estimated_time_minutes:
 *                 type: integer
 *                 nullable: true
 *               is_featured:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Tip actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Tip'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/tips/:id', (req, res) => contentController.updateTip(req, res));

/**
 * @swagger
 * /api/content/tips/{id}:
 *   delete:
 *     summary: Elimina un tip
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tip
 *     responses:
 *       204:
 *         description: Tip eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/tips/:id', (req, res) => contentController.deleteTip(req, res));

// ===== PROGRESS TRACKING ROUTES =====

// Validation middleware for progress tracking
const validateProgress = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Request body is required' 
    });
  }
  
  // Extract fields (handling both snake_case and camelCase)
  const userId = req.body.user_id || req.body.userId;
  const contentId = req.body.content_id || req.body.contentId;
  const status = req.body.status;
  
  // Validate only required fields
  const result = trackProgressSchema.safeParse({
    user_id: userId,
    content_id: contentId,
    status
  });
  
  if (!result.success) {
    return res.status(400).json({ 
      status: 'error',
      message: result.error.issues.map(issue => issue.message).join(', ') 
    });
  }
  
  // Ensure the body has the expected fields
  req.body.userId = userId;
  req.body.contentId = contentId;
  
  next();
};

/**
 * @swagger
 * /api/content/track-progress:
 *   post:
 *     summary: Registra el progreso de un usuario en un contenido
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, contentId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario
 *               contentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del contenido
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed, paused]
 *                 default: not_started
 *                 description: Estado del progreso
 *               progressPercentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *                 description: Porcentaje de progreso (0-100)
 *               timeSpentSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Tiempo dedicado en segundos
 *               lastPositionSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Última posición en segundos (para contenido de video/audio)
 *               completionRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 nullable: true
 *                 description: Calificación del usuario al completar (1-5)
 *               completionFeedback:
 *                 type: string
 *                 nullable: true
 *                 description: Comentarios del usuario al completar
 *           examples:
 *             start_progress:
 *               summary: Iniciar progreso
 *               value:
 *                 userId: 550e8400-e29b-41d4-a716-446655440000
 *                 contentId: 550e8400-e29b-41d4-a716-446655440001
 *                 status: in_progress
 *                 progressPercentage: 0
 *             update_progress:
 *               summary: Actualizar progreso
 *               value:
 *                 userId: 550e8400-e29b-41d4-a716-446655440000
 *                 contentId: 550e8400-e29b-41d4-a716-446655440001
 *                 status: in_progress
 *                 progressPercentage: 45
 *                 timeSpentSeconds: 1800
 *                 lastPositionSeconds: 1650
 *             complete_progress:
 *               summary: Completar progreso
 *               value:
 *                 userId: 550e8400-e29b-41d4-a716-446655440000
 *                 contentId: 550e8400-e29b-41d4-a716-446655440001
 *                 status: completed
 *                 progressPercentage: 100
 *                 timeSpentSeconds: 3600
 *                 completionRating: 5
 *                 completionFeedback: Excelente contenido
 *     responses:
 *         description: Progreso registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContentProgress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/track-progress', 
  jsonParser, 
  validateProgress,
  (req, res) => contentController.trackProgress(req, res)
);

/**
 * @swagger
 * /api/content/user-progress/{userId}:
 *   get:
 *     summary: Obtiene el progreso de un usuario
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Progreso del usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContentProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/user-progress/:userId', (req, res) => contentController.getUserProgress(req, res));

// ===== ANALYTICS ROUTES =====

/**
 * @swagger
 * /api/content/track-interaction:
 *   post:
 *     summary: Registra una interacción del usuario con el contenido
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, content_id, session_id, action]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario
 *               content_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del contenido
 *               session_id:
 *                 type: string
 *                 description: ID de la sesión del usuario
 *               action:
 *                 type: string
 *                 enum: [start, pause, resume, complete, abandon]
 *                 description: Acción realizada por el usuario
 *               progress_at_action:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 nullable: true
 *                 description: Porcentaje de progreso en el momento de la acción
 *               time_spent_seconds:
 *                 type: integer
 *                 minimum: 0
 *                 nullable: true
 *                 description: Tiempo dedicado en segundos hasta el momento de la acción
 *               device_type:
 *                 type: string
 *                 enum: [mobile, tablet, desktop]
 *                 nullable: true
 *                 description: Tipo de dispositivo utilizado
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 nullable: true
 *                 description: Plataforma utilizada
 *               abandonment_reason:
 *                 type: string
 *                 enum: [difficulty, boring, error, other]
 *                 nullable: true
 *                 description: Razón de abandono (solo si action es "abandon")
 *               came_from:
 *                 type: string
 *                 enum: [home, search, recommendation, topic]
 *                 nullable: true
 *                 description: Punto de origen de la interacción
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Metadatos adicionales de la interacción
 *           examples:
 *             start_interaction:
 *               summary: Iniciar contenido
 *               value:
 *                 user_id: 550e8400-e29b-41d4-a716-446655440000
 *                 content_id: 550e8400-e29b-41d4-a716-446655440001
 *                 session_id: session-123456
 *                 action: start
 *                 device_type: desktop
 *                 platform: web
 *                 came_from: home
 *             abandon_interaction:
 *               summary: Abandonar contenido
 *               value:
 *                 user_id: 550e8400-e29b-41d4-a716-446655440000
 *                 content_id: 550e8400-e29b-41d4-a716-446655440001
 *                 session_id: session-123456
 *                 action: abandon
 *                 progress_at_action: 35
 *                 time_spent_seconds: 450
 *                 device_type: mobile
 *                 platform: ios
 *                 abandonment_reason: difficulty
 *     responses:
 *       201:
 *         description: Interacción registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/InteractionLog'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/track-interaction', jsonParser, validate(trackInteractionSchema), (req, res) => 
  contentController.trackInteraction(req, res)
);

/**
 * @swagger
 * /api/content/analytics/abandonment/{contentId}:
 *   get:
 *     summary: Obtiene estadísticas de abandono para un contenido
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del contenido
 *     responses:
 *       200:
 *         description: Estadísticas de abandono obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AbandonmentAnalytics'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics/abandonment/:contentId', (req, res) => 
  contentController.getAbandonmentAnalytics(req, res)
);

/**
 * @swagger
 * /api/content/analytics/effectiveness/{topicId}:
 *   get:
 *     summary: Obtiene estadísticas de efectividad para un tema
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del tema
 *     responses:
 *       200:
 *         description: Estadísticas de efectividad obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EffectivenessAnalytics'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics/effectiveness/:topicId', (req, res) => 
  contentController.getEffectivenessAnalytics(req, res)
);

/**
 * @swagger
 * /api/content/analytics/problematic:
 *   get:
 *     summary: Obtiene contenido problemático basado en métricas de interacción
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contenido problemático obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProblematicContent'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics/problematic', (req, res) => 
  contentController.getProblematicContent(req, res)
);

export { router as contentRouter };
