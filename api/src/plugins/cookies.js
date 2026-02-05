import fp from "fastify-plugin";
import cookie from "@fastify/cookie";

export default fp(async function cookiesPlugin(app) {
  // oauth2 já pode ter registrado cookie
  if (app.hasDecorator("serializeCookie")) return;

  await app.register(cookie, {
    hook: "onRequest",
    // secret: process.env.COOKIE_SECRET,
  });
});
