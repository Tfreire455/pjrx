import { sendTemplateMessage } from "../services/whatsappCloud.js";

export async function whatsappSenderTickJob(app, job) {
  // pega até 20 por rodada
  const logs = await app.prisma.whatsappLog.findMany({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 20
  });

  for (const log of logs) {
    // marca sending de forma atômica (best effort)
    const sending = await app.prisma.whatsappLog.update({
      where: { id: log.id },
      data: { status: "sending", lastError: null }
    });

    const payload = sending.payload || {};
    const ctaUrl = payload?.cta_url;

    const components = [];
    if (payload?.task?.title) {
      components.push({
        type: "body",
        parameters: [{ type: "text", text: String(payload.task.title) }]
      });
    }
    if (ctaUrl) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: String(ctaUrl) }]
      });
    }

    const resp = await sendTemplateMessage({
      to: sending.toPhoneE164,
      templateName: sending.templateName,
      languageCode: "pt_BR",
      components
    });

    if (!resp.ok) {
      await app.prisma.whatsappLog.update({
        where: { id: sending.id },
        data: {
          status: "failed",
          lastError: `HTTP ${resp.statusCode}: ${String(resp.error).slice(0, 2000)}`,
          failedAt: new Date()
        }
      });
      continue;
    }

    await app.prisma.whatsappLog.update({
      where: { id: sending.id },
      data: {
        status: "sent",
        providerMessageId: resp.providerMessageId,
        sentAt: new Date()
      }
    });
  }

  return { ok: true, processed: logs.length };
}
