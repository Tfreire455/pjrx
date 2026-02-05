import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { requireRole } from "../../middlewares/requireRole.js"; // Se tiver esse arquivo separado
import { UpdateMemberRoleSchema } from "../../schemas/workspaces.js";
import { audit } from "../../services/audit.js";

export async function workspaceRoutes(app) {
  // 1. Autenticação Básica
  app.addHook("preHandler", app.requireAuth);

  // 2. MIDDLEWARE CRÍTICO: Verifica se o user pertence ao Workspace da URL
  app.addHook("preHandler", async (request, reply) => {
    const { workspaceId } = request.params; // Vem da URL /w/:workspaceId/...
    const userId = request.user.sub;

    if (!workspaceId) return fail(reply, 400, { message: "Workspace ID missing" });

    const member = await app.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member) {
      return fail(reply, 403, { code: "ACCESS_DENIED", message: "Você não é membro deste workspace." });
    }

    // Injeta dados no request para as rotas usarem
    request.workspaceId = workspaceId;
    request.memberRole = member.role;
  });

  // GET /w/:workspaceId/workspace
  app.get("/workspace", async (request, reply) => {
    const ws = await app.prisma.workspace.findUnique({
      where: { id: request.workspaceId },
      select: { id: true, name: true, slug: true, ownerId: true, createdAt: true }
    });
    return ok(reply, { workspace: ws, role: request.memberRole });
  });

  // GET /w/:workspaceId/members
  app.get("/members", async (request, reply) => {
    const members = await app.prisma.workspaceMember.findMany({
      where: { workspaceId: request.workspaceId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" }
    });

    return ok(reply, {
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user
      }))
    });
  });

  // PATCH /w/:workspaceId/members/:memberId
  // requireRole é uma função que checa se request.memberRole atende o requisito
  app.patch("/members/:memberId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const parsed = parseBody(UpdateMemberRoleSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { memberId } = request.params;
    
    // ... Lógica de update (igual ao seu código original) ...
    const updated = await app.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role }
    });
    
    return ok(reply, { member: updated });
  });

  // DELETE /w/:workspaceId/members/:memberId
  app.delete("/members/:memberId", { preHandler: requireRole("admin") }, async (request, reply) => {
    const { memberId } = request.params;
    
    // ... Lógica de delete (igual ao seu código original) ...
    await app.prisma.workspaceMember.delete({ where: { id: memberId } });

    return ok(reply, { message: "Membro removido." });
  });
}