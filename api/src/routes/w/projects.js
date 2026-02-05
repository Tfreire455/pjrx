import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateProjectSchema, UpdateProjectSchema } from "../../schemas/projects.js";
import { makeSlug } from "../../services/ids.js";
import { audit } from "../../services/audit.js";
import { requireRole } from "../../middlewares/requireRole.js";

export async function projectRoutes(app) {
  // GET /w/:workspaceId/projects
  app.get("/projects", async (request, reply) => {
    const projects = await app.prisma.project.findMany({
      where: { workspaceId: request.workspaceId },
      orderBy: { createdAt: "desc" }
    });
    return ok(reply, { projects });
  });

  // GET /w/:workspaceId/projects/:projectId
  app.get("/projects/:projectId", async (request, reply) => {
    const project = await app.prisma.project.findFirst({
      where: { id: request.params.projectId, workspaceId: request.workspaceId }
    });
    if (!project) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });
    return ok(reply, { project });
  });

  // POST /w/:workspaceId/projects (member+)
  app.post("/projects", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateProjectSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const slug = parsed.data.slug ? makeSlug(parsed.data.slug) : makeSlug(parsed.data.name);

    const exists = await app.prisma.project.findUnique({
      where: { workspaceId_slug: { workspaceId: request.workspaceId, slug } }
    });
    if (exists) return fail(reply, 409, { code: "SLUG_IN_USE", message: "Slug do projeto já existe no workspace." });

    const project = await app.prisma.project.create({
      data: {
        workspaceId: request.workspaceId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        status: parsed.data.status || "active",
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        createdById: request.user.sub
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "project.create",
      entityType: "Project",
      entityId: project.id,
      before: null,
      after: project,
      request
    });

    return ok(reply, { project }, 201);
  });

  // PATCH /w/:workspaceId/projects/:projectId (member+)
  app.patch("/projects/:projectId", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(UpdateProjectSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const before = await app.prisma.project.findFirst({
      where: { id: request.params.projectId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });

    // se mudar slug, validar unique
    if (parsed.data.slug) {
      const slug = makeSlug(parsed.data.slug);
      const exists = await app.prisma.project.findUnique({
        where: { workspaceId_slug: { workspaceId: request.workspaceId, slug } }
      });
      if (exists && exists.id !== before.id) {
        return fail(reply, 409, { code: "SLUG_IN_USE", message: "Slug do projeto já existe no workspace." });
      }
    }

    const updated = await app.prisma.project.update({
      where: { id: before.id },
      data: {
        name: parsed.data.name ?? undefined,
        slug: parsed.data.slug ? makeSlug(parsed.data.slug) : undefined,
        description: parsed.data.description === undefined ? undefined : (parsed.data.description || null),
        status: parsed.data.status ?? undefined,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined
      }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "project.update",
      entityType: "Project",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { project: updated });
  });

  // DELETE /w/:workspaceId/projects/:projectId (admin+)
  app.delete("/projects/:projectId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const before = await app.prisma.project.findFirst({
      where: { id: request.params.projectId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });

    await app.prisma.project.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "project.delete",
      entityType: "Project",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Projeto removido." });
  });
}
