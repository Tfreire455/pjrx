import { ok, fail } from "../../utils/http.js";
import { parseBody } from "../../utils/validation.js";
import { CreateWorkspaceSchema } from "../../schemas/workspaces.js";
import { makeSlug } from "../../services/ids.js";
import { audit } from "../../services/audit.js";

export async function workspaceRootRoutes(app) {
  // Garante que o user está logado (JWT válido)
  app.addHook("preHandler", app.requireAuth);

  // GET /workspaces -> Lista os workspaces do usuário
  app.get("/workspaces", async (request, reply) => {
    const userId = request.user.sub;

    const memberships = await app.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { select: { id: true, name: true, slug: true, ownerId: true, createdAt: true } } },
      orderBy: { createdAt: "desc" }
    });

    // Mapeia para retornar o objeto do workspace + o cargo (role) do usuário nele
    const list = memberships.map((m) => ({ ...m.workspace, role: m.role }));
    
    return ok(reply, { data: list }); // Ajuste para bater com o pickDefaultWorkspace do front
  });

  // POST /workspaces -> Cria novo workspace
  app.post("/workspaces", async (request, reply) => {
    const parsed = parseBody(CreateWorkspaceSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const userId = request.user.sub;
    const slug = parsed.data.slug ? makeSlug(parsed.data.slug) : makeSlug(parsed.data.name);

    const exists = await app.prisma.workspace.findUnique({ where: { slug } });
    if (exists) {
      return fail(reply, 409, { code: "SLUG_IN_USE", message: "Slug já está em uso." });
    }

    const workspace = await app.prisma.workspace.create({
      data: {
        name: parsed.data.name,
        slug,
        ownerId: userId,
        members: { create: { userId, role: "owner" } }
      }
    });

    await audit(app, {
      workspaceId: workspace.id,
      actorId: userId,
      action: "workspace.create",
      entityType: "Workspace",
      entityId: workspace.id,
      before: null,
      after: workspace,
      request
    });

    return ok(reply, { workspace }, 201);
  });
}