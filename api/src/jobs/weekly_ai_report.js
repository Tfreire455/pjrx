export async function weeklyAiReportJob(app, job) {
  const lookbackDays = Number(job?.data?.lookbackDays ?? 7);
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // pega workspaces
  const workspaces = await app.prisma.workspace.findMany({
    select: { id: true, name: true }
  });

  for (const ws of workspaces) {
    // stats simples
    const [createdTasks, doneTasks] = await Promise.all([
      app.prisma.task.count({ where: { workspaceId: ws.id, createdAt: { gte: since } } }),
      app.prisma.task.count({ where: { workspaceId: ws.id, status: "done", updatedAt: { gte: since } } })
    ]);

    // cria insight placeholder (Etapa 8 vai substituir com OpenAI real)
    const insight = await app.prisma.aiInsight.create({
      data: {
        workspaceId: ws.id,
        kind: "weekly_report",
        title: "Resumo semanal (placeholder)",
        content: {
          lookbackDays,
          createdTasks,
          doneTasks,
          nextActions: [
            "Revisar tarefas em risco",
            "Planejar sprint da semana",
            "Checar bloqueios"
          ],
          risks: [
            "Tarefas com prazo próximo podem virar atraso",
            "Projetos sem atividade podem travar"
          ]
        }
      }
    });

    // notificar admins
    const admins = await app.prisma.workspaceMember.findMany({
      where: { workspaceId: ws.id, role: { in: ["owner", "admin"] } },
      select: { userId: true }
    });

    for (const m of admins) {
      await app.prisma.notification.create({
        data: {
          workspaceId: ws.id,
          userId: m.userId,
          type: "ai",
          title: "Resumo semanal PRJX",
          body: "Seu resumo semanal está pronto (placeholder).",
          data: { aiInsightId: insight.id }
        }
      });
    }
  }

  return { ok: true };
}
