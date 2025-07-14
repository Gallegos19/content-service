import { ContentAnalytics, AbandonmentAnalytics, EffectivenessAnalytics, ProblematicContent } from '../entities/content.entity';

export interface IContentAnalyticsRepository {
  getContentAnalytics(contentId: string): Promise<ContentAnalytics>;
  getAbandonmentAnalytics(contentId: string): Promise<AbandonmentAnalytics>;
  getEffectivenessAnalytics(contentId: string): Promise<EffectivenessAnalytics>;
  findProblematicContent(threshold: number, limit: number): Promise<ProblematicContent[]>;
}
