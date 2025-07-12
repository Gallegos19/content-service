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
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'error' },
                  message: { type: 'string', example: 'Error de validación' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
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
  },
  apis: [
    './src/infrastructure/web/content/routes/*.ts',
    './src/infrastructure/web/content/dto/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export { specs };
