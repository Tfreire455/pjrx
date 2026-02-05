import "dotenv/config";
import crypto from "node:crypto";
import Fastify from "fastify";

import helmetPlugin from "./plugins/helmet.js";
import corsPlugin from "./plugins/cors.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import jwtPlugin from "./plugins/jwt.js";
import prismaPlugin from "./plugins/prisma.js";
import rbacPlugin from "./plugins/rbac.js";
import cookiesPlugin from "./plugins/cookies.js";
import googleOAuthPlugin from "./plugins/googleOAuth.js";
import bossPlugin from "./plugins/boss.js"
import rawBodyPlugin from "./plugins/rawBody.js";
import { registerJobs } from "./jobs/index.js"

// Rotas
import { workspaceRootRoutes } from "./routes/w/workspaces.root.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { googleAuthRoutes } from "./routes/auth.google.js";
import { workspaceScopedRoutes } from "./routes/w/index.js";
import { whatsappRoutes } from "./routes/whatsapp.js";
import { aiRoutes } from "./routes/ai.js";
import { rulesRoutes } from "./routes/rules.js"

const PORT = Number(process.env.PORT || 3333);
const HOST = process.env.HOST || "0.0.0.0";

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
        : undefined
  }
});

app.addHook("onRequest", async (req) => {
  if (!req.id) req.id = crypto.randomUUID();
});

// 1. Plugins (A ordem importa: Cookies/JWT antes das rotas protegidas)
await app.register(helmetPlugin);
await app.register(corsPlugin);
await app.register(rateLimitPlugin);
await app.register(cookiesPlugin); // Cookies antes do JWT (se usar cookies pra refresh)
await app.register(jwtPlugin);
await app.register(googleOAuthPlugin);
await app.register(prismaPlugin);
await app.register(rbacPlugin);
await app.register(bossPlugin);
await app.register(rawBodyPlugin);

// 2. Rotas Públicas e de Autenticação
await app.register(healthRoutes);
await app.register(authRoutes);       // Login normal
await app.register(googleAuthRoutes); // Login Google (Aquele com o Redirect)

// 3. Rotas de Workspaces
// 3.1. Rota Raiz: Lista os workspaces (/workspaces) e Criação
await app.register(workspaceRootRoutes);

// 3.2. Rotas Escopadas: Tudo que acontece DENTRO de um workspace específico
// IMPORTANTE: Adicionamos o prefixo aqui para o "workspaceRoutes" conseguir ler o ID
await app.register(workspaceScopedRoutes, { prefix: "/w/:workspaceId" });

// 4. Funcionalidades extras
await app.register(whatsappRoutes);
await app.register(aiRoutes);
await app.register(rulesRoutes);

// 5. Jobs em background
await registerJobs(app);

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();