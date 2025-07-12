import { IsString, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class TrackProgressDto {
  @IsString()
  userId: string;

  @IsString()
  contentId: string;

  @IsOptional()
  @IsIn(['not_started', 'in_progress', 'completed', 'paused'])
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastPositionSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  completionRating?: number;

  @IsOptional()
  @IsString()
  completionFeedback?: string;
}
