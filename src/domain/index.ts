// Export all domain services
export * from './services';

// Export all domain entities (except AbandonmentReason to avoid conflict)
export {
  AbandonmentReason,
  type Content,
  type ContentTopic,
  type Tip,
  type UserTipsHistory,
  type ContentProgress,
  type ContentWithRelations,
  type ContentWithTopics,
  type TipWithHistory,
  type ContentProgressExtended,
  type ContentFilters,
  type ContentAnalytics,
  type UserProgress,
  type AbandonmentAnalytics,
  type EffectivenessAnalytics,
  type ProblematicContent,
  type InteractionLog,
  type PrismaClientType
} from './entities/content.entity';

// Export all domain repositories
export * from './repositories';

// Export all domain enums
export * from './enums';

// Export AbandonmentReason with a type alias
export type { AbandonmentReason as AbandonmentReasonType } from './entities/content.entity';
