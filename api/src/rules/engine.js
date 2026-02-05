import { audit } from "../services/audit.js";
import { enqueueWhatsappTemplate, makeMessageKey } from "../services/whatsappQueue.js";
import { isWithinQuietHours } from "../services/time.js";
import { openai } from "../services/openai.js";
import { SYSTEM_PROMPT } from "../ai/prompts.js";

import { ruleAtRisk } from "./rules.at_risk.js";
import { ruleBlocked } from "./rules.blocked.js";
import { ruleSprintLowCompletion } from "./rules.sprint_low_completion.js";

const RULES = {
  at_risk: ruleAtRisk,
  blocked: ruleBlocked,
  sprint_low_completion: ruleSprintLowCompletion
};

function nowISO() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}

async function getMemberRole(prisma, workspaceId, userId) {
  const m = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
  return m?.role || null;
}

export async function ensureDefaultRules(app, workspaceId) {
  // cria regras padrão se não existirem (idempotente)
  const defaults = [
    { key: "at_risk", name: "Task at risk (<24h)", enabled: true, config: { hours: 24 } },
    { key: "blocked", name: "Task blocked ping", enabled: true, config: {} },
    { key: "sprint_low_completion", name: "Sprint ending + baixa conclusão", enabled: true, config: { hours: 48, minCompletion: 0.6 } }
  ];

  for (const r of defaults) {
    await app.prisma.ruleDefinition.upsert({
      where: { workspaceId_key: { workspaceId, key: r.key } },
      update: {},
      create: { workspaceId, key: r.key, name: r.name, enabled: r.enabled, config: r.config }
    });
  }
}

async function createInAppNotification(app, { workspaceId, userId, type, title, body, data }) {
  return app.prisma.notification.create({
    data: {
      workspaceId,
      userId,
      type,
      title,
      body,
      data: data || null
    }
  });
}

async function maybeSendWhatsapp(app, { workspaceId, userId, projectId, taskId, templateName, payload, kind }) {
  const pref = await app.prisma.whatsappPref.findFirst({
    where: { workspaceId, userId, enabled: true }
  });
  if (!pref?.phoneE164) return { ok: false, skipped: "no_pref" };

  if (isWithinQuietHours(new Date(), pref)) return { ok: false, skipped: "quiet_hours" };

  const scheduledIso = nowISO();
  const messageKey = makeMessageKey({ taskId: taskId || "none", kind, scheduledIso });

  return enqueueWhatsappTemplate(app, {
    workspaceId,
    userId,
    projectId: projectId || null,
    taskId: taskId || null,
    toPhoneE164: pref.phoneE164,
    templateName,
    payload,
    messageKey
  });
}

async function maybeCreateAiPlan(app, { workspaceId, title, context, kind = "project_plan" }) {
  // Reaproveita OpenAI e salva em AiInsight
  // kind usa os que você já tem no enum/DB (ex: project_plan)
  const prompt = `
Crie um plano curto e objetivo (JSON) para resolver o problema abaixo.
Regras:
- Seja direto
- Inclua riscos e próximas ações

Contexto:
${context}

Formato JSON:
{
  "summary": "...",
  "risks": [{"title":"...","severity":"low|medium|high","reason":"...","mitigation":"..."}],
  "nextActions": [{"title":"...","why":"...","ownerHint":"...","dueHint":"..."}]
}
`.trim();

  const resp = await openai({ system: SYSTEM_PROMPT, user: prompt });
  if (!resp.ok) return { ok: false, error: resp.error };

  // salva insight
  const insight = await app.prisma.aiInsight.create({
    data: {
      workspaceId,
      kind,
      title,
      content: resp.data
    }
  });

  return { ok: true, insight };
}

export async function runRules(app, { workspaceId, actorId = null, onlyKey = null, dryRun = false }) {
  await ensureDefaultRules(app, workspaceId);

  const defs = await app.prisma.ruleDefinition.findMany({
    where: {
      workspaceId,
      enabled: true,
      ...(onlyKey ? { key: onlyKey } : {})
    },
    orderBy: { key: "asc" }
  });

  const results = [];

  for (const def of defs) {
    const impl = RULES[def.key];
    if (!impl) continue;

    const input = { key: def.key, config: def.config || {} };

    try {
      const out = await impl(app, {
        workspaceId,
        config: def.config || {},
        dryRun,
        helpers: {
          createInAppNotification,
          maybeSendWhatsapp,
          maybeCreateAiPlan,
          getMemberRole
        }
      });

      // registrar RuleRun
      const rr = await app.prisma.ruleRun.create({
        data: {
          workspaceId,
          ruleId: def.id,
          status: "success",
          input,
          output: out || null
        }
      });

      // audit (leve)
      if (actorId) {
        await audit(app, {
          workspaceId,
          actorId,
          action: "rule.run",
          entityType: "RuleDefinition",
          entityId: def.id,
          before: null,
          after: { key: def.key, runId: rr.id },
          request: null
        });
      }

      results.push({ key: def.key, ok: true, runId: rr.id, output: out });
    } catch (e) {
      const rr = await app.prisma.ruleRun.create({
        data: {
          workspaceId,
          ruleId: def.id,
          status: "failed",
          input,
          error: String(e?.message || e).slice(0, 2000)
        }
      });
      results.push({ key: def.key, ok: false, runId: rr.id, error: String(e?.message || e) });
    }
  }

  return { workspaceId, ran: results.length, results };
}
