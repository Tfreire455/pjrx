import { fail } from "../utils/http.js";

/**
 * Exige /w/:workspaceId em rotas.
 * Valida membership e injeta:
 * - request.workspaceId
 * - request.memberRole
 * - request.member (registro do WorkspaceMember)
 */
export async function workspaceGuard(request, reply) {
  const workspaceId = request.params?.workspaceId;

  if (!workspaceId) {
    return fail(reply, 400, { code: "MISSING_WORKSPACE", message: "workspaceId ausente no path." });
  }

  // requireAuth já rodou e setou request.user.sub
  const userId = request.user?.sub;
  if (!userId) {
    return fail(reply, 401, { code: "UNAUTHORIZED", message: "Token inválido." });
  }

  const member = await request.server.prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });

  if (!member) {
    return fail(reply, 403, { code: "NO_WORKSPACE_ACCESS", message: "Sem acesso ao workspace." });
  }

  request.workspaceId = workspaceId;
  request.memberRole = member.role;
  request.member = member;
}
