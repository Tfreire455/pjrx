import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional()
});

export const UpdateProjectSchema = CreateProjectSchema.partial();
