import { z } from "zod";
import { ok, fail } from "../utils/http.js";
import { parseBody } from "../utils/validation.js";
import { sanitizeUserText } from "../ai/sanitize.js";
import {
  ProjectPlanSchema,
  WeeklyReportSchema,
  InnovationsSchema,
  ImplementationPlanSchema
} from "../ai/schemas.js";
import { SYSTEM_PROMPT, buildProjectPlanPrompt, buildWeeklyReportPrompt, buildInnovationsPrompt, buildImplementationPlanPrompt } from "../ai/prompts.js";
import { openaiJSON } from "../services/openai.js";

const BaseCtxSchema = z.object({
  workspaceId: z.string().min(10),
  projectId: z.string().min(10).optional()
});

const GenerateProjectPlanBody = BaseCtxSchema.extend({
  projectName: z.string().min(2),
  projectDescription: z.string().max(20000).optional(),
  context: z.string().max(20000).optional()
});

const WeeklyReportBody = BaseCtxSchema.extend({
  context: z.string().min(10).max(50000)
});

const InnovationsBody = BaseCtxSchema.extend({
  context: z.string().min(10).max(50000)
});

const ImplementationPlanBody = BaseCtxSchema.extend({
  feature: z.string().min(2).max(5000),
  context: z.string().min(10).max(50000)
});

async function ensureWorkspaceAccess(app, workspaceId, userId) {
  const member = await app.prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
  return member;
}

async function persistAI(app, { workspaceId, userId, kind, title, content, meta }) {
  // 1. Cria o Insight (AiInsight tem 'kind', 'title' e 'content' Json)
  const insight = await app.prisma.aiInsight.create({
    data: {
      workspaceId,
      kind, // Enum AiInsightKind
      title,
      content // Json
    }
  });

  // 2. Cria a Mensagem (AiMessage tem 'content' String)
  await app.prisma.aiMessage.create({
    data: {
      workspaceId,
      userId,
      role: "assistant", // Enum AiMessageRole
      content: JSON.stringify({ kind, insightId: insight.id, meta: meta || null }) // Stringify obrigatório
    }
  });

  return insight;
}

