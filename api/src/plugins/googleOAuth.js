import fp from "fastify-plugin";
import oauth2 from "@fastify/oauth2";

export default fp(async function googleOAuthPlugin(app) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUri = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUri) {
    app.log.warn("Google OAuth não configurado (GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL).");
    return;
  }

  await app.register(oauth2, {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: { id: clientId, secret: clientSecret },
      auth: oauth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: "/auth/google",
    callbackUri
  });
});
