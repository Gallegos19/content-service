import { IsString, IsOptional, IsEnum, IsObject, IsDateString, IsNumber } from 'class-validator';

// Define enums locally for validation
export enum InteractionAction {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  COMPLETE = 'complete',
  ABANDON = 'abandon'
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

export enum PlatformType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web'
}

export class LogInteractionDto {
  @IsString()
  userId: string;

  @IsString()
  contentId: string;

  @IsEnum(InteractionAction)
  action: InteractionAction;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @IsOptional()
  @IsEnum(PlatformType)
  platformType?: PlatformType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  cameFrom?: 'home' | 'search' | 'recommendation' | 'topic';

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  recommendationSource?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsNumber()
  progressAtAction?: number;

  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}