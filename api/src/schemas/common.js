import { z } from "zod";

export const Cuid = z.string().min(10);
export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export function parseQuery(schema, query) {
  const r = schema.safeParse(query);
  if (!r.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Query inválida.",
        issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      }
    };
  }
  return { ok: true, data: r.data };
}
