# Content Service

Microservicio de gestión de contenido para la plataforma educativa.

## Características

- Gestión de contenido educativo (artículos, videos, cuestionarios)
- Seguimiento del progreso de los usuarios
- Sistema de recomendaciones de contenido
- Análisis de interacción de los usuarios
- Documentación de la API con Swagger
- Autenticación y autorización
- Base de datos PostgreSQL con Prisma ORM
- Arquitectura hexagonal (ports & adapters)

## Requisitos Previos

- Node.js 16+ y npm 8+
- PostgreSQL 13+
- Git

## Configuración del Entorno

1. Clona el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd content-service
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones.

4. Configura la base de datos:
   ```bash
   # Ejecuta migraciones
   npx prisma migrate dev --name init
   
   # Genera el cliente de Prisma
   npx prisma generate
   
   # Opcional: carga datos iniciales
   npm run db:seed
   ```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
# Construye la aplicación
npm run build

# Inicia el servidor
npm run start:prod
```

## Estructura del Proyecto

```
src/
├── domain/              # Lógica de dominio
│   ├── entities/        # Entidades del dominio
│   ├── repositories/    # Interfaces de repositorios
│   └── services/        # Servicios de dominio
├── infrastructure/      # Implementaciones concretas
│   ├── config/          # Configuraciones
│   ├── database/        # Configuración de la base de datos
│   └── web/             # Controladores y rutas
└── shared/              # Código compartido
    ├── constants/       # Constantes
    ├── middlewares/     # Middlewares de Express
    └── utils/           # Utilidades
```

## API Endpoints

La documentación de la API está disponible en:
- Swagger UI: `http://localhost:3000/api-docs`
- Esquema OpenAPI: `http://localhost:3000/api-docs.json`

## Pruebas

```bash
# Ejecutar pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar cobertura de código
npm run test:coverage
```

## Despliegue

El servicio puede ser desplegado en cualquier plataforma que soporte Node.js. Se recomienda usar Docker para entornos de producción.

### Docker

```bash
# Construir la imagen
ocker build -t content-service .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env content-service
```

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor | 3000 |
| NODE_ENV | Entorno de ejecución | development |
| DATABASE_URL | URL de conexión a PostgreSQL | - |
| JWT_SECRET | Secreto para firmar tokens JWT | - |
| LOG_LEVEL | Nivel de logs | info |
| CORS_ORIGIN | Orígenes permitidos para CORS | * |
| RATE_LIMIT_WINDOW_MS | Ventana de tiempo para límite de tasa | 900000 (15 min) |
| RATE_LIMIT_MAX | Máximo de peticiones por ventana | 100 |

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Contribución

Las contribuciones son bienvenidas. Por favor, lee las [guías de contribución](CONTRIBUTING.md) para más detalles.

## Contacto

Para consultas o soporte, contacta al equipo de desarrollo.
