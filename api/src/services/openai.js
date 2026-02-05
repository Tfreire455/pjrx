import { request } from "undici";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

export async function openaiJSON({ system, user, model }) {
  const apiKey = required("OPENAI_API_KEY");
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const usedModel = model || process.env.OPENAI_MODEL || "gpt-4.1-mini";

  // Usando /chat/completions por compatibilidade ampla
  const url = `${baseUrl}/chat/completions`;

  const body = {
    model: usedModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };

  const res = await request(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await res.body.text();

  if (res.statusCode < 200 || res.statusCode >= 300) {
    return { ok: false, statusCode: res.statusCode, error: text };
  }

  let json;
  try { json = JSON.parse(text); } catch {
    return { ok: false, statusCode: 500, error: "Invalid JSON from OpenAI" };
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) return { ok: false, statusCode: 500, error: "Empty OpenAI content" };

  let parsed;
  try { parsed = JSON.parse(content); } catch {
    return { ok: false, statusCode: 500, error: "Model did not return valid JSON" };
  }

  return { ok: true, data: parsed, raw: json };
}
