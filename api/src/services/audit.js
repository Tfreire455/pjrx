export async function audit(app, {
  workspaceId,
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
  request
}) {
  try {
    await app.prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: actorId || null,
        action,
        entityType,
        entityId,
        before: before ?? null,
        after: after ?? null,
        ip: request?.ip || null,
        userAgent: request?.headers?.["user-agent"] || null
      }
    });
  } catch (e) {
    // audit nunca deve derrubar request
    app.log.warn({ err: e }, "audit_log failed");
  }
}
