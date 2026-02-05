import { z } from "zod";

export const CreateCommentSchema = z.object({
  projectId: z.string().min(10).optional(),
  taskId: z.string().min(10).optional(),
  body: z.string().min(1).max(20000)
}).refine((v) => v.projectId || v.taskId, {
  message: "Envie projectId ou taskId.",
  path: ["projectId"]
});
