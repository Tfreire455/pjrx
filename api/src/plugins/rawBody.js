import fp from "fastify-plugin";

export default fp(async function rawBodyPlugin(app) {
  // guarda rawBody apenas no webhook do whatsapp (para assinatura)
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    // body aqui é string
    req.rawBody = body;
    try {
      const json = body ? JSON.parse(body) : {};
      done(null, json);
    } catch (e) {
      done(e, undefined);
    }
  });
});
