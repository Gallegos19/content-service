import { ContentType } from '@prisma/client';

export interface UpdateContentDto {
  title?: string;
  description?: string;
  contentType?: ContentType;
  mainMediaId?: string;
  thumbnailMediaId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
