import { z } from "zod";

export const CreateTaskSchema = z.object({
  projectId: z.string().min(10),
  title: z.string().min(2),
  description: z.string().max(10000).optional(),
  status: z.enum(["todo", "doing", "blocked", "done", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().min(10).optional(),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional(),
  position: z.number().int().min(0).optional()
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateSubtaskSchema = z.object({
  title: z.string().min(2),
  position: z.number().int().min(0).optional()
});

export const UpdateSubtaskSchema = z.object({
  title: z.string().min(2).optional(),
  done: z.boolean().optional(),
  position: z.number().int().min(0).optional()
});

export const CreateDependencySchema = z.object({
  dependsOnTaskId: z.string().min(10),
  type: z.enum(["blocks", "relates"]).default("blocks")
});
