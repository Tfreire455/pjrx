import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { CreateChecklistTemplateSchema, CreateChecklistOnTaskSchema, AddChecklistItemSchema, UpdateChecklistItemSchema } from "../../schemas/checklists.js";
import { audit } from "../../services/audit.js";

export async function checklistRoutes(app) {
  // ===== Templates =====

  // GET /checklist-templates
  app.get("/checklist-templates", async (request, reply) => {
    const templates = await app.prisma.checklistTemplate.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: "desc" }
    });
    return ok(reply, { templates });
  });

  // POST /checklist-templates (member+)
  app.post("/checklist-templates", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateChecklistTemplateSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const exists = await app.prisma.checklistTemplate.findUnique({
      where: { workspaceId_name: { workspaceId: request.workspaceId, name: parsed.data.name } }
    });
    if (exists) return fail(reply, 409, { code: "NAME_IN_USE", message: "Template com esse nome já existe." });

    const tpl = await app.prisma.checklistTemplate.create({
      data: {
        workspaceId: request.workspaceId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        items: parsed.data.items,
        createdById: request.user.sub
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.template.create",
      entityType: "ChecklistTemplate",
      entityId: tpl.id,
      before: null,
      after: tpl,
      request
    });

    return ok(reply, { template: tpl }, 201);
  });

  // DELETE /checklist-templates/:templateId (admin+)
  app.delete("/checklist-templates/:templateId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.checklistTemplate.findFirst({
      where: { id: request.params.templateId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Template não encontrado." });

    await app.prisma.checklistTemplate.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.template.delete",
      entityType: "ChecklistTemplate",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Template removido." });
  });

  // ===== Checklist em Task =====

  // POST /checklists (criar checklist numa task)
  app.post("/checklists", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateChecklistOnTaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const task = await app.prisma.task.findFirst({
      where: { id: parsed.data.taskId, workspaceId: request.workspaceId }
    });
    if (!task) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });

    const checklist = await app.prisma.checklist.create({
      data: {
        workspaceId: request.workspaceId,
        taskId: task.id,
        title: parsed.data.title,
        templateId: parsed.data.templateId || null
      }
    });

    // se veio templateId, copia items para checklistItems
    if (parsed.data.templateId) {
      const tpl = await app.prisma.checklistTemplate.findFirst({
        where: { id: parsed.data.templateId, workspaceId: request.workspaceId }
      });

      if (tpl?.items && Array.isArray(tpl.items)) {
        await app.prisma.checklistItem.createMany({
          data: tpl.items.map((content, idx) => ({
            workspaceId: request.workspaceId,
            checklistId: checklist.id,
            content: String(content),
            position: idx,
            done: false
          }))
        });
      }
    }

    const full = await app.prisma.checklist.findUnique({
      where: { id: checklist.id },
      include: { items: { orderBy: { position: "asc" } } }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.create",
      entityType: "Checklist",
      entityId: checklist.id,
      before: null,
      after: full,
      request
    });

    return ok(reply, { checklist: full }, 201);
  });

  // POST /checklists/:checklistId/items
  app.post("/checklists/:checklistId/items", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(AddChecklistItemSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const checklist = await app.prisma.checklist.findFirst({
      where: { id: request.params.checklistId, workspaceId: request.workspaceId }
    });
    if (!checklist) return fail(reply, 404, { code: "NOT_FOUND", message: "Checklist não encontrado." });

    const item = await app.prisma.checklistItem.create({
      data: {
        workspaceId: request.workspaceId,
        checklistId: checklist.id,
        content: parsed.data.content,
        position: parsed.data.position ?? 0
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.item.create",
      entityType: "ChecklistItem",
      entityId: item.id,
      before: null,
      after: item,
      request
    });

    return ok(reply, { item }, 201);
  });

  // PATCH /checklist-items/:itemId
  app.patch("/checklist-items/:itemId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateChecklistItemSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.checklistItem.findFirst({
      where: { id: request.params.itemId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Item não encontrado." });

    const updated = await app.prisma.checklistItem.update({
      where: { id: before.id },
      data: {
        content: parsed.data.content ?? undefined,
        done: parsed.data.done ?? undefined,
        position: parsed.data.position ?? undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.item.update",
      entityType: "ChecklistItem",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { item: updated });
  });

  // DELETE /checklist-items/:itemId
  app.delete("/checklist-items/:itemId", { preHandler: requireRole("member") }, async (request, reply) => {
    const before = await app.prisma.checklistItem.findFirst({
      where: { id: request.params.itemId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Item não encontrado." });

    await app.prisma.checklistItem.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "checklist.item.delete",
      entityType: "ChecklistItem",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Item removido." });
  });
}
