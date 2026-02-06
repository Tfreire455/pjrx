import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateTaskSchema, UpdateTaskSchema } from "../../schemas/tasks.js";
import { audit } from "../../services/audit.js";
import { requireRole } from "../../middlewares/requireRole.js";

export async function taskRoutes(app) {
  // 1. LISTAR TAREFAS (GET /tasks)
  app.get("/tasks", async (request, reply) => {
    try {
      const { projectId, atRisk } = request.query;
      
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
        include: { 
          subtasks: { orderBy: { position: "asc" } },
          assignee: { select: { id: true, name: true, email: true } }
        }
      });

      return ok(reply, { tasks });
    } catch (e) {
      request.log.error(e);
      return fail(reply, 500, { message: "Erro ao listar tarefas", error: e.message });
    }
  });

  // 2. DETALHES DA TAREFA (GET /tasks/:taskId)
  app.get("/tasks/:taskId", async (request, reply) => {
    try {
      const task = await app.prisma.task.findFirst({
        where: { 
          id: request.params.taskId, 
          workspaceId: request.workspaceId 
        },
        include: {
          subtasks: { orderBy: { position: "asc" } },
          checklists: { 
            include: { items: { orderBy: { position: "asc" } } } 
          },
          comments: { 
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, name: true } } } 
          },
          // --- CORREÇÃO AQUI ---
          // O nome correto da relação no seu schema é 'dependsOn' e não 'dependsOnTask'
          dependenciesFrom: { 
            include: { 
              dependsOn: true // <--- CORRIGIDO
            } 
          },
          dependenciesTo: { 
            include: { 
              task: true 
            } 
          },
          // ---------------------
          assignee: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true } }
        }
      });

      if (!task) return fail(reply, 404, { message: "Tarefa não encontrada." });

      return ok(reply, { task });

    } catch (e) {
      console.error("Erro no GET /tasks/:id:", e);
      return fail(reply, 500, { message: "Erro interno ao buscar tarefa.", details: e.message });
    }
  });

  // 3. CRIAR TAREFA (POST /tasks)
  app.post("/tasks", { preHandler: requireRole("member") }, async (request, reply) => {
    try {
      const parsed = parseBody(CreateTaskSchema, request.body);
      if (!parsed.ok) return fail(reply, 400, parsed.error);

      const last = await app.prisma.task.findFirst({
        where: { projectId: parsed.data.projectId },
        orderBy: { position: "desc" },
        select: { position: true }
      });
      const position = (last?.position || 0) + 1000;

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
          position
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
    } catch (e) {
      request.log.error(e);
      return fail(reply, 500, { message: "Erro ao criar tarefa", error: e.message });
    }
  });

  // 4. ATUALIZAR TAREFA (PATCH /tasks/:taskId)
  app.patch("/tasks/:taskId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateTaskSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { message: "Tarefa não encontrada" });

    const updated = await app.prisma.task.update({
      where: { id: before.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assigneeId: parsed.data.assigneeId,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        position: parsed.data.position,
        completedAt: parsed.data.status === "done" ? new Date() : undefined
      }
    });

    return ok(reply, { task: updated });
  });

  // 5. DELETAR TAREFA (DELETE /tasks/:taskId)
  app.delete("/tasks/:taskId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const task = await app.prisma.task.findFirst({
      where: { id: request.params.taskId, workspaceId: request.workspaceId }
    });
    if (!task) return fail(reply, 404, { message: "Tarefa não encontrada" });

    await app.prisma.task.delete({ where: { id: task.id } });

    return ok(reply, { message: "Tarefa removida" });
  });
}