import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { CreateMilestoneSchema, UpdateMilestoneSchema } from "../../schemas/milestones.js";
import { audit } from "../../services/audit.js";

export async function milestoneRoutes(app) {
  // GET /milestones?projectId=...
  app.get("/milestones", async (request, reply) => {
    const projectId = request.query?.projectId;
    if (!projectId) return fail(reply, 400, { code: "MISSING_PROJECT", message: "Envie projectId na query." });

    const milestones = await app.prisma.milestone.findMany({
      where: { workspaceId: request.workspaceId, projectId },
      orderBy: { createdAt: "desc" }
    });

    return ok(reply, { milestones });
  });

  // POST /milestones (member+)
  app.post("/milestones", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateMilestoneSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const project = await app.prisma.project.findFirst({
      where: { id: parsed.data.projectId, workspaceId: request.workspaceId }
    });
    if (!project) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });

    const milestone = await app.prisma.milestone.create({
      data: {
        workspaceId: request.workspaceId,
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        status: "open"
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "milestone.create",
      entityType: "Milestone",
      entityId: milestone.id,
      before: null,
      after: milestone,
      request
    });

    return ok(reply, { milestone }, 201);
  });

  // PATCH /milestones/:milestoneId
  app.patch("/milestones/:milestoneId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateMilestoneSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.milestone.findFirst({
      where: { id: request.params.milestoneId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Milestone não encontrado." });

    const updated = await app.prisma.milestone.update({
      where: { id: before.id },
      data: {
        name: parsed.data.name ?? undefined,
        description: parsed.data.description === undefined ? undefined : (parsed.data.description || null),
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        status: parsed.data.status ?? undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "milestone.update",
      entityType: "Milestone",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { milestone: updated });
  });

  // DELETE /milestones/:milestoneId (admin+)
  app.delete("/milestones/:milestoneId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.milestone.findFirst({
      where: { id: request.params.milestoneId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Milestone não encontrado." });

    await app.prisma.milestone.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "milestone.delete",
      entityType: "Milestone",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Milestone removido." });
  });
}
