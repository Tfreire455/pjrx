import { enqueueWhatsappTemplate, makeMessageKey } from "../services/whatsappQueue.js";
import { isWithinQuietHours } from "../services/time.js";

function isoFloorMinute(d) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  return x.toISOString();
}

export async function scheduleTaskRemindersJob(app, job) {
  const now = new Date();

  // janelas para capturar tarefas com dueAt próximos (tolerância p/ rodar a cada 5 min)
  const windowMin = 6; // minutos
  const ms = (m) => m * 60 * 1000;

  const targets = [
    { kind: "due_24h", deltaMs: 24 * 60 * 60 * 1000 },
    { kind: "due_3h", deltaMs: 3 * 60 * 60 * 1000 },
    { kind: "due_now", deltaMs: 0 }
  ];

  // Pega tasks que estão ativas e com dueAt
  // (vamos filtrar por janelas pra cada kind)
  for (const t of targets) {
    const start = new Date(now.getTime() + t.deltaMs - ms(windowMin));
    const end = new Date(now.getTime() + t.deltaMs + ms(windowMin));

    const tasks = await app.prisma.task.findMany({
      where: {
        dueAt: { gte: start, lt: end },
        status: { in: ["todo", "doing", "blocked"] }
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        workspaceId: true,
        projectId: true,
        assigneeId: true
      }
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      const pref = await app.prisma.whatsappPref.findFirst({
        where: {
          workspaceId: task.workspaceId,
          userId: task.assigneeId,
          enabled: true
        }
      });
      if (!pref) continue;

      // quiet hours
      if (isWithinQuietHours(now, pref)) continue;

      const scheduledIso = isoFloorMinute(new Date(task.dueAt));
      const messageKey = makeMessageKey({ taskId: task.id, kind: t.kind, scheduledIso });

      // Deep link padrão do app (front resolve depois)
      const link = `${process.env.APP_URL || "http://localhost:3000"}/w/${task.workspaceId}/p/${task.projectId}/t/${task.id}`;

      // payload do template (Etapa 7 vai definir exatamente)
      const payload = {
        kind: t.kind,
        task: { id: task.id, title: task.title, dueAt: task.dueAt },
        cta_url: link
      };

      await enqueueWhatsappTemplate(app, {
        workspaceId: task.workspaceId,
        userId: task.assigneeId,
        projectId: task.projectId,
        taskId: task.id,
        toPhoneE164: pref.phoneE164,
        templateName: "task_reminder_v1",
        payload,
        messageKey
      });
    }
  }

  return { ok: true };
}
