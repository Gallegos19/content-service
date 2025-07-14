import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Content Service API',
      version,
      description: `
        API para la gestión de contenido educativo
        
        ## Características
        - Gestión completa de contenido educativo
        - Seguimiento de progreso del usuario
        - Sistema de tips y recomendaciones
        - Analíticas y métricas de engagement
        - Organización por temas y módulos
        
        ## Autenticación
        Todos los endpoints requieren autenticación mediante Bearer Token.
        
        ## Códigos de Respuesta
        - 200: Éxito
        - 201: Creado exitosamente
        - 204: Sin contenido (eliminación exitosa)
        - 400: Error de validación
        - 401: No autorizado
        - 403: Prohibido
        - 404: No encontrado
        - 500: Error interno del servidor
      `,
      contact: {
        name: 'Soporte Técnico',
        email: 'soporte@educaplus.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.educaplus.com',
        description: 'Servidor de producción',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticación. Formato: Bearer {token}'
        },
      },
      parameters: {
        ContentId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID único del contenido',
          example: '550e8400-e29b-41d4-a716-446655440000'
        },
        TopicId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID único del tema',
          example: '550e8400-e29b-41d4-a716-446655440001'
        },
        TipId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID único del tip',
          example: '550e8400-e29b-41d4-a716-446655440002'
        },
        ModuleId: {
          name: 'moduleId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID único del módulo',
          example: '550e8400-e29b-41d4-a716-446655440003'
        },
        UserId: {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID único del usuario',
          example: '550e8400-e29b-41d4-a716-446655440004'
        },
        Age: {
          name: 'age',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 0, maximum: 120 },
          description: 'Edad del usuario',
          example: 15
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['status', 'message'],
          properties: {
            status: { 
              type: 'string', 
              enum: ['error'],
              example: 'error' 
            },
            message: { 
              type: 'string', 
              example: 'Mensaje de error descriptivo' 
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR',
              description: 'Código de error específico'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'title' },
                  message: { type: 'string', example: 'Title is required' },
                  code: { type: 'string', example: 'REQUIRED' }
                }
              },
              description: 'Detalles específicos de errores de validación'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:30:00Z'
            }
          },
        },
        SuccessResponse: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { 
              type: 'string', 
              enum: ['success'],
              example: 'success' 
            },
            message: {
              type: 'string',
              example: 'Operación completada exitosamente'
            },
            data: { 
              type: 'object',
              description: 'Datos de respuesta específicos del endpoint'
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                version: { type: 'string' }
              }
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 150 },
            itemCount: { type: 'integer', example: 10 },
            itemsPerPage: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 15 },
            currentPage: { type: 'integer', example: 1 }
          }
        },
        Content: {
          type: 'object',
          required: ['title', 'content_type', 'main_media_id', 'thumbnail_media_id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
              readOnly: true,
              description: 'Identificador único del contenido'
            },
            title: { 
              type: 'string', 
              minLength: 1,
              maxLength: 255,
              example: 'Introducción a las Matemáticas',
              description: 'Título del contenido educativo'
            },
            description: { 
              type: 'string', 
              nullable: true,
              maxLength: 2000,
              example: 'Conceptos básicos de aritmética y álgebra para estudiantes principiantes',
              description: 'Descripción detallada del contenido'
            },
            content_type: { 
              type: 'string', 
              enum: ['VIDEO', 'ARTICLE', 'QUIZ', 'INTERACTIVE', 'OTHER'],
              example: 'VIDEO',
              description: 'Tipo de contenido según enumeración'
            },
            main_media_id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440010',
              description: 'ID del recurso multimedia principal'
            },
            thumbnail_media_id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440011',
              description: 'ID de la imagen miniatura'
            },
            difficulty_level: {
              type: 'string',
              enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              example: 'BEGINNER',
              default: 'BEGINNER',
              description: 'Nivel de dificultad del contenido'
            },
            target_age_min: {
              type: 'integer',
              minimum: 0,
              maximum: 120,
              example: 8,
              default: 8,
              description: 'Edad mínima recomendada'
            },
            target_age_max: {
              type: 'integer',
              minimum: 1,
              maximum: 120,
              example: 12,
              default: 18,
              description: 'Edad máxima recomendada'
            },
            reading_time_minutes: {
              type: 'integer',
              minimum: 1,
              example: 15,
              nullable: true,
              description: 'Tiempo estimado de lectura en minutos (solo para artículos)'
            },
            duration_minutes: {
              type: 'integer',
              minimum: 1,
              example: 30,
              nullable: true,
              description: 'Duración en minutos (para videos y contenido temporal)'
            },
            is_downloadable: {
              type: 'boolean',
              example: false,
              default: false,
              description: 'Indica si el contenido puede descargarse para uso offline'
            },
            is_featured: {
              type: 'boolean',
              example: false,
              default: false,
              description: 'Indica si el contenido es destacado en la plataforma'
            },
            is_published: {
              type: 'boolean',
              example: true,
              default: false,
              description: 'Indica si el contenido está publicado y visible'
            },
            published_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00Z',
              nullable: true,
              description: 'Fecha y hora de publicación'
            },
            view_count: {
              type: 'integer',
              minimum: 0,
              example: 150,
              default: 0,
              description: 'Número total de visualizaciones'
            },
            completion_count: {
              type: 'integer',
              minimum: 0,
              example: 85,
              default: 0,
              description: 'Número total de completaciones'
            },
            rating_average: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              example: 4.5,
              nullable: true,
              description: 'Calificación promedio (0-5 estrellas)'
            },
            rating_count: {
              type: 'integer',
              minimum: 0,
              example: 25,
              default: 0,
              description: 'Número total de calificaciones'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              example: {
                "video_url": "https://example.com/video.mp4",
                "subtitles": "https://example.com/subtitles.vtt",
                "chapters": [
                  {"title": "Introducción", "start": 0},
                  {"title": "Conceptos Básicos", "start": 300}
                ]
              },
              description: 'Metadatos adicionales específicos del tipo de contenido'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-01T00:00:00Z',
              description: 'Fecha de creación del contenido'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-15T10:30:00Z',
              description: 'Fecha de última actualización'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              readOnly: true,
              description: 'Fecha de eliminación (soft delete)'
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440005',
              description: 'ID del usuario que creó el contenido'
            },
            updated_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440006',
              description: 'ID del usuario que actualizó el contenido por última vez'
            },
            contentTopics: {
              type: 'array',
              items: { $ref: '#/components/schemas/ContentTopic' },
              description: 'Temas asociados al contenido'
            }
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Introducción al Álgebra',
            description: 'Conceptos básicos de álgebra para estudiantes principiantes',
            content_type: 'VIDEO',
            main_media_id: '550e8400-e29b-41d4-a716-446655440010',
            thumbnail_media_id: '550e8400-e29b-41d4-a716-446655440011',
            difficulty_level: 'BEGINNER',
            target_age_min: 12,
            target_age_max: 16,
            duration_minutes: 25,
            is_published: true,
            view_count: 150,
            rating_average: 4.5,
            created_at: '2025-01-01T00:00:00Z'
          }
        },
        ContentTopic: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440020'
            },
            content_id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            topic_id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            is_primary: { 
              type: 'boolean',
              example: true,
              description: 'Indica si este es el tema principal del contenido'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00Z'
            },
            topic: {
              $ref: '#/components/schemas/Topic'
            }
          }
        },
        Topic: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Matemáticas',
              description: 'Nombre del tema'
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 2000,
              example: 'Contenido relacionado con matemáticas, álgebra y geometría',
              description: 'Descripción detallada del tema'
            },
            slug: {
              type: 'string',
              pattern: '^[a-z0-9-]+$',
              maxLength: 200,
              example: 'matematicas',
              description: 'Slug único del tema para URLs amigables'
            },
            icon_url: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://example.com/icons/math.svg',
              description: 'URL del icono representativo del tema'
            },
            color_hex: {
              type: 'string',
              pattern: '^#[0-9A-F]{6}$',
              example: '#4CAF50',
              default: '#4CAF50',
              description: 'Color hexadecimal asociado al tema'
            },
            category: {
              type: 'string',
              nullable: true,
              maxLength: 100,
              example: 'STEM',
              description: 'Categoría general del tema'
            },
            difficulty_level: {
              type: 'string',
              enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              example: 'BEGINNER',
              default: 'BEGINNER',
              description: 'Nivel de dificultad general del tema'
            },
            target_age_min: {
              type: 'integer',
              minimum: 0,
              maximum: 120,
              example: 8,
              default: 8,
              description: 'Edad mínima objetivo para este tema'
            },
            target_age_max: {
              type: 'integer',
              minimum: 1,
              maximum: 120,
              example: 18,
              default: 18,
              description: 'Edad máxima objetivo para este tema'
            },
            prerequisites: {
              type: 'array',
              items: { type: 'string' },
              default: [],
              example: ['Aritmética básica', 'Números enteros'],
              description: 'Lista de prerrequisitos para este tema'
            },
            is_active: {
              type: 'boolean',
              default: true,
              example: true,
              description: 'Indica si el tema está activo y visible'
            },
            sort_order: {
              type: 'integer',
              minimum: 0,
              default: 0,
              example: 1,
              description: 'Orden de clasificación para mostrar temas'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-15T10:30:00Z'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              readOnly: true
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440005'
            },
            updated_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440006'
            }
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Matemáticas',
            description: 'Contenido relacionado con matemáticas básicas y avanzadas',
            slug: 'matematicas',
            color_hex: '#4CAF50',
            difficulty_level: 'BEGINNER',
            target_age_min: 8,
            target_age_max: 18,
            is_active: true,
            sort_order: 1
          }
        },
        Tip: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
              example: '550e8400-e29b-41d4-a716-446655440002'
            },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Consejo de estudio efectivo',
              description: 'Título del tip o consejo'
            },
            content: {
              type: 'string',
              minLength: 1,
              example: 'Toma descansos de 10 minutos cada hora para mejorar la retención y concentración',
              description: 'Contenido detallado del tip'
            },
            tip_type: {
              type: 'string',
              example: 'STUDY_TIP',
              default: 'GENERAL',
              enum: ['GENERAL', 'STUDY_TIP', 'MOTIVATIONAL', 'TECHNICAL', 'SAFETY'],
              description: 'Categoría del tip'
            },
            category: {
              type: 'string',
              nullable: true,
              maxLength: 100,
              example: 'Productividad',
              description: 'Categoría específica del tip'
            },
            target_age_min: {
              type: 'integer',
              minimum: 0,
              example: 8,
              default: 8,
              description: 'Edad mínima objetivo'
            },
            target_age_max: {
              type: 'integer',
              minimum: 1,
              example: 18,
              default: 18,
              description: 'Edad máxima objetivo'
            },
            difficulty_level: {
              type: 'string',
              example: 'easy',
              default: 'easy',
              enum: ['easy', 'medium', 'hard'],
              description: 'Nivel de dificultad para aplicar el tip'
            },
            action_required: {
              type: 'boolean',
              default: false,
              example: true,
              description: 'Indica si el tip requiere una acción específica'
            },
            action_instructions: {
              type: 'string',
              nullable: true,
              example: 'Configura un temporizador de 50 minutos seguido de 10 minutos de descanso',
              description: 'Instrucciones específicas para aplicar el tip'
            },
            estimated_time_minutes: {
              type: 'integer',
              minimum: 1,
              nullable: true,
              example: 5,
              description: 'Tiempo estimado para leer/aplicar el tip'
            },
            impact_level: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
              example: 'high',
              description: 'Nivel de impacto esperado del tip'
            },
            source_url: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://example.com/study-tips',
              description: 'URL de la fuente original del tip'
            },
            image_url: {
              type: 'string',
              format: 'uri',
              nullable: true,
              example: 'https://example.com/images/study-tip.jpg',
              description: 'URL de imagen ilustrativa del tip'
            },
            is_active: {
              type: 'boolean',
              default: true,
              example: true,
              description: 'Indica si el tip está activo'
            },
            is_featured: {
              type: 'boolean',
              default: false,
              example: false,
              description: 'Indica si el tip es destacado'
            },
            valid_from: {
              type: 'string',
              format: 'date',
              nullable: true,
              example: '2025-01-01',
              description: 'Fecha desde la cual el tip es válido'
            },
            valid_until: {
              type: 'string',
              format: 'date',
              nullable: true,
              example: '2025-12-31',
              description: 'Fecha hasta la cual el tip es válido'
            },
            usage_count: {
              type: 'integer',
              minimum: 0,
              default: 0,
              example: 150,
              description: 'Número de veces que se ha mostrado el tip'
            },
            content_id: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440000',
              description: 'ID del contenido relacionado (opcional)'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              default: {},
              example: {
                "tags": ["productividad", "concentración"],
                "difficulty_score": 2
              },
              description: 'Metadatos adicionales del tip'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-15T10:30:00Z'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              readOnly: true
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440005'
            },
            updated_by: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '550e8400-e29b-41d4-a716-446655440006'
            }
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            title: 'Técnica Pomodoro',
            content: 'Divide tu tiempo de estudio en bloques de 25 minutos con descansos de 5 minutos',
            tip_type: 'STUDY_TIP',
            target_age_min: 12,
            target_age_max: 25,
            estimated_time_minutes: 3,
            impact_level: 'high',
            is_active: true
          }
        },
        Module: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              readOnly: true,
              example: '550e8400-e29b-41d4-a716-446655440003'
            },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Módulo de Matemáticas Básicas',
              description: 'Nombre descriptivo del módulo'
            },
            description: {
              type: 'string',
              nullable: true,
              maxLength: 2000,
              example: 'Módulo que cubre conceptos fundamentales de matemáticas',
              description: 'Descripción detallada del módulo'
            },
            order: {
              type: 'integer',
              minimum: 0,
              example: 1,
              description: 'Orden de visualización del módulo'
            },
            is_active: {
              type: 'boolean',
              default: true,
              example: true,
              description: 'Indica si el módulo está activo'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              readOnly: true,
              example: '2025-01-15T10:30:00Z'
            }
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Matemáticas Básicas',
            description: 'Fundamentos de aritmética y álgebra',
            order: 1,
            is_active: true
          }
        },
        ContentProgress: {
          type: 'object',
          required: ['contentId', 'title', 'status'],
          properties: {
            contentId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: { 
              type: 'string',
              example: 'Introducción al Álgebra',
              description: 'Título del contenido'
            },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'completed', 'paused'],
              example: 'in_progress',
              description: 'Estado actual del progreso'
            },
            progressPercentage: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              example: 65,
              description: 'Porcentaje de progreso completado'
            },
            timeSpentSeconds: {
              type: 'integer',
              minimum: 0,
              example: 1800,
              description: 'Tiempo total dedicado en segundos'
            },
            lastPositionSeconds: {
              type: 'integer',
              minimum: 0,
              example: 1650,
              description: 'Última posición reproducida (para contenido temporal)'
            },
            lastAccessedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-01-15T10:30:00Z',
              description: 'Fecha del último acceso'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-01-15T11:00:00Z',
              description: 'Fecha de completación (si aplica)'
            },
            completionRating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              nullable: true,
              example: 5,
              description: 'Calificación dada por el usuario al completar'
            },
            completionFeedback: {
              type: 'string',
              nullable: true,
              example: 'Excelente explicación, muy claro',
              description: 'Comentarios del usuario al completar'
            },
            firstAccessedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-01-10T09:00:00Z',
              description: 'Fecha del primer acceso al contenido'
            }
          },
          example: {
            contentId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Introducción al Álgebra',
            status: 'in_progress',
            progressPercentage: 65,
            timeSpentSeconds: 1800,
            lastPositionSeconds: 1650,
            lastAccessedAt: '2025-01-15T10:30:00Z'
          }
        },
        InteractionLog: {
          type: 'object',
          required: ['id', 'userId', 'contentId', 'sessionId', 'action'],
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              readOnly: true,
              example: '550e8400-e29b-41d4-a716-446655440030'
            },
            userId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440004'
            },
            contentId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            sessionId: { 
              type: 'string',
              example: 'session-abc123def456',
              description: 'Identificador único de la sesión'
            },
            action: {
              type: 'string',
              enum: ['start', 'pause', 'resume', 'complete', 'abandon'],
              example: 'start',
              description: 'Acción realizada por el usuario'
            },
            actionTimestamp: { 
              type: 'string', 
              format: 'date-time',
              readOnly: true,
              example: '2025-01-15T10:30:00Z',
              description: 'Momento exacto de la acción'
            },
            progressAtAction: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              nullable: true,
              example: 45,
              description: 'Porcentaje de progreso en el momento de la acción'
            },
            timeSpentSeconds: {
              type: 'integer',
              minimum: 0,
              nullable: true,
              example: 900,
              description: 'Tiempo acumulado hasta la acción'
            },
            deviceType: {
              type: 'string',
              enum: ['mobile', 'tablet', 'desktop'],
              nullable: true,
              example: 'desktop',
              description: 'Tipo de dispositivo utilizado'
            },
            platform: {
              type: 'string',
              enum: ['ios', 'android', 'web'],
              nullable: true,
              example: 'web',
              description: 'Plataforma desde la cual se accedió'
            },
            abandonmentReason: {
              type: 'string',
              enum: ['difficulty', 'boring', 'error', 'time_constraint', 'technical_issue', 'other'],
              nullable: true,
              example: 'difficulty',
              description: 'Razón del abandono (solo para action=abandon)'
            },
            cameFrom: {
              type: 'string',
              enum: ['home', 'search', 'recommendation', 'topic', 'direct_link'],
              nullable: true,
              example: 'search',
              description: 'Punto de origen de la interacción'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              example: {
                "search_query": "álgebra básica",
                "referrer": "https://google.com",
                "user_agent": "Mozilla/5.0..."
              },
              description: 'Metadatos adicionales de contexto'
            }
          },
          example: {
            id: '550e8400-e29b-41d4-a716-446655440030',
            userId: '550e8400-e29b-41d4-a716-446655440004',
            contentId: '550e8400-e29b-41d4-a716-446655440000',
            sessionId: 'session-abc123def456',
            action: 'start',
            actionTimestamp: '2025-01-15T10:30:00Z',
            deviceType: 'desktop',
            platform: 'web',
            cameFrom: 'search'
          }
        },
        AbandonmentAnalytics: {
          type: 'object',
          required: ['contentId', 'totalStarts', 'totalCompletions'],
          properties: {
            contentId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: { 
              type: 'string',
              example: 'Introducción al Álgebra',
              description: 'Título del contenido analizado'
            },
            totalStarts: { 
              type: 'integer',
              minimum: 0,
              example: 200,
              description: 'Número total de inicios del contenido'
            },
            totalCompletions: { 
              type: 'integer',
              minimum: 0,
              example: 120,
              description: 'Número total de completaciones'
            },
            totalAbandons: {
              type: 'integer',
              minimum: 0,
              example: 80,
              description: 'Número total de abandonos'
            },
            completionRate: { 
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 60.0,
              description: 'Porcentaje de completación'
            },
            abandonmentRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 40.0,
              description: 'Porcentaje de abandono'
            },
            avgAbandonmentPoint: { 
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 35.5,
              description: 'Punto promedio de abandono en porcentaje'
            },
            avgTimeToAbandon: {
              type: 'number',
              minimum: 0,
              example: 450.5,
              description: 'Tiempo promedio hasta el abandono en segundos'
            },
            abandonmentByDevice: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: {
                "mobile": 45,
                "desktop": 30,
                "tablet": 5
              },
              description: 'Distribución de abandonos por tipo de dispositivo'
            },
            abandonmentByReason: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: {
                "difficulty": 25,
                "boring": 15,
                "time_constraint": 20,
                "technical_issue": 5,
                "other": 15
              },
              description: 'Distribución de abandonos por razón'
            },
            peakAbandonmentTimes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timeRange: { type: 'string', example: '10-15%' },
                  count: { type: 'integer', example: 25 },
                  percentage: { type: 'number', example: 31.25 }
                }
              },
              description: 'Momentos con mayor abandono'
            }
          },
          example: {
            contentId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Introducción al Álgebra',
            totalStarts: 200,
            totalCompletions: 120,
            totalAbandons: 80,
            completionRate: 60.0,
            abandonmentRate: 40.0,
            avgAbandonmentPoint: 35.5,
            abandonmentByDevice: {
              "mobile": 45,
              "desktop": 30,
              "tablet": 5
            }
          }
        },
        EffectivenessAnalytics: {
          type: 'object',
          required: ['topicId', 'topicName', 'totalContent'],
          properties: {
            topicId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            topicName: { 
              type: 'string',
              example: 'Matemáticas',
              description: 'Nombre del tema analizado'
            },
            totalContent: { 
              type: 'integer',
              minimum: 0,
              example: 15,
              description: 'Número total de contenidos en el tema'
            },
            publishedContent: {
              type: 'integer',
              minimum: 0,
              example: 12,
              description: 'Número de contenidos publicados'
            },
            totalViews: { 
              type: 'integer',
              minimum: 0,
              example: 1500,
              description: 'Vistas totales de todos los contenidos del tema'
            },
            totalCompletions: { 
              type: 'integer',
              minimum: 0,
              example: 900,
              description: 'Completaciones totales del tema'
            },
            uniqueUsers: {
              type: 'integer',
              minimum: 0,
              example: 350,
              description: 'Usuarios únicos que interactuaron con el tema'
            },
            averageCompletionRate: { 
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 60.0,
              description: 'Tasa de completación promedio del tema'
            },
            averageTimeSpent: { 
              type: 'number',
              minimum: 0,
              example: 1800.5,
              description: 'Tiempo promedio dedicado al tema en segundos'
            },
            averageRating: { 
              type: 'number',
              minimum: 0,
              maximum: 5,
              example: 4.2,
              description: 'Calificación promedio del tema'
            },
            averageCompletionTime: {
              type: 'number',
              minimum: 0,
              example: 2400.0,
              description: 'Tiempo promedio para completar contenido del tema'
            },
            engagementScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 72.5,
              description: 'Puntuación de engagement calculada'
            },
            difficultyDistribution: {
              type: 'object',
              properties: {
                BEGINNER: { type: 'integer', example: 8 },
                INTERMEDIATE: { type: 'integer', example: 5 },
                ADVANCED: { type: 'integer', example: 2 }
              },
              description: 'Distribución de contenido por dificultad'
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:30:00Z',
              description: 'Fecha de última actualización de las analíticas'
            },
            mostEngagedContent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  completionRate: { type: 'number' },
                  averageRating: { type: 'number' },
                  viewCount: { type: 'integer' }
                }
              },
              maxItems: 5,
              description: 'Top 5 contenidos con mejor engagement'
            },
            leastEngagedContent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  completionRate: { type: 'number' },
                  averageRating: { type: 'number' },
                  viewCount: { type: 'integer' }
                }
              },
              maxItems: 5,
              description: 'Top 5 contenidos con menor engagement'
            },
            trendsLastMonth: {
              type: 'object',
              properties: {
                viewsChange: { type: 'number', example: 15.5 },
                completionRateChange: { type: 'number', example: -2.3 },
                ratingChange: { type: 'number', example: 0.1 }
              },
              description: 'Cambios en métricas del último mes'
            }
          },
          example: {
            topicId: '550e8400-e29b-41d4-a716-446655440001',
            topicName: 'Matemáticas',
            totalContent: 15,
            publishedContent: 12,
            totalViews: 1500,
            totalCompletions: 900,
            averageCompletionRate: 60.0,
            averageTimeSpent: 1800.5,
            averageRating: 4.2,
            engagementScore: 72.5
          }
        },
        ProblematicContent: {
          type: 'object',
          required: ['contentId', 'title', 'completionRate', 'priority'],
          properties: {
            contentId: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: { 
              type: 'string',
              example: 'Álgebra Avanzada',
              description: 'Título del contenido problemático'
            },
            completionRate: { 
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 25.5,
              description: 'Tasa de completación actual'
            },
            viewCount: {
              type: 'integer',
              minimum: 0,
              example: 200,
              description: 'Número total de visualizaciones'
            },
            avgAbandonmentPoint: { 
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 20.3,
              description: 'Punto promedio de abandono'
            },
            avgTimeToAbandon: {
              type: 'number',
              minimum: 0,
              example: 180.5,
              description: 'Tiempo promedio hasta abandono en segundos'
            },
            priority: {
              type: 'string',
              enum: ['BAJO', 'MEDIO', 'ALTO', 'CRÍTICO'],
              example: 'ALTO',
              description: 'Nivel de prioridad para revisión'
            },
            riskScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 78.5,
              description: 'Puntuación de riesgo calculada'
            },
            recommendation: { 
              type: 'string',
              example: 'Considerar rediseñar la introducción y simplificar conceptos complejos',
              description: 'Recomendación específica para mejorar el contenido'
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    enum: ['high_abandonment', 'low_rating', 'technical_issues', 'content_difficulty'],
                    example: 'high_abandonment'
                  },
                  severity: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'critical'],
                    example: 'high'
                  },
                  description: { 
                    type: 'string',
                    example: 'Los usuarios abandonan frecuentemente en los primeros 5 minutos'
                  },
                  affectedUsers: { type: 'integer', example: 45 }
                }
              },
              description: 'Lista de problemas identificados'
            },
            suggestedActions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', example: 'Revisar introducción' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  estimatedImpact: { type: 'string', enum: ['low', 'medium', 'high'] },
                  estimatedEffort: { type: 'string', enum: ['low', 'medium', 'high'] }
                }
              },
              description: 'Acciones sugeridas para mejorar el contenido'
            },
            lastAnalyzed: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-15T10:30:00Z',
              description: 'Fecha del último análisis'
            },
            trendDirection: {
              type: 'string',
              enum: ['improving', 'stable', 'declining'],
              example: 'declining',
              description: 'Tendencia de las métricas'
            }
          },
          example: {
            contentId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Álgebra Avanzada',
            completionRate: 25.5,
            avgAbandonmentPoint: 20.3,
            priority: 'ALTO',
            riskScore: 78.5,
            recommendation: 'Revisar estructura del contenido y reducir complejidad inicial',
            trendDirection: 'declining'
          }
        },
        UserTipsHistory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            tipId: { type: 'string', format: 'uuid' },
            shownAt: { type: 'string', format: 'date-time' },
            wasRead: { type: 'boolean', default: false },
            wasActedUpon: { type: 'boolean', default: false },
            userRating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
            userFeedback: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateContentRequest: {
          type: 'object',
          required: ['title', 'content_type', 'main_media_id', 'thumbnail_media_id'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', nullable: true, maxLength: 2000 },
            content_type: { type: 'string', enum: ['VIDEO', 'ARTICLE', 'QUIZ', 'INTERACTIVE', 'OTHER'] },
            main_media_id: { type: 'string', format: 'uuid' },
            thumbnail_media_id: { type: 'string', format: 'uuid' },
            difficulty_level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
            target_age_min: { type: 'integer', minimum: 0, maximum: 120, default: 8 },
            target_age_max: { type: 'integer', minimum: 1, maximum: 120, default: 18 },
            reading_time_minutes: { type: 'integer', minimum: 1, nullable: true },
            duration_minutes: { type: 'integer', minimum: 1, nullable: true },
            is_downloadable: { type: 'boolean', default: false },
            is_featured: { type: 'boolean', default: false },
            is_published: { type: 'boolean', default: false },
            published_at: { type: 'string', format: 'date-time', nullable: true },
            metadata: { type: 'object', additionalProperties: true, nullable: true }
          }
        },
        UpdateContentRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', nullable: true, maxLength: 2000 },
            content_type: { type: 'string', enum: ['VIDEO', 'ARTICLE', 'QUIZ', 'INTERACTIVE', 'OTHER'] },
            main_media_id: { type: 'string', format: 'uuid' },
            thumbnail_media_id: { type: 'string', format: 'uuid' },
            difficulty_level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
            target_age_min: { type: 'integer', minimum: 0, maximum: 120 },
            target_age_max: { type: 'integer', minimum: 1, maximum: 120 },
            duration_minutes: { type: 'integer', minimum: 1 },
            topic_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
            metadata: { type: 'object', additionalProperties: true, nullable: true }
          }
        },
        TrackProgressRequest: {
          type: 'object',
          required: ['userId', 'contentId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            contentId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'paused'], default: 'not_started' },
            progressPercentage: { type: 'integer', minimum: 0, maximum: 100, default: 0 },
            timeSpentSeconds: { type: 'integer', minimum: 0, default: 0 },
            lastPositionSeconds: { type: 'integer', minimum: 0, default: 0 },
            completionRating: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
            completionFeedback: { type: 'string', nullable: true, maxLength: 1000 }
          }
        },
        TrackInteractionRequest: {
          type: 'object',
          required: ['user_id', 'content_id', 'session_id', 'action'],
          properties: {
            user_id: { type: 'string', format: 'uuid' },
            content_id: { type: 'string', format: 'uuid' },
            session_id: { type: 'string', minLength: 1 },
            action: { type: 'string', enum: ['start', 'pause', 'resume', 'complete', 'abandon'] },
            progress_at_action: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            time_spent_seconds: { type: 'integer', minimum: 0, nullable: true },
            device_type: { type: 'string', enum: ['mobile', 'tablet', 'desktop'], nullable: true },
            platform: { type: 'string', enum: ['ios', 'android', 'web'], nullable: true },
            abandonment_reason: { type: 'string', enum: ['difficulty', 'boring', 'error', 'time_constraint', 'technical_issue', 'other'], nullable: true },
            came_from: { type: 'string', enum: ['home', 'search', 'recommendation', 'topic', 'direct_link'], nullable: true },
            metadata: { type: 'object', additionalProperties: true, nullable: true }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticación no proporcionado, inválido o expirado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                missingToken: {
                  summary: 'Token faltante',
                  value: {
                    status: 'error',
                    message: 'Token de autenticación requerido',
                    code: 'MISSING_TOKEN',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                },
                invalidToken: {
                  summary: 'Token inválido',
                  value: {
                    status: 'error',
                    message: 'Token de autenticación inválido',
                    code: 'INVALID_TOKEN',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            },
          },
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                fieldValidation: {
                  summary: 'Error de validación de campos',
                  value: {
                    status: 'error',
                    message: 'Error de validación',
                    code: 'VALIDATION_ERROR',
                    errors: [
                      { field: 'title', message: 'Title is required', code: 'REQUIRED' },
                      { field: 'content_type', message: 'Must be one of: VIDEO, ARTICLE, QUIZ, INTERACTIVE, OTHER', code: 'INVALID_ENUM' }
                    ],
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                },
                formatValidation: {
                  summary: 'Error de formato',
                  value: {
                    status: 'error',
                    message: 'Formato de datos inválido',
                    code: 'FORMAT_ERROR',
                    errors: [
                      { field: 'main_media_id', message: 'Must be a valid UUID', code: 'INVALID_FORMAT' }
                    ],
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        },
        BadRequestError: {
          description: 'Solicitud mal formada o datos inválidos',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                malformedRequest: {
                  summary: 'Request malformado',
                  value: {
                    status: 'error',
                    message: 'Request body must be valid JSON',
                    code: 'MALFORMED_REQUEST',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                },
                invalidOperation: {
                  summary: 'Operación inválida',
                  value: {
                    status: 'error',
                    message: 'Cannot perform this operation on published content',
                    code: 'INVALID_OPERATION',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso solicitado no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                contentNotFound: {
                  summary: 'Contenido no encontrado en la ruta',
                  value: {
                    status: 'error',
                    message: 'Content not found',
                    code: 'CONTENT_NOT_FOUND',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                },
                topicNotFound: {
                  summary: 'Tema no encontrado',
                  value: {
                    status: 'error',
                    message: 'Topic not found',
                    code: 'TOPIC_NOT_FOUND',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tiene permisos para realizar esta operación',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                insufficientPermissions: {
                  summary: 'Permisos insuficientes',
                  value: {
                    status: 'error',
                    message: 'Insufficient permissions to perform this action',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        },
        ConflictError: {
          description: 'Conflicto con el estado actual del recurso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                duplicateResource: {
                  summary: 'Recurso duplicado',
                  value: {
                    status: 'error',
                    message: 'A topic with this slug already exists',
                    code: 'DUPLICATE_SLUG',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        },
        TooManyRequestsError: {
          description: 'Demasiadas solicitudes - límite de rate limiting excedido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                rateLimitExceeded: {
                  summary: 'Rate limit excedido',
                  value: {
                    status: 'error',
                    message: 'Too many requests, please try again later',
                    code: 'RATE_LIMIT_EXCEEDED',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          },
          headers: {
            'X-RateLimit-Limit': {
              schema: { type: 'integer' },
              description: 'Límite de requests por ventana de tiempo'
            },
            'X-RateLimit-Remaining': {
              schema: { type: 'integer' },
              description: 'Requests restantes en la ventana actual'
            },
            'X-RateLimit-Reset': {
              schema: { type: 'integer' },
              description: 'Timestamp cuando se resetea el límite'
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                databaseError: {
                  summary: 'Error de base de datos',
                  value: {
                    status: 'error',
                    message: 'Internal server error occurred',
                    code: 'DATABASE_ERROR',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                },
                serviceUnavailable: {
                  summary: 'Servicio no disponible',
                  value: {
                    status: 'error',
                    message: 'Service temporarily unavailable',
                    code: 'SERVICE_UNAVAILABLE',
                    timestamp: '2025-01-15T10:30:00Z'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Modules',
        description: 'Operaciones relacionadas con módulos educativos'
      },
      {
        name: 'Content',
        description: 'Gestión completa de contenido educativo (CRUD y búsquedas)'
      },
      {
        name: 'Topics',
        description: 'Gestión de temas y categorías de contenido'
      },
      {
        name: 'Tips',
        description: 'Sistema de consejos y recomendaciones para usuarios'
      },
      {
        name: 'Progress Tracking',
        description: 'Seguimiento del progreso de aprendizaje de usuarios'
      },
      {
        name: 'Analytics',
        description: 'Analíticas de engagement, abandono y efectividad'
      }
    ]
  },
  apis: [
    './src/infrastructure/web/content/routes/*.ts',
    './src/infrastructure/web/content/dto/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { specs };