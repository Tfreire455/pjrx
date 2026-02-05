import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateTaskSchema, UpdateTaskSchema, CreateSubtaskSchema, UpdateSubtaskSchema, CreateDependencySchema } from "../../schemas/tasks.js";
import { audit } from "../../services/audit.js";
import { requireRole } from "../../middlewares/requireRole.js";

export async function taskRoutes(app) {
  // GET /tasks?projectId=...
  app.get("/tasks", async (request, reply) => {
    const projectId = request.query?.projectId;
    if (!projectId) return fail(reply, 400, { code: "MISSING_PROJECT", message: "Envie projectId na query." });

    const tasks = await app.prisma.task.findMany({
      where: { workspaceId: request.workspaceId, projectId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        subtasks: { orderBy: { position: "asc" } },
        checklists: { include: { items: { orderBy: { position: "asc" } } } }
      }
    });

    return ok(reply, { tasks });
  });

  // GET /tasks/:taskId
  app.get("/tasks/:taskId", async (request, reply) => {
    const task = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId },
      include: {
        subtasks: { orderBy: { position: "asc" } },
        dependenciesFrom: true,
        dependenciesTo: true,
        checklists: { include: { items: { orderBy: { position: "asc" } } } },
        comments: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!task) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });
    return ok(reply, { task });
  });

  // POST /tasks (member+)
  app.post("/tasks", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateTaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    // garantir project no workspace
    const project = await app.prisma.project.findFirst({
      where: { id: parsed.data.projectId, workspaceId: request.workspaceId }
    });
    if (!project) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });

    const task = await app.prisma.task.create({
      data: {
        workspaceId: request.workspaceId,
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status || "todo",
        priority: parsed.data.priority || "medium",
        assigneeId: parsed.data.assigneeId || null,
        reporterId: request.user.sub,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        position: parsed.data.position ?? 0
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.create",
      entityType: "Task",
      entityId: task.id,
      before: null,
      after: task,
      request
    });

    return ok(reply, { task }, 201);
  });

  // PATCH /tasks/:taskId (member+)
  app.patch("/tasks/:taskId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateTaskSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });

    const updated = await app.prisma.task.update({
      where: { id: before.id },
      data: {
        title: parsed.data.title ?? undefined,
        description: parsed.data.description === undefined ? undefined : (parsed.data.description || null),
        status: parsed.data.status ?? undefined,
        priority: parsed.data.priority ?? undefined,
        assigneeId: parsed.data.assigneeId === undefined ? undefined : (parsed.data.assigneeId || null),
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        position: parsed.data.position ?? undefined,
        blocked: parsed.data.status === "blocked" ? true : undefined,
        completedAt: parsed.data.status === "done" ? new Date() : undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.update",
      entityType: "Task",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { task: updated });
  });

  // DELETE /tasks/:taskId (admin+)
  app.delete("/tasks/:taskId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });

    await app.prisma.task.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.delete",
      entityType: "Task",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Tarefa removida." });
  });

  // ===== Subtasks =====

  // POST /tasks/:taskId/subtasks
  app.post("/tasks/:taskId/subtasks", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateSubtaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const task = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId }
    });
    if (!task) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });

    const subtask = await app.prisma.subtask.create({
      data: {
        workspaceId: request.workspaceId,
        taskId: task.id,
        title: parsed.data.title,
        position: parsed.data.position ?? 0
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "subtask.create",
      entityType: "Subtask",
      entityId: subtask.id,
      before: null,
      after: subtask,
      request
    });

    return ok(reply, { subtask }, 201);
  });

  // PATCH /subtasks/:subtaskId
  app.patch("/subtasks/:subtaskId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateSubtaskSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.subtask.findFirst({
      where: { id: request.params.subtaskId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Subtask não encontrada." });

    const updated = await app.prisma.subtask.update({
      where: { id: before.id },
      data: {
        title: parsed.data.title ?? undefined,
        done: parsed.data.done ?? undefined,
        position: parsed.data.position ?? undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "subtask.update",
      entityType: "Subtask",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { subtask: updated });
  });

  // DELETE /subtasks/:subtaskId
  app.delete("/subtasks/:subtaskId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.subtask.findFirst({
      where: { id: request.params.subtaskId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Subtask não encontrada." });

    await app.prisma.subtask.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "subtask.delete",
      entityType: "Subtask",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Subtask removida." });
  });

  // ===== Dependencies =====

  // POST /tasks/:taskId/dependencies
  app.post("/tasks/:taskId/dependencies", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateDependencySchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const taskId = request.params.taskId;

    const [task, dep] = await Promise.all([
      app.prisma.task.findFirst({ where: { id: taskId, workspaceId: request.workspaceId } }),
      app.prisma.task.findFirst({ where: { id: parsed.data.dependsOnTaskId, workspaceId: request.workspaceId } })
    ]);

    if (!task || !dep) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa/Dependência não encontrada." });
    if (task.id === dep.id) return fail(reply, 400, { code: "INVALID_DEP", message: "Dependência inválida." });

    const created = await app.prisma.taskDependency.create({
      data: {
        workspaceId: request.workspaceId,
        taskId: task.id,
        dependsOnTaskId: dep.id,
        type: parsed.data.type
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.dependency.create",
      entityType: "TaskDependency",
      entityId: created.id,
      before: null,
      after: created,
      request
    });

    return ok(reply, { dependency: created }, 201);
  });

  // DELETE /dependencies/:dependencyId
  app.delete("/dependencies/:dependencyId", { preHandler: requireRole("member") }, async (request, reply) => {
    const before = await app.prisma.taskDependency.findFirst({
      where: { id: request.params.dependencyId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Dependência não encontrada." });

    await app.prisma.taskDependency.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.dependency.delete",
      entityType: "TaskDependency",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Dependência removida." });
  });
}
