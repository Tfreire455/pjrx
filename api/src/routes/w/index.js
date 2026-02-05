import { workspaceGuard } from "../../middlewares/workspaceGuard.js";

import { workspaceRoutes } from "./workspaces.js";
import { projectRoutes } from "./projects.js";
import { taskRoutes } from "./tasks.js";
import { checklistRoutes } from "./checklists.js";
import { sprintRoutes } from "./sprints.js";
import { milestoneRoutes } from "./milestones.js";
import { commentRoutes } from "./comments.js";
import { notificationRoutes } from "./notifications.js";
import { auditRoutes } from "./audit.js";

export async function workspaceScopedRoutes(app) {
  // tudo que começa com /w/:workspaceId exige auth + membership
  app.register(async function (scope) {
    scope.addHook("preHandler", app.requireAuth);
    scope.addHook("preHandler", workspaceGuard);

    await scope.register(workspaceRoutes);
    await scope.register(projectRoutes);
    await scope.register(taskRoutes);
    await scope.register(checklistRoutes);
    await scope.register(sprintRoutes);
    await scope.register(milestoneRoutes);
    await scope.register(commentRoutes);
    await scope.register(notificationRoutes);
    await scope.register(auditRoutes);
  });
}
