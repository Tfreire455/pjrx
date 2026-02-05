import { request } from "undici";
import crypto from "node:crypto";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // se não configurou, não bloqueia
  if (!signatureHeader) return false;

  // Meta envia: "sha256=<hex>"
  const [algo, provided] = String(signatureHeader).split("=");
  if (algo !== "sha256" || !provided) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function sendTemplateMessage({ to, templateName, languageCode = "pt_BR", components = [], messageKey }) {
  const token = required("WHATSAPP_TOKEN");
  const phoneNumberId = required("WHATSAPP_PHONE_NUMBER_ID");

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  };

  const res = await request(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      // idempotência do lado do app: messageKey fica no nosso log
      // (WhatsApp Cloud não tem idempotency-key padrão público)
    },
    body: JSON.stringify(body)
  });

  const text = await res.body.text();

  if (res.statusCode < 200 || res.statusCode >= 300) {
    return {
      ok: false,
      statusCode: res.statusCode,
      error: text
    };
  }

  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  // resposta típica: { messages: [ { id: "wamid..." } ] }
  const providerMessageId = json?.messages?.[0]?.id || null;

  return { ok: true, providerMessageId, raw: json };
}