export async function aiRoutes(app) {
  // tudo em /ai exige auth
  app.addHook("preHandler", app.requireAuth);

  // POST /ai/generate-project-plan
  app.post("/ai/generate-project-plan", async (request, reply) => {
    const parsed = parseBody(GenerateProjectPlanBody, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const userId = request.user.sub;

    const member = await ensureWorkspaceAccess(app, parsed.data.workspaceId, userId);
    if (!member) return fail(reply, 403, { code: "FORBIDDEN", message: "Sem acesso ao workspace." });

    const s1 = sanitizeUserText(parsed.data.projectName);
    const s2 = sanitizeUserText(parsed.data.projectDescription || "");
    const s3 = sanitizeUserText(parsed.data.context || "");

    const flagged = s1.flagged || s2.flagged || s3.flagged;

    const prompt = buildProjectPlanPrompt({
      projectName: s1.text,
      projectDesc: s2.text,
      context: s3.text
    });

    const resp = await openaiJSON({
      system: SYSTEM_PROMPT,
      user: prompt
    });

    if (!resp.ok) {
      return fail(reply, 502, { code: "OPENAI_ERROR", message: "Falha na IA.", details: resp.error });
    }

    const validated = ProjectPlanSchema.safeParse(resp.data);
    if (!validated.success) {
      app.log.error({ err: validated.error.format(), raw: resp.data }, "AI Schema Validation Failed");
      return fail(reply, 502, { 
        code: "AI_SCHEMA_MISMATCH", 
        message: "IA retornou JSON fora do schema.",
        details: validated.error.format(),
        rawResponse: resp.data 
      });
    }

    const insight = await persistAI(app, {
      workspaceId: parsed.data.workspaceId,
      userId,
      kind: "project_plan",
      title: `Plano IA: ${s1.text}`,
      content: { ...validated.data, flagged },
      meta: { projectId: parsed.data.projectId || null }
    });

    // Ajustado para seu schema: removemos 'title' e 'sourceInsightId'
    await app.prisma.aiSuggestion.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        type: "plan", // String
        payload: { nextActions: validated.data.nextActions, risks: validated.data.risks } // Json
      }
    });

    return ok(reply, { insightId: insight.id, result: validated.data });
  });

  // POST /ai/weekly-report
  app.post("/ai/weekly-report", async (request, reply) => {
    const parsed = parseBody(WeeklyReportBody, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const userId = request.user.sub;

    const member = await ensureWorkspaceAccess(app, parsed.data.workspaceId, userId);
    if (!member) return fail(reply, 403, { code: "FORBIDDEN", message: "Sem acesso ao workspace." });

    const s = sanitizeUserText(parsed.data.context);

    const prompt = buildWeeklyReportPrompt({ context: s.text });

    const resp = await openaiJSON({ system: SYSTEM_PROMPT, user: prompt });
    if (!resp.ok) return fail(reply, 502, { code: "OPENAI_ERROR", message: "Falha na IA.", details: resp.error });

    const validated = WeeklyReportSchema.safeParse(resp.data);
    if (!validated.success) {
      return fail(reply, 502, { code: "AI_SCHEMA_MISMATCH", message: "IA retornou JSON fora do schema." });
    }

    const insight = await persistAI(app, {
      workspaceId: parsed.data.workspaceId,
      userId,
      kind: "weekly_report",
      title: "Resumo semanal (IA)",
      content: { ...validated.data, flagged: s.flagged },
      meta: { projectId: parsed.data.projectId || null }
    });

    // Ajustado para seu schema
    await app.prisma.aiSuggestion.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        type: "weekly",
        payload: { nextActions: validated.data.nextActions, risks: validated.data.risks }
      }
    });

    return ok(reply, { insightId: insight.id, result: validated.data });
  });

  // POST /ai/suggest-innovations
  app.post("/ai/suggest-innovations", async (request, reply) => {
    const parsed = parseBody(InnovationsBody, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const userId = request.user.sub;

    const member = await ensureWorkspaceAccess(app, parsed.data.workspaceId, userId);
    if (!member) return fail(reply, 403, { code: "FORBIDDEN", message: "Sem acesso ao workspace." });

    const s = sanitizeUserText(parsed.data.context);
    const prompt = buildInnovationsPrompt({ context: s.text });

    const resp = await openaiJSON({ system: SYSTEM_PROMPT, user: prompt });
    if (!resp.ok) return fail(reply, 502, { code: "OPENAI_ERROR", message: "Falha na IA.", details: resp.error });

    const validated = InnovationsSchema.safeParse(resp.data);
    if (!validated.success) {
      return fail(reply, 502, { code: "AI_SCHEMA_MISMATCH", message: "IA retornou JSON fora do schema." });
    }

   const insight = await persistAI(app, {
      workspaceId: parsed.data.workspaceId,
      userId,
      kind: "innovations",
      title: "Sugestões de inovação (IA)",
      content: { ...validated.data, flagged: s.flagged },
      meta: { projectId: parsed.data.projectId || null }
    });

    // Ajustado para seu schema
    await app.prisma.aiSuggestion.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        type: "innovations",
        payload: validated.data
      }
    });

    return ok(reply, { insightId: insight.id, result: validated.data });
  });

  // POST /ai/feature-implementation-plan
  app.post("/ai/feature-implementation-plan", async (request, reply) => {
    const parsed = parseBody(ImplementationPlanBody, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const userId = request.user.sub;

    const member = await ensureWorkspaceAccess(app, parsed.data.workspaceId, userId);
    if (!member) return fail(reply, 403, { code: "FORBIDDEN", message: "Sem acesso ao workspace." });

    const f = sanitizeUserText(parsed.data.feature);
    const c = sanitizeUserText(parsed.data.context);

    const prompt = buildImplementationPlanPrompt({ feature: f.text, context: c.text });

    const resp = await openaiJSON({ system: SYSTEM_PROMPT, user: prompt });
    if (!resp.ok) return fail(reply, 502, { code: "OPENAI_ERROR", message: "Falha na IA.", details: resp.error });

    const validated = ImplementationPlanSchema.safeParse(resp.data);
    if (!validated.success) {
      return fail(reply, 502, { code: "AI_SCHEMA_MISMATCH", message: "IA retornou JSON fora do schema." });
    }

    const insight = await persistAI(app, {
      workspaceId: parsed.data.workspaceId,
      userId,
      kind: "implementation_plan",
      title: `Plano de implementação: ${f.text}`,
      content: { ...validated.data, flagged: f.flagged || c.flagged },
      meta: { projectId: parsed.data.projectId || null }
    });

    // Ajustado para seu schema
    await app.prisma.aiSuggestion.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        type: "implementation",
        payload: validated.data
      }
    });

    return ok(reply, { insightId: insight.id, result: validated.data });
  });
}