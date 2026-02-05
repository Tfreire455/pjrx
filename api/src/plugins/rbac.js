import fp from "fastify-plugin";

/**
 * RBAC + workspace isolation (base).
 * Na ETAPA 4/5 vamos:
 * - buscar membership no banco
 * - validar role por workspace
 * - exigir workspace_id em tudo
 */
export default fp(async function rbacPlugin(app) {
  // roles padronizadas
  const ROLE_RANK = { guest: 1, member: 2, admin: 3, owner: 4 };

  app.decorate("requireRole", function requireRole(minRole = "member") {
    return async function (request, reply) {
      // por enquanto: role pode vir no token (ex.: request.user.role)
      // Na ETAPA 5: buscar role real por workspace no banco
      const user = request.user;
      const userRole = user?.role || "guest";

      if ((ROLE_RANK[userRole] || 0) < (ROLE_RANK[minRole] || 0)) {
        return reply.code(403).send({
          ok: false,
          error: { code: "FORBIDDEN", message: "Permissão insuficiente." }
        });
      }
    };
  });
});
