import { z } from "zod";

export const CreateChecklistTemplateSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
  // O backend espera array de strings
  items: z.array(z.string().min(1)).min(1, "Adicione pelo menos um item")
});

export const UpdateChecklistTemplateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  items: z.array(z.string().min(1)).min(1).optional()
});

export const CreateChecklistOnTaskSchema = z.object({
  taskId: z.string().min(10),
  title: z.string().min(1, "Título é obrigatório"),
  templateId: z.string().optional()
});

export const AddChecklistItemSchema = z.object({
  content: z.string().min(1),
  position: z.number().optional()
});

export const UpdateChecklistItemSchema = z.object({
  content: z.string().min(1).optional(),
  done: z.boolean().optional(),
  position: z.number().optional()
});