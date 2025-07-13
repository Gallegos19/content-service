import { z } from 'zod';

export const createTipSchema = z.object({
  title: z.string().min(1, 'El título del tip es requerido'),
  content: z.string().min(1, 'El contenido del tip es requerido'),
  target_age_min: z.number().optional(),
  target_age_max: z.number().optional(),
  estimated_time_minutes: z.number().nonnegative().optional(),
  is_featured: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateTipDto = z.infer<typeof createTipSchema>;
