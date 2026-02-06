import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { z } from "zod";
import { requireRole } from "../../middlewares/requireRole.js";
import { audit } from "../../services/audit.js";

// --- Schemas Locais ---
const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.string()).default([])
});

const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  items: z.array(z.string()).optional()
});

const CreateChecklistSchema = z.object({
  taskId: z.string().min(10),
  title: z.string().default("Checklist"),
  templateId: z.string().optional()
});

const CreateItemSchema = z.object({
  content: z.string().min(1),
  position: z.number().optional()
});

const UpdateItemSchema = z.object({
  content: z.string().optional(),
  done: z.boolean().optional(),
  position: z.number().optional()
});

export async function checklistRoutes(app) {
  
  // =================================================================
  // TEMPLATES (Model: ChecklistTemplate)
  // =================================================================

  // GET /checklist-templates
  app.get("/checklist-templates", async (request, reply) => {
    const templates = await app.prisma.checklistTemplate.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: "desc" }
    });
    return ok(reply, { templates });
  });

  // POST /checklist-templates
  app.post("/checklist-templates", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateTemplateSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const tpl = await app.prisma.checklistTemplate.create({
      data: {
        workspaceId: request.workspaceId,
        name: parsed.data.name,
        description: parsed.data.description,
        items: parsed.data.items, 
        createdById: request.user.sub
      }
    });

    return ok(reply, { template: tpl }, 201);
  });

  // DELETE /checklist-templates/:id
  app.delete("/checklist-templates/:id", { preHandler: requireRole("admin") }, async (request, reply) => {
    await app.prisma.checklistTemplate.deleteMany({
      where: { id: request.params.id, workspaceId: request.workspaceId }
    });
    return ok(reply, { message: "Template removido" });
  });


  // =================================================================
  // CHECKLISTS NA TAREFA (Model: Checklist)
  // =================================================================

  // POST /checklists (Cria uma lista dentro da tarefa)
  app.post("/checklists", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateChecklistSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    // 1. Verifica se a tarefa existe no workspace
    const task = await app.prisma.task.findFirst({
      where: { id: parsed.data.taskId, workspaceId: request.workspaceId }
    });
    if (!task) return fail(reply, 404, { message: "Tarefa não encontrada" });

    // 2. Cria a checklist (Usando o model Checklist correto)
    const checklist = await app.prisma.checklist.create({
      data: {
        workspaceId: request.workspaceId,
        taskId: task.id,
        title: parsed.data.title,
        // Se seu schema usa 'position', mantenha. Se não, remova esta linha.
        // position: 0 
      }
    });

    // 3. Se tiver template, popula os itens
    if (parsed.data.templateId) {
      const tpl = await app.prisma.checklistTemplate.findFirst({
        where: { id: parsed.data.templateId, workspaceId: request.workspaceId }
      });

      if (tpl && tpl.items?.length > 0) {
        await app.prisma.checklistItem.createMany({
          data: tpl.items.map((text, i) => ({
            workspaceId: request.workspaceId,
            checklistId: checklist.id,
            content: text,
            position: i,
            done: false
          }))
        });
      }
    }

    // Retorna completa
    const full = await app.prisma.checklist.findUnique({
      where: { id: checklist.id },
      include: { items: { orderBy: { position: "asc" } } }
    });

    return ok(reply, { checklist: full }, 201);
  });

  // DELETE /checklists/:id
  app.delete("/checklists/:id", { preHandler: requireRole("member") }, async (request, reply) => {
    await app.prisma.checklist.deleteMany({
      where: { id: request.params.id, workspaceId: request.workspaceId }
    });
    return ok(reply, { message: "Checklist removida" });
  });


  // =================================================================
  // ITENS (Model: ChecklistItem)
  // =================================================================

  // POST /checklists/:id/items
  app.post("/checklists/:id/items", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateItemSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const checklist = await app.prisma.checklist.findFirst({
      where: { id: request.params.id, workspaceId: request.workspaceId }
    });
    if (!checklist) return fail(reply, 404, { message: "Checklist não encontrada" });

    const item = await app.prisma.checklistItem.create({
      data: {
        workspaceId: request.workspaceId,
        checklistId: checklist.id,
        content: parsed.data.content,
        position: parsed.data.position || 65000,
        done: false
      }
    });

    return ok(reply, { item }, 201);
  });

  // PATCH /checklist-items/:itemId
  app.patch("/checklist-items/:itemId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateItemSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.checklistItem.findFirst({
      where: { id: request.params.itemId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { message: "Item não encontrado" });

    const updated = await app.prisma.checklistItem.update({
      where: { id: before.id },
      data: {
        content: parsed.data.content,
        done: parsed.data.done,
        position: parsed.data.position
      }
    });

    return ok(reply, { item: updated });
  });

  // DELETE /checklist-items/:itemId
  app.delete("/checklist-items/:itemId", { preHandler: requireRole("member") }, async (request, reply) => {
    await app.prisma.checklistItem.deleteMany({
      where: { id: request.params.itemId, workspaceId: request.workspaceId }
    });
    return ok(reply, { message: "Item removido" });
  });
}