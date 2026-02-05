import { z } from "zod";

export const CreateSprintSchema = z.object({
  projectId: z.string().min(10),
  name: z.string().min(2),
  goal: z.string().max(5000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime()
});

export const UpdateSprintSchema = z.object({
  name: z.string().min(2).optional(),
  goal: z.string().max(5000).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.enum(["planned", "active", "completed", "archived"]).optional()
});

export const AddSprintItemSchema = z.object({
  taskId: z.string().min(10)
});
