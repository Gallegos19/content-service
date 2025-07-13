import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Content Service API',
      version,
      description: 'API para la gestión de contenido educativo',
      contact: {
        name: 'Soporte Técnico',
        email: 'soporte@educaplus.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3004',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Mensaje de error descriptivo' },
          },
        },
        Content: {
          type: 'object',
          required: ['title', 'content_type', 'main_media_id', 'thumbnail_media_id'],
          properties: {
            title: { 
              type: 'string', 
              example: 'Introducción a las Matemáticas',
              description: 'Título del contenido educativo'
            },
            description: { 
              type: 'string', 
              example: 'Conceptos básicos de aritmética',
              nullable: true,
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
              example: '550e8400-e29b-41d4-a716-446655440000',
              description: 'ID del recurso multimedia principal'
            },
            thumbnail_media_id: { 
              type: 'string', 
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440001',
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
              example: 8,
              default: 8,
              description: 'Edad mínima recomendada'
            },
            target_age_max: {
              type: 'integer',
              minimum: 1,
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
              description: 'Duración en minutos (solo para videos)'
            },
            is_downloadable: {
              type: 'boolean',
              example: false,
              default: false,
              description: 'Indica si el contenido puede descargarse'
            },
            is_featured: {
              type: 'boolean',
              example: false,
              default: false,
              description: 'Indica si el contenido es destacado'
            },
            is_published: {
              type: 'boolean',
              example: false,
              default: false,
              description: 'Indica si el contenido está publicado'
            },
            published_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00Z',
              nullable: true,
              description: 'Fecha de publicación'
            },
            topic_ids: {
              type: 'array',
              items: { 
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440002'
              },
              default: [],
              description: 'IDs de los temas relacionados'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              default: {},
              description: 'Metadatos adicionales del contenido'
            }
          }
        },
        Tip: {
          type: 'object',
          required: ['content_id', 'text'],
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'ID único del tip'
            },
            content_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del contenido relacionado'
            },
            text: {
              type: 'string',
              description: 'Texto del consejo o tip'
            },
            is_featured: {
              type: 'boolean',
              default: false,
              description: 'Indica si el tip es destacado'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        Analytics: {
          type: 'object',
          required: ['content_id', 'event_type'],
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'ID único del registro analítico'
            },
            content_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del contenido relacionado'
            },
            event_type: {
              type: 'string',
              enum: ['VIEW', 'COMPLETE', 'SHARE', 'LIKE', 'SAVE'],
              description: 'Tipo de evento registrado'
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
              description: 'Datos adicionales del evento'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha del evento'
            }
          }
        },
        Module: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              format: 'uuid',
              description: 'ID del módulo'
            },
            name: {
              type: 'string',
              description: 'Nombre del módulo'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descripción del módulo'
            },
            order: {
              type: 'integer',
              description: 'Orden de visualización'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso no proporcionado o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación de datos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              examples: {
                validationError: {
                  value: {
                    status: 'error',
                    message: 'Error de validación',
                    errors: [
                      { field: 'title', message: 'Required' },
                      { field: 'content_type', message: 'Required' }
                    ]
                  }
                }
              }
            }
          }
        },
        BadRequestError: {
          description: 'Solicitud inválida',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/api/content': {
        post: {
          summary: 'Crear nuevo contenido educativo',
          tags: ['Content'],
          security: [
            { bearerAuth: [] }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Content'
                },
                example: {
                  title: 'Introducción a las Matemáticas',
                  description: 'Conceptos básicos de aritmética',
                  content_type: 'VIDEO',
                  main_media_id: '550e8400-e29b-41d4-a716-446655440000',
                  thumbnail_media_id: '550e8400-e29b-41d4-a716-446655440001',
                  difficulty_level: 'BEGINNER',
                  target_age_min: 8,
                  target_age_max: 12,
                  duration_minutes: 30,
                  topic_ids: ['550e8400-e29b-41d4-a716-446655440002']
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Contenido creado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Content'
                  }
                }
              }
            },
            400: {
              $ref: '#/components/responses/ValidationError'
            },
            401: {
              $ref: '#/components/responses/UnauthorizedError'
            }
          }
        }
      },
      '/api/content/tips': {
        post: {
          summary: 'Crear un nuevo tip/consejo',
          tags: ['Content'],
          security: [
            { bearerAuth: [] }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Tip'
                },
                example: {
                  content_id: '550e8400-e29b-41d4-a716-446655440000',
                  text: 'Revisa los ejemplos antes de resolver los ejercicios',
                  is_featured: true
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Tip creado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Tip'
                  }
                }
              }
            },
            400: {
              $ref: '#/components/responses/BadRequestError'
            }
          }
        }
      },
      '/api/content/analytics': {
        post: {
          summary: 'Registrar evento analítico',
          tags: ['Analytics'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Analytics'
                },
                example: {
                  content_id: '550e8400-e29b-41d4-a716-446655440000',
                  event_type: 'VIEW',
                  metadata: {
                    device: 'mobile',
                    time_spent: 120
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Evento registrado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Analytics'
                  }
                }
              }
            },
            400: {
              $ref: '#/components/responses/BadRequestError'
            }
          }
        }
      },
    }
  },
  apis: [
    './src/infrastructure/web/content/routes/*.ts',
    './src/infrastructure/web/content/dto/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { specs };
