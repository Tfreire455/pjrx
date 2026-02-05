import { z } from "zod";

export const CreateMilestoneSchema = z.object({
  projectId: z.string().min(10),
  name: z.string().min(2),
  description: z.string().max(5000).optional(),
  dueAt: z.string().datetime().optional()
});

export const UpdateMilestoneSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(5000).optional(),
  dueAt: z.string().datetime().optional(),
  status: z.enum(["open", "completed", "archived"]).optional()
});
