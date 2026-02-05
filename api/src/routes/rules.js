import { z } from "zod";
import { ok, fail } from "../utils/http.js";
import { parseBody } from "../utils/validation.js";
import { runRules } from "../rules/engine.js";

const RunSchema = z.object({
  workspaceId: z.string().min(10),
  onlyKey: z.enum(["at_risk", "blocked", "sprint_low_completion"]).optional(),
  dryRun: z.boolean().optional()
});

export async function rulesRoutes(app) {
  app.addHook("preHandler", app.requireAuth);

  // POST /rules/run
  app.post("/rules/run", async (request, reply) => {
    const parsed = parseBody(RunSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const member = await app.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: parsed.data.workspaceId, userId: request.user.sub } }
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      return fail(reply, 403, { code: "FORBIDDEN", message: "Apenas admin/owner pode rodar regras manualmente." });
    }

    const res = await runRules(app, {
      workspaceId: parsed.data.workspaceId,
      actorId: request.user.sub,
      onlyKey: parsed.data.onlyKey || null,
      dryRun: Boolean(parsed.data.dryRun)
    });

    return ok(reply, res);
  });
}
