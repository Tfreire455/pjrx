import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  const email = "demo@prjx.app";
  const password = "demo1234";
  const name = "Demo User";

  const passwordHash = await bcrypt.hash(password, 10);

  // upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      avatarUrl: null
    }
  });

  // workspace
  const wsName = "PRJX Demo Workspace";
  const wsSlug = slugify(wsName);

  const workspace = await prisma.workspace.upsert({
    where: { slug: wsSlug },
    update: {},
    create: {
      name: wsName,
      slug: wsSlug,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner"
        }
      }
    }
  });

  // project
  const projectName = "Lançar PRJX v1";
  const projectSlug = slugify(projectName);

  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: { workspaceId: workspace.id, slug: projectSlug }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: projectName,
      slug: projectSlug,
      description: "Projeto demo com tarefas, checklist e prazos.",
      status: "active",
      createdById: user.id,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // checklist template
  const template = await prisma.checklistTemplate.upsert({
    where: {
      workspaceId_name: { workspaceId: workspace.id, name: "Template - PRD Rápido" }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Template - PRD Rápido",
      description: "Checklist base para definir escopo rapidamente",
      items: [
        "Problema e objetivo",
        "Métricas de sucesso",
        "Fluxo principal",
        "Edge cases",
        "Critérios de aceite"
      ],
      createdById: user.id
    }
  });

  // tasks (5)
  const tasksSeed = [
    {
      title: "Definir arquitetura (API + Web + DB)",
      status: "doing",
      priority: "high",
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      checklist: ["Mapear módulos", "Definir tabelas", "Definir rotas"]
    },
    {
      title: "Implementar Auth (register/login/refresh)",
      status: "todo",
      priority: "urgent",
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      checklist: ["JWT access/refresh", "bcrypt", "middleware requireAuth"]
    },
    {
      title: "Kanban no Front (dnd-kit)",
      status: "todo",
      priority: "high",
      dueAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      checklist: ["Colunas", "Drag & drop", "Animações Framer Motion"]
    },
    {
      title: "WhatsApp reminders (só logs por enquanto)",
      status: "todo",
      priority: "medium",
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      checklist: ["Model whatsapp_logs", "message_key idempotente", "endpoint send interno"]
    },
    {
      title: "IA Coprojetista (endpoints base)",
      status: "todo",
      priority: "medium",
      dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      checklist: ["Persistir ai_messages", "Persistir ai_insights", "Schemas JSON"]
    }
  ];

  // limpar tasks do projeto demo (para seed idempotente)
  await prisma.checklistItem.deleteMany({
    where: { checklist: { task: { projectId: project.id } } }
  });
  await prisma.checklist.deleteMany({ where: { task: { projectId: project.id } } });
  await prisma.subtask.deleteMany({ where: { task: { projectId: project.id } } });
  await prisma.taskDependency.deleteMany({
    where: { task: { projectId: project.id } }
  });
  await prisma.task.deleteMany({ where: { projectId: project.id } });

  let pos = 0;
  for (const t of tasksSeed) {
    const task = await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        projectId: project.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        position: pos++,
        dueAt: t.dueAt,
        reporterId: user.id,
        assigneeId: user.id,
        atRisk: false,
        blocked: t.status === "blocked",
        metadata: { source: "seed" }
      }
    });

    // checklist instance para cada task (com template)
    const checklist = await prisma.checklist.create({
      data: {
        workspaceId: workspace.id,
        taskId: task.id,
        templateId: template.id,
        title: "Checklist da tarefa"
      }
    });

    await prisma.checklistItem.createMany({
      data: t.checklist.map((content, idx) => ({
        workspaceId: workspace.id,
        checklistId: checklist.id,
        content,
        position: idx,
        done: false
      }))
    });
  }

  // notificação demo
  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      type: "system",
      title: "PRJX pronto ✅",
      body: "Seed aplicado: workspace, projeto e tarefas criadas.",
      data: { projectId: project.id }
    }
  });

  console.log("✅ Seed concluído!");
  console.log("Demo credentials:");
  console.log("  email:", email);
  console.log("  password:", password);
  console.log("Workspace:", workspace.slug);
  console.log("Project:", project.slug);
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
