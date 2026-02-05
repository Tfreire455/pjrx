import { runRules } from "../rules/engine.js";

export async function ruleEngineTickJob(app, job) {
  const workspaces = await app.prisma.workspace.findMany({ select: { id: true } });

  for (const ws of workspaces) {
    await runRules(app, { workspaceId: ws.id, actorId: null, onlyKey: null, dryRun: false });
  }

  return { ok: true, workspaces: workspaces.length };
}
