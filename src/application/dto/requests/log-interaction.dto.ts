import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { InteractionAction, DeviceType, PlatformType } from '@domain/enums/content.enum';

export class LogInteractionDto {
  @IsString()
  userid: string;

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
}
