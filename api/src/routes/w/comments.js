import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { CreateCommentSchema } from "../../schemas/comments.js";
import { audit } from "../../services/audit.js";

export async function commentRoutes(app) {
  // GET /comments?taskId=... OR projectId=...
  app.get("/comments", async (request, reply) => {
    const taskId = request.query?.taskId;
    const projectId = request.query?.projectId;

    if (!taskId && !projectId) {
      return fail(reply, 400, { code: "MISSING_TARGET", message: "Envie taskId ou projectId na query." });
    }

    const comments = await app.prisma.comment.findMany({
      where: {
        workspaceId: request.workspaceId,
        taskId: taskId || undefined,
        projectId: projectId || undefined
      },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, email: true, name: true, avatarUrl: true } } }
    });

    return ok(reply, { comments });
  });

  // POST /comments
  app.post("/comments", { preHandler: requireRole("member") }, async (request, reply) => {
    const parsed = parseBody(CreateCommentSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    // validar target no workspace
    if (parsed.data.taskId) {
      const task = await app.prisma.task.findFirst({
        where: { id: parsed.data.taskId, workspaceId: request.workspaceId }
      });
      if (!task) return fail(reply, 404, { code: "NOT_FOUND", message: "Tarefa não encontrada." });
    }

    if (parsed.data.projectId) {
      const project = await app.prisma.project.findFirst({
        where: { id: parsed.data.projectId, workspaceId: request.workspaceId }
      });
      if (!project) return fail(reply, 404, { code: "NOT_FOUND", message: "Projeto não encontrado." });
    }

    const comment = await app.prisma.comment.create({
      data: {
        workspaceId: request.workspaceId,
        taskId: parsed.data.taskId || null,
        projectId: parsed.data.projectId || null,
        authorId: request.user.sub,
        body: parsed.data.body
      },
      include: { author: { select: { id: true, email: true, name: true, avatarUrl: true } } }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "comment.create",
      entityType: "Comment",
      entityId: comment.id,
      before: null,
      after: comment,
      request
    });

    return ok(reply, { comment }, 201);
  });

  // DELETE /comments/:commentId (admin+ OU autor)
  app.delete("/comments/:commentId", { preHandler: requireRole("member") }, async (request, reply) => {
    const before = await app.prisma.comment.findFirst({
      where: { id: request.params.commentId, workspaceId: request.workspaceId }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Comentário não encontrado." });

    const isAuthor = before.authorId === request.user.sub;
    const isAdmin = ["admin", "owner"].includes(request.memberRole);

    if (!isAuthor && !isAdmin) {
      return fail(reply, 403, { code: "FORBIDDEN", message: "Você não pode remover este comentário." });
    }

    await app.prisma.comment.delete({ where: { id: before.id } });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "comment.delete",
      entityType: "Comment",
      entityId: before.id,
      before,
      after: null,
      request
    });

    return ok(reply, { message: "Comentário removido." });
  });
}
