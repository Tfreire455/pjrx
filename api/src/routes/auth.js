import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { z } from "zod";
import { ok, fail } from "../utils/http.js";
import { parseBody } from "../utils/validation.js";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10).optional()
});

function hashToken(token) {
  // hash estável para guardar refresh no banco (não salvar puro)
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function authRoutes(app) {
  // POST /auth/register
  app.post("/auth/register", async (request, reply) => {
    const parsed = parseBody(RegisterSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { email, password, name } = parsed.data;

    const exists = await app.prisma.user.findUnique({ where: { email } });
    if (exists) {
      return fail(reply, 409, { code: "EMAIL_IN_USE", message: "Email já está em uso." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await app.prisma.user.create({
      data: { email, name: name || null, passwordHash }
    });

    // access + refresh
    const accessToken = app.signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = app.signRefreshToken({ sub: user.id, email: user.email });

    // guardar sessão (refresh hash)
    await app.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return ok(reply, {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      tokens: { accessToken, refreshToken }
    }, 201);
  });

  // POST /auth/login
  app.post("/auth/login", async (request, reply) => {
    const parsed = parseBody(LoginSchema, request.body);
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const { email, password } = parsed.data;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return fail(reply, 401, { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return fail(reply, 401, { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const accessToken = app.signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = app.signRefreshToken({ sub: user.id, email: user.email });

    await app.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    return ok(reply, {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      tokens: { accessToken, refreshToken }
    });
  });

  // POST /auth/refresh
  app.post("/auth/refresh", async (request, reply) => {
    const parsed = parseBody(RefreshSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    // aceita via body OU cookie (se você quiser usar no front depois)
    const tokenFromBody = parsed.data.refreshToken;
    const tokenFromCookie = request.cookies?.refresh_token;
    const refreshToken = tokenFromBody || tokenFromCookie;

    if (!refreshToken) {
      return fail(reply, 400, { code: "MISSING_REFRESH", message: "Refresh token ausente." });
    }

    let payload;
    try {
      payload = app.verifyRefreshToken(refreshToken);
    } catch {
      return fail(reply, 401, { code: "INVALID_REFRESH", message: "Refresh inválido." });
    }

    const userId = payload.sub;
    const hashed = hashToken(refreshToken);

    const session = await app.prisma.authSession.findFirst({
      where: {
        userId,
        refreshTokenHash: hashed,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return fail(reply, 401, { code: "REFRESH_REVOKED", message: "Sessão expirada ou revogada." });
    }

    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(reply, 401, { code: "UNAUTHORIZED", message: "Usuário inválido." });

    const newAccessToken = app.signAccessToken({ sub: user.id, email: user.email });

    return ok(reply, {
      tokens: { accessToken: newAccessToken }
    });
  });

  // POST /auth/logout (revoga refresh atual)
  app.post("/auth/logout", async (request, reply) => {
    const parsed = parseBody(RefreshSchema, request.body || {});
    if (!parsed.ok) return fail(reply, 400, parsed.error);

    const tokenFromBody = parsed.data.refreshToken;
    const tokenFromCookie = request.cookies?.refresh_token;
    const refreshToken = tokenFromBody || tokenFromCookie;

    if (!refreshToken) {
      return ok(reply, { message: "Logout ok." });
    }

    try {
      const payload = app.verifyRefreshToken(refreshToken);
      const userId = payload.sub;
      const hashed = hashToken(refreshToken);

      await app.prisma.authSession.updateMany({
        where: { userId, refreshTokenHash: hashed, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // opcional: limpar cookie
      reply.clearCookie("refresh_token", { path: "/" });

      return ok(reply, { message: "Logout ok." });
    } catch {
      return ok(reply, { message: "Logout ok." });
    }
  });

  // GET /auth/me
  app.get("/auth/me", { preHandler: app.requireAuth }, async (request, reply) => {
    const userId = request.user?.sub;
    const user = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true }
    });

    if (!user) return fail(reply, 404, { code: "NOT_FOUND", message: "Usuário não encontrado." });

    return ok(reply, { user });
  });
}
