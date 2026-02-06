import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateProjectSchema, UpdateProjectSchema } from "../../schemas/projects.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { audit } from "../../services/audit.js";

export async function projectRoutes(app) {
  // GET /projects (Com estatísticas de progresso)
  app.get("/projects", async (request, reply) => {
    const projects = await app.prisma.project.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { updatedAt: "desc" },
      include: {
        // Traz apenas o status para calcularmos no backend ou frontend
        // Uma abordagem mais leve seria usar _count se o Prisma suportasse filtro dentro do count facilmente em versões antigas,
        // mas trazer status é seguro para volumes médios.
        tasks: {
          select: { status: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    // Calcula progresso antes de enviar
    const enriched = projects.map(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.status === "done").length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      
      // Remove a lista de tasks para não pesar o JSON, manda só os stats
      const { tasks, ...rest } = p;
      return { ...rest, stats: { total, done, progress } };
    });

    return ok(reply, { projects: enriched });
  });

  // GET /projects/:projectId
  app.get("/projects/:projectId", async (request, reply) => {
    const project = await app.prisma.project.findFirst({
      where: { id: request.params.projectId, workspaceId: request.workspaceId },
      include: {
        members: { include: { user: true } },
        sprints: { orderBy: { endAt: "desc" }, take: 1 } // Pega a sprint atual/última
      }
    });

    if (!project) return fail(reply, 404, { message: "Projeto não encontrado" });
    return ok(reply, { project });
  });

  // POST /projects
  app.post("/projects", { preHandler: requireRole("admin") }, async (request, reply) => {
    const parsed = parseBody(CreateProjectSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const project = await app.prisma.project.create({
      data: {
        workspaceId: request.workspaceId,
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status || "active",
        ownerId: request.user.sub
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "project.create",
      entityType: "Project",
      entityId: project.id,
      after: project
    });

    return ok(reply, { project }, 201);
  });

  // PATCH /projects/:projectId
  app.patch("/projects/:projectId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const parsed = parseBody(UpdateProjectSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const updated = await app.prisma.project.updateMany({
      where: { id: request.params.projectId, workspaceId: request.workspaceId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status
      }
    });

    if (updated.count === 0) return fail(reply, 404, { message: "Projeto não encontrado" });

    return ok(reply, { message: "Projeto atualizado" });
  });

  // DELETE /projects/:projectId
  app.delete("/projects/:projectId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const deleted = await app.prisma.project.deleteMany({
      where: { id: request.params.projectId, workspaceId: request.workspaceId }
    });

    if (deleted.count === 0) return fail(reply, 404, { message: "Projeto não encontrado" });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "project.delete",
      entityType: "Project",
      entityId: request.params.projectId
    });

    return ok(reply, { message: "Projeto removido" });
  });
}