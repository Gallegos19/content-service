import { Topic } from './content.entity';

export interface ContentTopic {
  id: string;
  contentId: string;
  topicId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  topic: Topic;
}
