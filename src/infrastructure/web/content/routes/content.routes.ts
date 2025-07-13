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

const router = Router();
const contentController = container.get<ContentController>(TYPES.ContentController);

// Add this for JSON body parsing
const jsonParser = bodyParser.json();

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Gestión de contenido educativo
 */

/**
 * @swagger
 * /api/content/modules:
 *   get:
 *     summary: Obtiene todos los módulos de contenido
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de módulos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 */
router.get('/modules', (req, res) => contentController.getModules(req, res));

/**
 * @swagger
 * /api/content/:
 *   post:
 *     summary: Crea un nuevo contenido
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContent'
 *     responses:
 *       201:
 *         description: Contenido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentResponse'
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
 *     responses:
 *       200:
 *         description: Contenido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentResponse'
 */
router.get('/:id', (req, res) => contentController.getContentById(req, res));

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Actualiza un contenido
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateContent'
 *     responses:
 *       200:
 *         description: Contenido actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentResponse'
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
 *     responses:
 *       204:
 *         description: Contenido eliminado exitosamente
 */
router.delete('/:id', (req, res) => contentController.deleteContent(req, res));

/**
 * @swagger
 * /api/tips:
 *   get:
 *     summary: Obtiene todos los tips
 *     tags: [Tips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tip'
 */
router.get('/tips', (req, res) => contentController.getAllTips(req, res));

/**
 * @swagger
 * /api/tips:
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
 *             $ref: '#/components/schemas/CreateTip'
 *     responses:
 *       201:
 *         description: Tip creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tip'
 */
router.post('/tips', (req, res) => contentController.createTip(req, res));

/**
 * @swagger
 * /api/tips/{id}:
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
 *     responses:
 *       200:
 *         description: Tip encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tip'
 */
router.get('/tips/:id', (req, res) => contentController.getTipById(req, res));

/**
 * @swagger
 * /api/tips/{id}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTip'
 *     responses:
 *       200:
 *         description: Tip actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tip'
 */
router.put('/tips/:id', (req, res) => contentController.updateTip(req, res));

/**
 * @swagger
 * /api/tips/{id}:
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
 *     responses:
 *       204:
 *         description: Tip eliminado exitosamente
 */
router.delete('/tips/:id', (req, res) => contentController.deleteTip(req, res));

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Obtiene todos los temas
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de temas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Topic'
 */
router.get('/topics', (req, res) => contentController.getAllTopics(req, res));

/**
 * @swagger
 * /api/topics:
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
 *             $ref: '#/components/schemas/CreateTopic'
 *     responses:
 *       201:
 *         description: Tema creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.post('/topics', (req, res) => contentController.createTopic(req, res));

/**
 * @swagger
 * /api/topics/{id}:
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
 *     responses:
 *       200:
 *         description: Tema encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.get('/topics/:id', (req, res) => contentController.getTopicById(req, res));

/**
 * @swagger
 * /api/topics/{id}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTopic'
 *     responses:
 *       200:
 *         description: Tema actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 */
router.put('/topics/:id', (req, res) => contentController.updateTopic(req, res));

/**
 * @swagger
 * /api/topics/{id}:
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
 *     responses:
 *       204:
 *         description: Tema eliminado exitosamente
 */
router.delete('/topics/:id', (req, res) => contentController.deleteTopic(req, res));

/**
 * @swagger
 * /api/content/module/{moduleId}:
 *   get:
 *     summary: Obtiene un módulo por su ID
 *     tags: [Content]
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
 *         description: Detalles del módulo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Module'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/module/:moduleId', (req, res) => contentController.getModuleById(req, res));

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
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
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
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *       400:
 *         description: Edad inválida
 */
router.get('/by-age/:age', (req, res) => contentController.getContentByAge(req, res));

/**
 * @swagger
 * /api/content/track-progress:
 *   post:
 *     summary: Registra el progreso de un usuario en un contenido
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - contentId
 *               - status
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
 *                 description: Estado del progreso
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Porcentaje de progreso (0-100)
 *               timeSpentSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 description: Tiempo dedicado en segundos
 *               lastPositionSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 description: Última posición en segundos (para contenido de video/audio)
 *               completionRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Calificación del usuario al completar (1-5)
 *               completionFeedback:
 *                 type: string
 *                 description: Comentarios del usuario al completar
 *     responses:
 *       201:
 *         description: Progreso registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ContentProgress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
import { NextFunction, Request, Response } from 'express';

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
 *     tags: [Content]
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
 *         description: Progreso del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProgress'
 */
router.get('/user-progress/:userId', (req, res) => contentController.getUserProgress(req, res));

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
 *             required:
 *               - userId
 *               - contentId
 *               - sessionId
 *               - action
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del usuario
 *               contentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del contenido
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la sesión del usuario
 *               action:
 *                 type: string
 *                 enum: [start, pause, resume, complete, abandon]
 *                 description: Acción realizada por el usuario
 *               progressAtAction:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *                 description: Porcentaje de progreso en el momento de la acción
 *               timeSpentSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Tiempo dedicado en segundos hasta el momento de la acción
 *               deviceType:
 *                 type: string
 *                 enum: [mobile, tablet, desktop]
 *                 description: Tipo de dispositivo utilizado
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 description: Plataforma utilizada
 *               abandonmentReason:
 *                 type: string
 *                 enum: [difficulty, boring, error, other]
 *                 description: Razón de abandono (solo si action es 'abandon')
 *               cameFrom:
 *                 type: string
 *                 enum: [home, search, recommendation, topic]
 *                 description: Punto de origen de la interacción
 *     responses:
 *       201:
 *         description: Interacción registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/InteractionLog'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *         description: Estadísticas de abandono
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/AbandonmentAnalytics'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *         description: Estadísticas de efectividad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/EffectivenessAnalytics'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *         description: Lista de contenido problemático
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProblematicContent'
 */
router.get('/analytics/problematic', (req, res) => 
  contentController.getProblematicContent(req, res)
);

export { router as contentRouter };
