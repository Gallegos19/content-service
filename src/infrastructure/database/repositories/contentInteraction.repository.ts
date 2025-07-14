import { inject, injectable } from 'inversify';
import { PrismaClient, Prisma } from '@prisma/client';
import { IContentInteractionRepository } from '@domain/repositories/contentInteraction.repository';
import { ContentInteractionLog } from '@domain/entities/content.entity';
import { InteractionAction, DeviceType, PlatformType, AbandonmentReason } from '@domain/enums';
import { CameFromType } from '@domain/entities/content.entity';
import { TYPES } from '@shared/constants/types';
import { logger } from '@shared/utils/logger';

@injectable()
export class ContentInteractionRepository implements IContentInteractionRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async create(data: Omit<ContentInteractionLog, 'id' | 'actionTimestamp'>): Promise<ContentInteractionLog> {
    try {
      const created = await this.prisma.contentInteractionLog.create({
        data: {
          user_id: data.userId,
          content_id: data.contentId,
          session_id: data.sessionId,
          action: data.action,
          action_timestamp: new Date(),
          progress_at_action: data.progressAtAction ? new Prisma.Decimal(data.progressAtAction) : null,
          time_spent_seconds: data.timeSpentSeconds || 0,
          device_type: data.deviceType,
          platform: data.platform,
          abandonment_reason: data.abandonmentReason,
          came_from: data.cameFrom,
          metadata: data.metadata ? JSON.stringify(data.metadata) : Prisma.JsonNull,
        }
      });

      return {
        id: created.id,
        userId: created.user_id,
        contentId: created.content_id,
        sessionId: created.session_id,
        action: created.action as InteractionAction,
        actionTimestamp: created.action_timestamp,
        progressAtAction: created.progress_at_action ? Number(created.progress_at_action) : null,
        timeSpentSeconds: Number(created.time_spent_seconds),
        deviceType: created.device_type as DeviceType | null,
        platform: created.platform as PlatformType | null,
        abandonmentReason: created.abandonment_reason as AbandonmentReason | null,
        cameFrom: created.came_from as CameFromType | null,
        metadata: created.metadata ? JSON.parse(created.metadata as string) : null,
      };
    } catch (error) {
      logger.error('Error creating interaction log:', error);
      throw error;
    }
  }

  async findByContentId(contentId: string): Promise<ContentInteractionLog[]> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        where: { content_id: contentId },
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      }));
    } catch (error) {
      logger.error(`Error finding interactions by content ID ${contentId}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<ContentInteractionLog[]> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        where: { user_id: userId },
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      }));
    } catch (error) {
      logger.error(`Error finding interactions by user ID ${userId}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<ContentInteractionLog | null> {
    try {
      const interaction = await this.prisma.contentInteractionLog.findUnique({
        where: { id }
      });

      if (!interaction) return null;

      return {
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      };
    } catch (error) {
      logger.error(`Error finding interaction by ID ${id}:`, error);
      throw error;
    }
  }

  async findAll(): Promise<ContentInteractionLog[]> {
    try {
      const interactions = await this.prisma.contentInteractionLog.findMany({
        orderBy: { action_timestamp: 'desc' }
      });

      return interactions.map(interaction => ({
        id: interaction.id,
        userId: interaction.user_id,
        contentId: interaction.content_id,
        sessionId: interaction.session_id,
        action: interaction.action as InteractionAction,
        actionTimestamp: interaction.action_timestamp,
        progressAtAction: interaction.progress_at_action ? Number(interaction.progress_at_action) : null,
        timeSpentSeconds: interaction.time_spent_seconds,
        deviceType: interaction.device_type as DeviceType | null,
        platform: interaction.platform as PlatformType | null,
        abandonmentReason: interaction.abandonment_reason as AbandonmentReason | null,
        cameFrom: interaction.came_from as CameFromType | null,
        metadata: interaction.metadata ? JSON.parse(interaction.metadata as string) : null,
      }));
    } catch (error) {
      logger.error('Error finding all interactions:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<ContentInteractionLog>): Promise<ContentInteractionLog> {
    try {
      const updated = await this.prisma.contentInteractionLog.update({
        where: { id },
        data: {
          user_id: data.userId,
          content_id: data.contentId,
          session_id: data.sessionId,
          action: data.action,
          progress_at_action: data.progressAtAction ? new Prisma.Decimal(data.progressAtAction) : undefined,
          time_spent_seconds: data.timeSpentSeconds,
          device_type: data.deviceType,
          platform: data.platform,
          abandonment_reason: data.abandonmentReason,
          came_from: data.cameFrom,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        }
      });

      return {
        id: updated.id,
        userId: updated.user_id,
        contentId: updated.content_id,
        sessionId: updated.session_id,
        action: updated.action as InteractionAction,
        actionTimestamp: updated.action_timestamp,
        progressAtAction: updated.progress_at_action ? Number(updated.progress_at_action) : null,
        timeSpentSeconds: updated.time_spent_seconds,
        deviceType: updated.device_type as DeviceType | null,
        platform: updated.platform as PlatformType | null,
        abandonmentReason: updated.abandonment_reason as AbandonmentReason | null,
        cameFrom: updated.came_from as CameFromType | null,
        metadata: updated.metadata ? JSON.parse(updated.metadata as string) : null,
      };
    } catch (error) {
      logger.error(`Error updating interaction ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.contentInteractionLog.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting interaction ${id}:`, error);
      throw error;
    }
  }
}