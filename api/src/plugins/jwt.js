import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

function assertEnv(app, key) {
  if (!process.env[key]) app.log.warn(`${key} não definido no .env`);
}

export default fp(async function jwtPlugin(app) {
  assertEnv(app, "JWT_ACCESS_SECRET");
  assertEnv(app, "JWT_REFRESH_SECRET");

  // usamos o fastify-jwt com access secret por padrão
  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || "DEV_ONLY_CHANGE_ME_ACCESS"
  });

  app.decorate("signAccessToken", function signAccessToken(payload) {
    // 15 min
    return app.jwt.sign(payload, { expiresIn: "15m" });
  });

  app.decorate("signRefreshToken", function signRefreshToken(payload) {
    // refresh com outro secret
    return app.jwt.sign(payload, {
      expiresIn: "30d",
      secret: process.env.JWT_REFRESH_SECRET || "DEV_ONLY_CHANGE_ME_REFRESH"
    });
  });

  app.decorate("verifyRefreshToken", function verifyRefreshToken(token) {
    return app.jwt.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET || "DEV_ONLY_CHANGE_ME_REFRESH"
    });
  });

  app.decorate("requireAuth", async function requireAuth(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Token inválido ou ausente." }
      });
    }
  });
});
