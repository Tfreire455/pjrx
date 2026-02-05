import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { CreateSprintSchema, UpdateSprintSchema, AddSprintItemSchema } from "../../schemas/sprints.js";
import { audit } from "../../services/audit.js";

export async function sprintRoutes(app) {
  // GET /sprints?projectId=...
  app.get("/sprints", async (request, reply) => {
    const projectId = request.query?.projectId;
    if (!projectId) return fail(reply, 400, { code: "MISSING_PROJECT", message: "Envie projectId na query." });

    const sprints = await app.prisma.sprint.findMany({
      where: { workspaceId: request.workspaceId, projectId },
      orderBy: { startAt: "desc" },
      include: { items: true }
    });

    return ok(reply, { sprints });
  });

  // POST /sprints (member+)
  app.post("/sprints", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateSprintSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const project = await app.prisma.project.findFirst({
      where: { id: parsed.data.projectId, workspaceId: request.workspaceId }
    });
    if (!project) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });

    const sprint = await app.prisma.sprint.create({
      data: {
        workspaceId: request.workspaceId,
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        goal: parsed.data.goal || null,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        status: "planned"
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "sprint.create",
      entityType: "Sprint",
      entityId: sprint.id,
      before: null,
      after: sprint,
      request
    });

    return ok(reply, { sprint }, 201);
  });

  // PATCH /sprints/:sprintId
  app.patch("/sprints/:sprintId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateSprintSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.sprint.findFirst({
      where: { id: request.params.sprintId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Sprint não encontrado." });

    const updated = await app.prisma.sprint.update({
      where: { id: before.id },
      data: {
        name: parsed.data.name ?? undefined,
        goal: parsed.data.goal === undefined ? undefined : (parsed.data.goal || null),
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        status: parsed.data.status ?? undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "sprint.update",
      entityType: "Sprint",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { sprint: updated });
  });

  // DELETE /sprints/:sprintId (admin+)
  app.delete("/sprints/:sprintId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.sprint.findFirst({
      where: { id: request.params.sprintId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Sprint não encontrado." });

    await app.prisma.sprint.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "sprint.delete",
      entityType: "Sprint",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Sprint removido." });
  });

  // POST /sprints/:sprintId/items (adicionar task)
  app.post("/sprints/:sprintId/items", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(AddSprintItemSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const sprint = await app.prisma.sprint.findFirst({
      where: { id: request.params.sprintId, workspaceId: request.workspaceId }
    });
    if (!sprint) return fail(reply, 404, { code: "NOT_FOUND", message: "Sprint não encontrado." });

    const task = await app.prisma.task.findFirst({
      where: { id: parsed.data.taskId, workspaceId: request.workspaceId }
    });
    if (!task) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });

    const item = await app.prisma.sprintItem.create({
      data: {
        workspaceId: request.workspaceId,
        sprintId: sprint.id,
        taskId: task.id
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "sprint.item.add",
      entityType: "SprintItem",
      entityId: item.id,
      before: null,
      after: item,
      request
    });

    return ok(reply, { item }, 201);
  });

  // DELETE /sprint-items/:itemId
  app.delete("/sprint-items/:itemId", { preHandler: requireRole("member") }, async (request, reply) => {
    const before = await app.prisma.sprintItem.findFirst({
      where: { id: request.params.itemId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Item não encontrado." });

    await app.prisma.sprintItem.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "sprint.item.remove",
      entityType: "SprintItem",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Item removido." });
  });
}
