import { z } from "zod";
import { ok, fail } from "../utils/http.js";
import { parseBody } from "../utils/validation.js";
import { sendTemplateMessage, verifyWebhookSignature } from "../services/whatsappCloud.js";

// interno: admin+ (ou depois você limita por API key)
const SendSchema = z.object({
  whatsappLogId: z.string().min(10).optional(),
  messageKey: z.string().min(10).optional()
}).refine((v) => v.whatsappLogId || v.messageKey, {
  message: "Envie whatsappLogId ou messageKey.",
  path: ["whatsappLogId"]
});

export async function whatsappRoutes(app) {
  // POST /whatsapp/send (interno)
  app.post("/whatsapp/send", { preHandler: [app.requireAuth] }, async (request, reply) => {
    // hardening mínimo: só admin/owner pode disparar manualmente
    const role = request.memberRole; // pode não existir fora /w prefix; então revalida abaixo
    // Como esta rota não é /w/:workspaceId, vamos checar pelo log encontrado (workspaceId) + membership.

    const parsed = parseBody(SendSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { whatsappLogId, messageKey } = parsed.data;

    const log = await app.prisma.whatsappLog.findFirst({
      where: whatsappLogId ? { id: whatsappLogId } : { messageKey }
    });

    if (!log) return fail(reply, 404, { code: "NOT_FOUND", message: "WhatsappLog não encontrado." });

    // checar membership do user no workspace do log + role admin
    const member = await app.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: log.workspaceId, userId: request.user.sub } }
    });
    if (!member || !["owner", "admin"].includes(member.role)) {
      return fail(reply, 403, { code: "FORBIDDEN", message: "Sem permissão para enviar WhatsApp." });
    }

    // idempotência: se já enviado/entregue, não reenvia
    if (["sent", "delivered"].includes(log.status)) {
      return ok(reply, { message: "Já enviado.", log });
    }

    // se está failed, permite re-tentar (mas mantém messageKey)
    // marca "sending"
    const sending = await app.prisma.whatsappLog.update({
      where: { id: log.id },
      data: { status: "sending", lastError: null }
    });

    // Montar template components
    // Padrão mínimo com CTA de link (URL button) via payload.cta_url
    const payload = sending.payload || {};
    const ctaUrl = payload?.cta_url;

    const components = [];

    // BODY variables (opcional) — exemplo: 1 variável com título da task
    if (payload?.task?.title) {
      components.push({
        type: "body",
        parameters: [{ type: "text", text: String(payload.task.title) }]
      });
    }

    // BUTTON URL CTA (se seu template tiver botão do tipo URL)
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
      components,
      messageKey: sending.messageKey
    });

    if (!resp.ok) {
      const failed = await app.prisma.whatsappLog.update({
        where: { id: sending.id },
        data: {
          status: "failed",
          lastError: `HTTP ${resp.statusCode}: ${String(resp.error).slice(0, 2000)}`,
          failedAt: new Date()
        }
      });

      return fail(reply, 502, { code: "WHATSAPP_SEND_FAILED", message: "Falha ao enviar WhatsApp.", details: failed.lastError });
    }

    const sent = await app.prisma.whatsappLog.update({
      where: { id: sending.id },
      data: {
        status: "sent",
        providerMessageId: resp.providerMessageId,
        sentAt: new Date()
      }
    });

    return ok(reply, { message: "Enviado.", log: sent });
  });

  // GET /webhooks/whatsapp (verificação)
  app.get("/webhooks/whatsapp", async (request, reply) => {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return reply.code(200).send(challenge);
    }
    return reply.code(403).send("Forbidden");
  });

  // POST /webhooks/whatsapp (status delivered/failed)
  app.post("/webhooks/whatsapp", async (request, reply) => {
    // assinatura (opcional)
    const sig = request.headers["x-hub-signature-256"];
    const raw = request.rawBody || "";
    if (!verifyWebhookSignature(raw, sig)) {
      return reply.code(401).send("Invalid signature");
    }

    const body = request.body || {};

    // formato: entry[0].changes[0].value.statuses[0]
    const statuses = body?.entry?.flatMap((e) =>
      (e.changes || []).flatMap((c) => c.value?.statuses || [])
    ) || [];

    for (const st of statuses) {
      const providerMessageId = st?.id;
      const status = st?.status; // delivered, failed, sent, read...
      const ts = st?.timestamp ? new Date(Number(st.timestamp) * 1000) : new Date();
      const errorTitle = st?.errors?.[0]?.title || st?.errors?.[0]?.message || null;

      if (!providerMessageId) continue;

      const log = await app.prisma.whatsappLog.findFirst({
        where: { providerMessageId }
      });
      if (!log) continue;

      if (status === "delivered") {
        await app.prisma.whatsappLog.update({
          where: { id: log.id },
          data: { status: "delivered", deliveredAt: ts }
        });
      } else if (status === "failed") {
        await app.prisma.whatsappLog.update({
          where: { id: log.id },
          data: {
            status: "failed",
            lastError: errorTitle ? String(errorTitle).slice(0, 2000) : "failed",
            failedAt: ts
          }
        });
      } else if (status === "sent") {
        // às vezes vem sent depois do nosso update
        if (log.status === "queued" || log.status === "sending") {
          await app.prisma.whatsappLog.update({
            where: { id: log.id },
            data: { status: "sent", sentAt: log.sentAt || ts }
          });
        }
      }
    }

    return reply.code(200).send("ok");
  });
}
