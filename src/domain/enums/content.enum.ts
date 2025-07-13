export enum ContentType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
  INTERACTIVE = 'INTERACTIVE',
  OTHER = 'OTHER',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum InteractionAction {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  COMPLETE = 'complete',
  ABANDON = 'abandon',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export enum PlatformType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum AbandonmentReason {
  DIFFICULTY = 'difficulty',
  BORING = 'boring',
  ERROR = 'error',
  OTHER = 'other',
}

export enum InteractionSource {
  HOME = 'home',
  SEARCH = 'search',
  RECOMMENDATION = 'recommendation',
  TOPIC = 'topic',
}

export enum AnalyticsPriority {
  LOW = 'BAJO',
  MEDIUM = 'MEDIO',
  HIGH = 'ALTO',
  CRITICAL = 'CRÍTICO',
}
