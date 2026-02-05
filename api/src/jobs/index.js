import { scheduleTaskRemindersJob } from "./schedule_task_reminders.js";
import { projectStaleDetectorJob } from "./project_stale_detector.js";
import { weeklyAiReportJob } from "./weekly_ai_report.js";
import { ruleEngineTickJob } from "./rule_engine_tick.js";
import { whatsappSenderTickJob } from "./whatsapp_sender_tick.js";


export async function registerJobs(app) {
  if (!app.boss) {
    app.log.warn("pg-boss não disponível — jobs não registrados.");
    return;
  }

  const boss = app.boss;

  // 1) Cria filas SEQUENCIALMENTE (evita deadlock)
  const queues = [
    "schedule_task_reminders",
    "project_stale_detector",
    "weekly_ai_report",
    "rule_engine_tick",
    "whatsapp_sender_tick"
  ];

  for (const q of queues) {
    await boss.createQueue(q);
  }

  // 2) Workers
  boss.work("schedule_task_reminders", { teamSize: 2 }, (job) =>
    scheduleTaskRemindersJob(app, job)
  );

  boss.work("project_stale_detector", { teamSize: 1 }, (job) =>
    projectStaleDetectorJob(app, job)
  );

  boss.work("weekly_ai_report", { teamSize: 1 }, (job) =>
    weeklyAiReportJob(app, job)
  );

  boss.work("rule_engine_tick", { teamSize: 1 }, (job) =>
    ruleEngineTickJob(app, job)
  );

  boss.work("whatsapp_sender_tick", { teamSize: 2 }, (job) =>
    whatsappSenderTickJob(app, job)
  );


  

  // 3) Schedules
  await boss.schedule("schedule_task_reminders", "*/5 * * * *", null, {
    retryLimit: 10,
    retryDelay: 60,
    retryBackoff: true,
    expireInHours: 1,
  });

  await boss.schedule("project_stale_detector", "10 3 * * *", { staleDays: 7 }, {
    retryLimit: 10,
    retryDelay: 300,
    retryBackoff: true,
    expireInHours: 2,
  });

  await boss.schedule("weekly_ai_report", "0 8 * * 1", { lookbackDays: 7 }, {
    retryLimit: 10,
    retryDelay: 300,
    retryBackoff: true,
    expireInHours: 4,
  });

  await boss.schedule("rule_engine_tick", "*/10 * * * *", null, {
    retryLimit: 10,
    retryDelay: 60,
    retryBackoff: true,
    expireInHours: 1,
  });

  await app.boss.schedule("whatsapp_sender_tick", "* * * * *", null, {
    retryLimit: 10,
    retryDelay: 60,
    retryBackoff: true,
    expireInHours: 1
  });


  app.log.info("Jobs registrados e schedules ativos ✅");
}
