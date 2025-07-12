import { Expose, Type } from 'class-transformer';
import { UserProgress } from '@domain/entities/content.entity';

export class UserProgressResponse {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  contentId: string;

  @Expose()
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';

  @Expose()
  progressPercentage: number;

  @Expose()
  timeSpentSeconds: number;

  @Expose()
  lastPositionSeconds: number;

  @Expose()
  @Type(() => Date)
  lastAccessedAt: Date;

  @Expose()
  @Type(() => Date)
  completedAt: Date | null;

  @Expose()
  completionRating: number | null;

  @Expose()
  completionFeedback: string | null;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  static fromEntity(progress: UserProgress): UserProgressResponse {
    const response = new UserProgressResponse();
    Object.assign(response, progress);
    return response;
  }
}
