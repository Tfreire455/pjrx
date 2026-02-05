import { ZodError } from "zod";

export function parseBody(schema, body) {
  try {
    return { ok: true, data: schema.parse(body) };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Payload inválido.",
          issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
        }
      };
    }
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Payload inválido." } };
  }
}
