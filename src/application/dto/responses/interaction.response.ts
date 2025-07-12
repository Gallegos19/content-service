import { Expose, Type } from 'class-transformer';
import { InteractionLog } from '@domain/entities/content.entity';

export class InteractionLogResponse {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  contentId: string;

  @Expose()
  action: string;

  @Expose()
  @Type(() => Date)
  timestamp: Date;

  @Expose()
  deviceType: string | null;

  @Expose()
  platformType: string | null;

  @Expose()
  metadata: Record<string, any> | null;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  static fromEntity(interaction: InteractionLog): InteractionLogResponse {
    const response = new InteractionLogResponse();
    Object.assign(response, interaction);
    return response;
  }

  static fromEntities(interactions: InteractionLog[]): InteractionLogResponse[] {
    return interactions.map(interaction => this.fromEntity(interaction));
  }
}
