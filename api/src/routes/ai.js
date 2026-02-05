import { ok, fail } from "../utils/http.js";
import { parseBody } from "../utils/validation.js";
import { z } from "zod";
import { openai } from "../services/openai.js";

// --- Schemas de Entrada ---
const GenerateProjectPlanBody = z.object({
  workspaceId: z.string().min(10),
  projectId: z.string().min(10).optional(),
  projectName: z.string().min(2),
  projectDescription: z.string().optional(),
  context: z.string().optional()
});

const ImplementationPlanBody = z.object({
  workspaceId: z.string().min(10),
  projectId: z.string().min(10).optional(),
  feature: z.string().min(2),
  context: z.string().optional()
});

// --- Helper: Verifica acesso ao workspace manualmente ---
async function ensureWorkspaceAccess(app, workspaceId, userId) {
  return app.prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
}

// --- Helper: Limpa e parseia JSON ---
function cleanAndParse(text) {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("AI JSON Parse Error:", text);
    return null;
  }
}

// --- Helper: Salva histórico no banco ---
async function persistAI(app, { workspaceId, userId, kind, title, content, meta }) {
  try {
    const insight = await app.prisma.aiInsight.create({
      data: {
        workspaceId,
        kind,
        title,
        content: content || {}
      }
    });

    await app.prisma.aiMessage.create({
      data: {
        workspaceId,
        userId,
        role: "assistant",
        content: JSON.stringify({ kind, insightId: insight.id, meta: meta || null })
      }
    });

    if (content) {
      await app.prisma.aiSuggestion.create({
        data: {
          workspaceId,
          type: kind === "project_plan" ? "plan" : "implementation",
          payload: content
        }
      });
    }
    return insight;
  } catch (e) {
    console.error("Persist Error:", e);
    return { id: "temp" };
  }
}

export async function aiRoutes(app) {
  // 1. Apenas exige que o usuário esteja logado (não checa role aqui ainda)
  app.addHook("preHandler", app.requireAuth);

  // --- Rota: Gerar Plano de Projeto ---
  app.post("/ai/generate-project-plan", async (request, reply) => {
    const parsed = parseBody(GenerateProjectPlanBody, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { workspaceId, projectId, projectName, projectDescription, context } = parsed.data;
    const userId = request.user.sub;

    // VERIFICAÇÃO DE SEGURANÇA MANUAL
    const member = await ensureWorkspaceAccess(app, workspaceId, userId);
    if (!member) {
      return fail(reply, 403, { message: "Acesso negado ao workspace." });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um Gerente de Projetos Expert. Retorne APENAS um JSON válido.
            Estrutura Obrigatória:
            {
              "risks": [{ "risk": "Titulo", "mitigation": "Ação" }],
              "nextActions": ["Ação 1", "Ação 2"],
              "sprintSuggestions": [{ "name": "Sprint 1", "goal": "Objetivo" }]
            }`
          },
          {
            role: "user",
            content: `Projeto: ${projectName}. Descrição: ${projectDescription || "N/A"}. Context: ${context || ""}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const raw = completion.choices[0].message.content;
      const json = cleanAndParse(raw);

      if (!json) return fail(reply, 500, { message: "IA retornou dados inválidos", raw });

      const insight = await persistAI(app, {
        workspaceId,
        userId,
        kind: "project_plan",
        title: `Plano: ${projectName}`,
        content: json,
        meta: { projectId }
      });

      return ok(reply, { insightId: insight.id, result: json });

    } catch (err) {
      request.log.error(err);
      return fail(reply, 500, { message: "Erro na OpenAI", error: err.message });
    }
  });

  // --- Rota: Gerar Plano de Tarefa (Feature) ---
  app.post("/ai/feature-implementation-plan", async (request, reply) => {
    const parsed = parseBody(ImplementationPlanBody, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { workspaceId, projectId, feature, context } = parsed.data;
    const userId = request.user.sub;

    // VERIFICAÇÃO DE SEGURANÇA MANUAL
    const member = await ensureWorkspaceAccess(app, workspaceId, userId);
    if (!member) return fail(reply, 403, { message: "Acesso negado." });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tech Lead Senior. Retorne JSON válido.
            {
              "risks": ["Risco 1"],
              "steps": ["Passo 1", "Passo 2"],
              "complexity": "Baixa/Média/Alta"
            }`
          },
          {
            role: "user",
            content: `Feature: ${feature}. Context: ${context || ""}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const raw = completion.choices[0].message.content;
      const json = cleanAndParse(raw);

      if (!json) return fail(reply, 500, { message: "IA inválida", raw });

      const insight = await persistAI(app, {
        workspaceId,
        userId,
        kind: "implementation_plan",
        title: `Impl: ${feature}`,
        content: json,
        meta: { projectId }
      });

      return ok(reply, { insightId: insight.id, result: json });

    } catch (err) {
      return fail(reply, 500, { message: "Erro IA", error: err.message });
    }
  });
}