import crypto from "node:crypto";

/**
 * messageKey idempotente (único) por:
 * (taskId + kind + scheduledIso)
 */
export function makeMessageKey({ taskId, kind, scheduledIso }) {
  const base = `${taskId}:${kind}:${scheduledIso}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

export async function enqueueWhatsappTemplate(app, {
  workspaceId,
  userId,
  projectId,
  taskId,
  toPhoneE164,
  templateName,
  payload,
  messageKey
}) {
  // tenta criar log (idempotente via unique messageKey)
  try {
    const log = await app.prisma.whatsappLog.create({
      data: {
        workspaceId,
        userId: userId || null,
        projectId: projectId || null,
        taskId: taskId || null,
        messageKey,
        toPhoneE164,
        templateName,
        payload,
        status: "queued"
      }
    });

    return { ok: true, log };
  } catch (e) {
    // unique violation => já enfileirado
    if (String(e?.code) === "P2002") {
      return { ok: true, duplicate: true };
    }
    app.log.warn({ err: e }, "enqueueWhatsappTemplate failed");
    return { ok: false, error: e };
  }
}
