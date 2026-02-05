import { ok, fail } from "../../utils/http.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { parseQuery, Pagination } from "../../schemas/common.js";

export async function auditRoutes(app) {
  // GET /audit (admin+)
  app.get("/audit", { preHandler: requireRole("admin") }, async (request, reply) => {
    const parsed = parseQuery(Pagination, request.query || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { page, pageSize } = parsed.data;

    const where = { workspaceId: request.workspaceId };

    const [total, logs] = await Promise.all([
      app.prisma.auditLog.count({ where }),
      app.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return ok(reply, { page, pageSize, total, logs });
  });
}
