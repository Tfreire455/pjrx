export async function projectStaleDetectorJob(app, job) {
  const staleDays = Number(job?.data?.staleDays ?? 7);
  const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

  // Heurística simples: projeto com nenhum task updated após cutoff
  const projects = await app.prisma.project.findMany({
    where: {
      status: { in: ["active", "paused"] }
    },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      updatedAt: true
    }
  });

  for (const p of projects) {
    const lastTask = await app.prisma.task.findFirst({
      where: { projectId: p.id, workspaceId: p.workspaceId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    });

    const lastActivity = lastTask?.updatedAt || p.updatedAt;
    if (lastActivity > cutoff) continue;

    // cria notificação para owners/admins do workspace
    const admins = await app.prisma.workspaceMember.findMany({
      where: { workspaceId: p.workspaceId, role: { in: ["owner", "admin"] } },
      select: { userId: true }
    });

    for (const m of admins) {
      await app.prisma.notification.create({
        data: {
          workspaceId: p.workspaceId,
          userId: m.userId,
          type: "project",
          title: "Projeto parado detectado",
          body: `O projeto "${p.name}" está sem atividade há ${staleDays} dias.`,
          data: { projectId: p.id, staleDays }
        }
      });
    }

    // log em RuleRun (mesmo antes da Etapa 9, já usamos a tabela)
    const rule = await app.prisma.ruleDefinition.findFirst({
      where: { workspaceId: p.workspaceId, key: "project_stale_detector" }
    });

    if (rule) {
      await app.prisma.ruleRun.create({
        data: {
          workspaceId: p.workspaceId,
          ruleId: rule.id,
          status: "success",
          input: { projectId: p.id, staleDays },
          output: { notifiedAdmins: admins.length }
        }
      });
    }
  }

  return { ok: true };
}
