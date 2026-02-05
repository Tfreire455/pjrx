import fp from "fastify-plugin";
import PgBoss from "pg-boss";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// aqui: /api/prisma/certs (a partir de /api/src/plugins)
const certsDir = path.resolve(__dirname, "../../prisma/certs");

export default fp(async function bossPlugin(app) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    app.log.warn("DATABASE_URL ausente — pg-boss não iniciado.");
    return;
  }

  const boss = new PgBoss({
    connectionString: databaseUrl,
    schema: "pgboss",
    migrate: true,
    logger: app.log,

    ssl: {
      ca: fs.readFileSync(path.join(certsDir, "ca-certificate.crt"), "utf8"),
      cert: fs.readFileSync(path.join(certsDir, "cert.pem"), "utf8"),
      key: fs.readFileSync(path.join(certsDir, "key.pem"), "utf8"), // ou "private-key.key"
      rejectUnauthorized: true,
    },
  });

  app.decorate("boss", boss);

  app.addHook("onClose", async () => {
    try {
      if (app.boss) await app.boss.stop();
    } catch (e) {
      app.log.warn({ err: e }, "boss.stop failed");
    }
  });

  await boss.start();
  app.log.info("pg-boss started ✅");
});
