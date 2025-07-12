import { PrismaClient } from '@prisma/client';

// Re-export enums for consistency
export type ContentType = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'INTERACTIVE' | 'OTHER';
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Base interfaces
export interface Topic {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon_url: string | null;
  color_hex: string | null;
  category: string | null;
  difficulty_level: DifficultyLevel;
  target_age_min: number;
  target_age_max: number;
  prerequisites: string[];
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  main_media_id: string | null;
  thumbnail_media_id: string | null;
  difficulty_level: DifficultyLevel;
  target_age_min: number;
  target_age_max: number;
  reading_time_minutes: number | null;
  duration_minutes: number | null;
  is_downloadable: boolean;
  is_featured: boolean;
  view_count: number;
  completion_count: number;
  rating_average: number | null;
  rating_count: number;
  metadata: Record<string, any> | null;
  is_published: boolean;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
}

// Interaction types
export type InteractionAction = 'start' | 'pause' | 'resume' | 'complete' | 'abandon';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type PlatformType = 'ios' | 'android' | 'web';
export type AbandonmentReason = 'difficulty' | 'boring' | 'error' | 'other';
export type CameFromType = 'home' | 'search' | 'recommendation' | 'topic';

export interface ContentInteractionLog {
  id: string;
  userId: string;
  contentId: string;
  sessionId: string;
  action: InteractionAction;
  actionTimestamp: Date;
  progressAtAction: number | null;
  timeSpentSeconds: number | null;
  deviceType: DeviceType | null;
  platform: PlatformType | null;
  abandonmentReason: AbandonmentReason | null;
  cameFrom: CameFromType | null;
  metadata: Record<string, any> | null;
}

export interface ContentTopic {
  id: string;
  content_id: string;
  topic_id: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  topic?: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
    color_hex: string | null;
    difficulty_level: DifficultyLevel;
    target_age_min: number;
    target_age_max: number;
    prerequisites: string[];
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  };
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  tip_type: string;
  category: string | null;
  target_age_min: number;
  target_age_max: number;
  difficulty_level: string;
  action_required: boolean;
  action_instructions: string | null;
  estimated_time_minutes: number | null;
  impact_level: string;
  source_url: string | null;
  image_url: string | null;
  is_active: boolean;
  valid_from: Date | null;
  valid_until: Date | null;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  content_id: string | null;
}

export interface UserTipsHistory {
  id: string;
  user_id: string;
  tip_id: string;
  shown_at: Date;
  was_read: boolean;
  was_acted_upon: boolean;
  user_rating: number | null;
  user_feedback: string | null;
  created_at: Date;
}

export interface ContentProgress {
  id: string;
  user_id: string;
  content_id: string;
  status: string;
  progress_percentage: number;
  time_spent_seconds: number;
  last_position_seconds: number;
  completion_rating: number | null;
  completion_feedback: string | null;
  first_accessed_at: Date | null;
  last_accessed_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Extended interfaces
export interface ContentWithTopics {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  main_media_id: string | null;
  thumbnail_media_id: string | null;
  difficulty_level: DifficultyLevel;
  target_age_min: number;
  target_age_max: number;
  reading_time_minutes: number | null;
  duration_minutes: number | null;
  is_downloadable: boolean;
  is_featured: boolean;
  view_count: number;
  completion_count: number;
  rating_average: number | null;
  rating_count: number;
  metadata: Record<string, any> | null;
  is_published: boolean;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  contentTopics: ContentTopic[];
}

export interface ContentWithRelations extends Content {
  contentTopics?: ContentTopic[];
  tips?: Tip[];
  contentProgress?: ContentProgress[];
}


export interface TipWithHistory extends Tip {
  userTipsHistory?: UserTipsHistory[];
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export interface ContentProgressExtended extends Omit<ContentProgress, 'status'> {
  status: ProgressStatus;
  content?: Content;
}

// Filter and analytics interfaces
export interface ContentFilters {
  topicId?: string;
  age?: number;
  difficultyLevel?: DifficultyLevel;
  contentType?: ContentType;
  isPublished?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
  includeTopics?: boolean;
  includeProgress?: boolean;
  userId?: string;
  status?: ContentStatus;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'view_count' | 'rating_average';
  sortOrder?: 'asc' | 'desc';
}

export interface ContentAnalytics {
  content_id: string;
  title: string;
  total_views: number;
  total_completions: number;
  completion_rate: number;
  average_time_spent: number;
  average_rating: number;
  last_updated: Date;
  engagement_score: number;
  abandonment_rate: number;
  popular_topics: Array<{
    topic_id: string;
    name: string;
    view_count: number;
    completion_rate: number;
  }>;
}

export interface UserProgress {
  contentId: string;
  title: string;
  status: ProgressStatus;
  progressPercentage: number;
  timeSpentSeconds: number;
  lastPositionSeconds: number;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
}

export interface AbandonmentAnalytics {
  contentId: string;
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  avgAbandonmentPoint: number;
  abandonmentByDevice: Record<string, number>;
}

export interface EffectivenessAnalytics {
  topicId: string;
  topicName: string;
  totalContent: number;
  totalViews: number;
  totalCompletions: number;
  averageCompletionRate: number;
  averageTimeSpent: number;
  averageRating: number;
  mostEngagedContent: Array<{
    id: string;
    title: string;
    completionRate: number;
    averageRating: number;
  }>;
  leastEngagedContent: Array<{
    id: string;
    title: string;
    completionRate: number;
    averageRating: number;
  }>;
}

export interface ProblematicContent {
  contentId: string;
  title: string;
  completionRate: number;
  avgAbandonmentPoint: number;
  priority: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO';
  recommendation: string;
}

// Interaction types
export enum InteractionAction {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  COMPLETE = 'complete',
  ABANDON = 'abandon',
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

export enum PlatformType {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
}

export enum AbandonmentReason {
  TECHNICAL_ISSUES = 'technical_issues',
  CONTENT_DIFFICULTY = 'content_difficulty',
  LOST_INTEREST = 'lost_interest',
  OTHER = 'other',
}

export enum CameFromType {
  SEARCH = 'search',
  RECOMMENDATION = 'recommendation',
  BOOKMARK = 'bookmark',
  OTHER = 'other',
}

export interface ContentInteractionLog {
  id: string;
  userId: string;
  contentId: string;
  sessionId: string;
  action: InteractionAction;
  actionTimestamp: Date;
  progressAtAction: number | null;
  timeSpentSeconds: number | null;
  deviceType: DeviceType | null;
  platform: PlatformType | null;
  abandonmentReason: AbandonmentReason | null;
  cameFrom: CameFromType | null;
  metadata: Record<string, any> | null;
}

// Prisma client type
export type PrismaClientType = PrismaClient;
