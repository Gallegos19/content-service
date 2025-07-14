import { Topic } from "@prisma/client";

export interface Module {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  topics: Topic[];
}
