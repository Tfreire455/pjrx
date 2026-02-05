import { ok, fail } from "../../utils/http.js";
import { parseQuery } from "../../schemas/common.js";
import { ListNotificationsQuery } from "../../schemas/notifications.js";
import { audit } from "../../services/audit.js";

export async function notificationRoutes(app) {
  // GET /notifications
  app.get("/notifications", async (request, reply) => {
    const parsed = parseQuery(ListNotificationsQuery, request.query || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { unreadOnly, page, pageSize } = parsed.data;

    const where = {
      workspaceId: request.workspaceId,
      userId: request.user.sub,
      ...(unreadOnly ? { readAt: null } : {})
    };

    const [total, notifications] = await Promise.all([
      app.prisma.notification.count({ where }),
      app.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return ok(reply, {
      page,
      pageSize,
      total,
      notifications
    });
  });

  // POST /notifications/:notificationId/read
  app.post("/notifications/:notificationId/read", async (request, reply) => {
    const before = await app.prisma.notification.findFirst({
      where: {
        id: request.params.notificationId,
        workspaceId: request.workspaceId,
        userId: request.user.sub
      }
    });
    if (!before) return fail(reply, 404, { code: "NOT_FOUND", message: "Notificação não encontrada." });

    const updated = await app.prisma.notification.update({
      where: { id: before.id },
      data: { readAt: before.readAt ? before.readAt : new Date() }
    });

    await audit(app, {
      workspaceId: request.workspaceId,
      actorId: request.user.sub,
      action: "notification.read",
      entityType: "Notification",
      entityId: updated.id,
      before,
      after: updated,
      request
    });

    return ok(reply, { notification: updated });
  });
}
