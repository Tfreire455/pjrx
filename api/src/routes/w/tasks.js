import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateTaskSchema, UpdateTaskSchema } from "../../schemas/tasks.js";
import { audit } from "../../services/audit.js";
import { requireRole } from "../../middlewares/requireRole.js";

export async function taskRoutes(app) {
  // 1. LISTAR (GET /tasks)
  app.get("/tasks", async (request, reply) => {
    const { projectId, atRisk } = request.query;
    
    // É obrigatório ter um contexto (Projeto ou Risco Global)
    if (!projectId && !atRisk) {
        // Se não mandar nada, retorna vazio ou erro, mas vamos ser permissivos para debug
        // return fail(reply, 400, { message: "Filtro projectId ou atRisk necessário" });
    }

    const where = { workspaceId: request.workspaceId };
    if (projectId) where.projectId = projectId;

    if (atRisk) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.status = { not: "done" };
      where.dueAt = { not: null, lte: tomorrow };
    }

    const tasks = await app.prisma.task.findMany({
      where,
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { subtasks: true, assignee: true }
    });

    return ok(reply, { tasks });
  });

  // 2. DETALHES (GET /tasks/:taskId) - A ROTA QUE FALTAVA
  app.get("/tasks/:taskId", async (request, reply) => {
    const task = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId },
      include: {
        subtasks: { orderBy: { position: "asc" } },
        checklists: { include: { items: { orderBy: { position: "asc" } } } },
        comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
        dependenciesFrom: { include: { dependsOnTask: true } },
        dependenciesTo: { include: { task: true } },
        assignee: true,
        reporter: true
      }
    });

    if (!task) return fail(reply, 404, { message: "Tarefa não encontrada" });
    return ok(reply, { task });
  });

  // 3. CRIAR (POST /tasks)
  app.post("/tasks", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateTaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const task = await app.prisma.task.create({
      data: {
        workspaceId: request.workspaceId,
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status || "todo",
        priority: parsed.data.priority || "medium",
        reporterId: request.user.sub,
        assigneeId: parsed.data.assigneeId || null,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        position: 65000
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "task.create",
      entityType: "Task",
      entityId: task.id,
      after: task
    });

    return ok(reply, { task }, 201);
  });

  // 4. ATUALIZAR (PATCH /tasks/:taskId)
  app.patch("/tasks/:taskId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateTaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const updated = await app.prisma.task.update({
      where: { id: request.params.taskId },
      data: {
        ...parsed.data,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        completedAt: parsed.data.status === "done" ? new Date() : undefined
      }
    });

    return ok(reply, { task: updated });
  });

  // 5. DELETAR
  app.delete("/tasks/:taskId", { preHandler: requireRole("admin") }, async (request, reply) => {
    await app.prisma.task.delete({ where: { id: request.params.taskId } });
    return ok(reply, { message: "Removido" });
  });
}