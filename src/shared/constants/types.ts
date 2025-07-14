// Dependency injection tokens
import { Container } from 'inversify';
import { PrismaClient, Prisma } from '@prisma/client';
import { Content, Tip } from '@domain/entities/content.entity';

export const TYPES = {
  // Repositories
  ContentRepository: Symbol.for('ContentRepository'),
  AnalyticsRepository: Symbol.for('AnalyticsRepository'),
  ProgressRepository: Symbol.for('ProgressRepository'),
  InteractionRepository: Symbol.for('InteractionRepository'),
  ContentInteractionLogRepository: Symbol.for('ContentInteractionLogRepository'),
  UserTipsHistoryRepository: Symbol.for('UserTipsHistoryRepository'),
  ContentProgressRepository: Symbol.for('ContentProgressRepository'),
  TopicRepository: Symbol.for('TopicRepository'),
  TipsRepository: Symbol.for('TipsRepository'),
  ContentTopicRepository: Symbol.for('ContentTopicRepository'),
  ContentAnalyticsRepository: Symbol.for('ContentAnalyticsRepository'),
  ContentInteractionRepository: Symbol.for('ContentInteractionRepository'),
  
  // Services
  ContentService: Symbol.for('ContentService'),
  
  // Database
  PrismaClient: Symbol.for('PrismaClient'),
  
  // Use Cases
  
  // Controllers
  ContentController: Symbol.for('ContentController'),
  
  // Other dependencies
  Logger: Symbol.for('Logger')
} as const;

// Common interfaces
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error types
export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Authentication & Authorization (2000-2999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Not Found (3000-3999)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  TOPIC_NOT_FOUND = 'TOPIC_NOT_FOUND',
  
  // Conflict (4000-4999)
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Server errors (5000-5999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors (6000-6999)
  INVALID_OPERATION = 'INVALID_OPERATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Content-specific errors (7000-7999)
  CONTENT_NOT_PUBLISHED = 'CONTENT_NOT_PUBLISHED',
  CONTENT_RESTRICTED = 'CONTENT_RESTRICTED',
  INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
  
  // User progress errors (8000-8999)
  PROGRESS_ALREADY_COMPLETED = 'PROGRESS_ALREADY_COMPLETED',
  INVALID_PROGRESS_UPDATE = 'INVALID_PROGRESS_UPDATE',
  
  // Analytics errors (9000-9999)
  ANALYTICS_DATA_UNAVAILABLE = 'ANALYTICS_DATA_UNAVAILABLE'
}

// API response status codes
export enum StatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Client errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Environment variables
export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  
  // JWT (for token validation)
  JWT_SECRET: string;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  
  // API
  API_PREFIX: string;
  
  // CORS
  CORS_ORIGIN: string;
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

// Request context
export interface RequestContext {
  requestId: string;
  userId?: string;
  roles?: string[];
  ipAddress?: string;
  userAgent?: string;
  startTime?: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Sorting
export interface SortParams<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}

// Search
export interface SearchParams {
  query: string;
  fields: string[];
  isFuzzy?: boolean;
}

// File upload
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Prisma types
export type PrismaContentData = Omit<Content, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  metadata: Prisma.JsonValue | null;
};

export type PrismaTipData = Omit<Tip, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  content_id?: string;
  usage_count: number;
  valid_from?: Date;
  valid_until?: Date;
};

export type PrismaTopicData = Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  is_active: boolean;
  sort_order: number;
};

export type TipUpdateInput = Prisma.TipUpdateInput;

// Importar tipos de contenido y enums según sea necesario
// Los tipos específicos se importarán directamente en los archivos que los necesiten
// para evitar conflictos de reexportación

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export interface Topic {
  id?: string;
  title: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  target_age_min?: number;
  target_age_max?: number;
  prerequisites?: any[];
  is_active?: boolean;
  sort_order?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
  created_by?: string;
  updated_by?: string
}

export interface ContentTopic {
  id: string;
  contentId: string;
  topicId: string;
  isPrimary: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
  topic?: Topic;
  content?: Content;
}
