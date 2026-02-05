export async function ruleAtRisk(app, { workspaceId, config, dryRun, helpers }) {
  const hours = Number(config?.hours ?? 24);
  const now = new Date();
  const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

  // tasks com dueAt próximo e não concluídas
  const tasks = await app.prisma.task.findMany({
    where: {
      workspaceId,
      dueAt: { lte: cutoff, gte: now },
      status: { in: ["todo", "doing", "blocked"] }
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      projectId: true,
      assigneeId: true,
      status: true
    },
    take: 50
  });

  const actions = [];

  for (const t of tasks) {
    if (!t.assigneeId) continue;

    const link = `${process.env.APP_URL || "http://localhost:3000"}/w/${workspaceId}/p/${t.projectId}/t/${t.id}`;

    const notif = {
      type: "task",
      title: "Tarefa em risco",
      body: `"${t.title}" vence em menos de ${hours}h.`,
      data: { taskId: t.id, projectId: t.projectId, dueAt: t.dueAt, link }
    };

    const waPayload = {
      kind: "at_risk",
      task: { id: t.id, title: t.title, dueAt: t.dueAt, status: t.status },
      cta_url: link
    };

    const aiContext = `
Workspace: ${workspaceId}
Task: ${t.title} (status: ${t.status})
DueAt: ${t.dueAt?.toISOString?.() || t.dueAt}
Link: ${link}
Objetivo: evitar atraso em <${hours}h.
`.trim();

    if (!dryRun) {
      await helpers.createInAppNotification(app, { workspaceId, userId: t.assigneeId, ...notif });

      // WhatsApp
      await helpers.maybeSendWhatsapp(app, {
        workspaceId,
        userId: t.assigneeId,
        projectId: t.projectId,
        taskId: t.id,
        templateName: "task_reminder_v1",
        payload: waPayload,
        kind: "at_risk"
      });

      // Plano IA (salva em AiInsight)
      await helpers.maybeCreateAiPlan(app, {
        workspaceId,
        title: `Plano anti-atraso: ${t.title}`,
        context: aiContext,
        kind: "project_plan"
      });
    }

    actions.push({ taskId: t.id, notified: true, whatsappQueued: true, aiPlan: true });
  }

  return { found: tasks.length, actions };
}
