import { ok, fail } from "../utils/http.js"; // Caminho corrigido
import { parseBody } from "../utils/validation.js";
import { z } from "zod";
import { openai } from "../services/openai.js";

// Schemas
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

// Helper: Acesso
async function ensureWorkspaceAccess(app, workspaceId, userId) {
  return app.prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
}

// Helper: Parse Seguro
function cleanAndParse(text) {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Erro Parse JSON IA:", text);
    return null;
  }
}

// Helper: Persistência (Memória do Plano)
async function persistAI(app, { workspaceId, userId, kind, title, content, meta }) {
  try {
    // Salva o insight
    const insight = await app.prisma.aiInsight.create({
      data: { workspaceId, kind, title, content: content || {} }
    });
    
    // Registra no chat/log
    await app.prisma.aiMessage.create({
      data: {
        workspaceId,
        userId,
        role: "assistant",
        content: JSON.stringify({ kind, insightId: insight.id, meta: meta || null })
      }
    });
    return insight;
  } catch (e) {
    console.error("Erro ao persistir IA:", e);
    return { id: "temp-failure" };
  }
}

export async function aiRoutes(app) {
  app.addHook("preHandler", app.requireAuth);

  // Rota 1: Gerar Plano Completo (Projeto)
  app.post("/ai/generate-project-plan", async (request, reply) => {
    const parsed = parseBody(GenerateProjectPlanBody, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { workspaceId, projectId, projectName, projectDescription, context } = parsed.data;
    const userId = request.user.sub;

    const member = await ensureWorkspaceAccess(app, workspaceId, userId);
    if (!member) return fail(reply, 403, { message: "Sem acesso ao workspace" });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um Gerente de Projetos Senior. Retorne APENAS um JSON válido.
            Estrutura obrigatória:
            {
              "risks": [
                { "risk": "Nome curto", "mitigation": "Ação detalhada", "dueInDays": 3, "impact": "High/Medium/Low" }
              ],
              "nextActions": [
                { "title": "Ação prática", "dueInDays": 2, "priority": "high/medium/low" }
              ],
              "sprintSuggestions": [
                { "name": "Sprint 1: [Tema]", "goal": "Objetivo claro", "durationDays": 14 }
              ]
            }`
          },
          {
            role: "user",
            content: `Projeto: ${projectName}. Descrição: ${projectDescription || ""}. Contexto: ${context || ""}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const json = cleanAndParse(completion.choices[0].message.content);
      if (!json) return fail(reply, 500, { message: "IA não retornou JSON válido." });

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
      return fail(reply, 500, { message: "Erro OpenAI", error: err.message });
    }
  });

  // Rota 2: Gerar Plano de Feature (Tarefa)
  app.post("/ai/feature-implementation-plan", async (request, reply) => {
    const parsed = parseBody(ImplementationPlanBody, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { workspaceId, projectId, feature, context } = parsed.data;
    const userId = request.user.sub;

    await ensureWorkspaceAccess(app, workspaceId, userId);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tech Lead. Retorne JSON: { "risks": [], "steps": [], "complexity": "Low/Mid/High" }`
          },
          { role: "user", content: `Feature: ${feature}. Contexto: ${context}` }
        ],
        response_format: { type: "json_object" }
      });

      const json = cleanAndParse(completion.choices[0].message.content);
      if (!json) return fail(reply, 500, { message: "IA inválida" });

      const insight = await persistAI(app, {
        workspaceId,
        userId,
        kind: "implementation_plan",
        title: `Feature: ${feature}`,
        content: json,
        meta: { projectId }
      });

      return ok(reply, { insightId: insight.id, result: json });

    } catch (err) {
      return fail(reply, 500, { message: "Erro IA", error: err.message });
    }
  });
}