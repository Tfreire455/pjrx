export async function ruleBlocked(app, { workspaceId, config, dryRun, helpers }) {
  const tasks = await app.prisma.task.findMany({
    where: {
      workspaceId,
      status: "blocked"
    },
    select: {
      id: true,
      title: true,
      projectId: true,
      assigneeId: true,
      updatedAt: true
    },
    take: 50
  });

  const actions = [];

  for (const t of tasks) {
    if (!t.assigneeId) continue;

    const link = `${process.env.APP_URL || "http://localhost:3000"}/w/${workspaceId}/p/${t.projectId}/t/${t.id}`;

    const notif = {
      type: "task",
      title: "Tarefa bloqueada",
      body: `"${t.title}" está bloqueada. Defina o impedimento e o próximo passo.`,
      data: { taskId: t.id, projectId: t.projectId, link }
    };

    const waPayload = {
      kind: "blocked",
      task: { id: t.id, title: t.title },
      cta_url: link
    };

    const aiContext = `
Tarefa bloqueada: ${t.title}
Objetivo: destravar rápido com próximos passos e alternativas.
Inclua: possíveis causas, perguntas para clarificar, e um plano mínimo.
Link: ${link}
`.trim();

    if (!dryRun) {
      await helpers.createInAppNotification(app, { workspaceId, userId: t.assigneeId, ...notif });

      await helpers.maybeSendWhatsapp(app, {
        workspaceId,
        userId: t.assigneeId,
        projectId: t.projectId,
        taskId: t.id,
        templateName: "task_reminder_v1",
        payload: waPayload,
        kind: "blocked"
      });

      await helpers.maybeCreateAiPlan(app, {
        workspaceId,
        title: `Plano para destravar: ${t.title}`,
        context: aiContext,
        kind: "project_plan"
      });
    }

    actions.push({ taskId: t.id, pinged: true, aiPlan: true });
  }

  return { found: tasks.length, actions };
}
