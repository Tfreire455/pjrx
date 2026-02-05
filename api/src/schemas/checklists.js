import { z } from "zod";

export const CreateChecklistTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(5000).optional(),
  items: z.array(z.string().min(1)).min(1)
});

export const CreateChecklistOnTaskSchema = z.object({
  taskId: z.string().min(10),
  title: z.string().min(2),
  templateId: z.string().min(10).optional()
});

export const AddChecklistItemSchema = z.object({
  content: z.string().min(1),
  position: z.number().int().min(0).optional()
});

export const UpdateChecklistItemSchema = z.object({
  content: z.string().min(1).optional(),
  done: z.boolean().optional(),
  position: z.number().int().min(0).optional()
});
