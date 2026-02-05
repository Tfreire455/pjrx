import fp from "fastify-plugin";
import cors from "@fastify/cors";

export default fp(async function corsPlugin(app) {
  const origin = process.env.APP_URL || true;

  await app.register(cors, {
    origin,
    credentials: true
  });
});
