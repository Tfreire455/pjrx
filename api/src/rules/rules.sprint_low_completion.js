export async function ruleSprintLowCompletion(app, { workspaceId, config, dryRun, helpers }) {
  const hours = Number(config?.hours ?? 48);
  const minCompletion = Number(config?.minCompletion ?? 0.6);

  const now = new Date();
  const endCutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const sprints = await app.prisma.sprint.findMany({
    where: {
      workspaceId,
      status: { in: ["active", "planned"] },
      endAt: { lte: endCutoff, gte: now }
    },
    select: {
      id: true,
      name: true,
      projectId: true,
      endAt: true
    },
    take: 20
  });

  const actions = [];

  for (const s of sprints) {
    const items = await app.prisma.sprintItem.findMany({
      where: { workspaceId, sprintId: s.id },
      select: { taskId: true }
    });

    if (items.length === 0) continue;

    const taskIds = items.map((i) => i.taskId);
    const tasks = await app.prisma.task.findMany({
      where: { workspaceId, id: { in: taskIds } },
      select: { id: true, status: true, title: true }
    });

    const done = tasks.filter((t) => t.status === "done").length;
    const ratio = done / tasks.length;

    if (ratio >= minCompletion) continue;

    const link = `${process.env.APP_URL || "http://localhost:3000"}/w/${workspaceId}/p/${s.projectId}`;

    const admins = await app.prisma.workspaceMember.findMany({
      where: { workspaceId, role: { in: ["owner", "admin"] } },
      select: { userId: true }
    });

    const notifTitle = "Sprint em risco";
    const notifBody = `Sprint "${s.name}" termina em breve e está com baixa conclusão (${done}/${tasks.length}).`;

    const aiContext = `
Sprint: ${s.name}
Termina em: ${s.endAt?.toISOString?.() || s.endAt}
Conclusão: ${done}/${tasks.length} (${Math.round(ratio * 100)}%)
Objetivo: plano de recuperação (repriorizar, cortar escopo, travas, sequência).
Link: ${link}
Tarefas pendentes:
${tasks.filter(t=>t.status!=="done").slice(0,25).map(t=>`- ${t.title} (${t.status})`).join("\n")}
`.trim();

    if (!dryRun) {
      for (const a of admins) {
        await helpers.createInAppNotification(app, {
          workspaceId,
          userId: a.userId,
          type: "sprint",
          title: notifTitle,
          body: notifBody,
          data: { sprintId: s.id, projectId: s.projectId, link, completion: ratio }
        });
      }

      await helpers.maybeCreateAiPlan(app, {
        workspaceId,
        title: `Plano de recuperação: ${s.name}`,
        context: aiContext,
        kind: "project_plan"
      });
    }

    actions.push({
      sprintId: s.id,
      completion: ratio,
      notifiedAdmins: admins.length,
      aiPlan: true
    });
  }

  return { found: sprints.length, actions };
}
