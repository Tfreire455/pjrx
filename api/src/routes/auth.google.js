import crypto from "node:crypto"; // Necessário para o hash igual ao auth.js
import { fail } from "../utils/http.js";

// Função auxiliar igual à do auth.js para manter consistência
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function googleAuthRoutes(app) {
  app.get("/auth/google/callback", async (request, reply) => {
    // 1. Obter Token do Google
    let tokenRes;
    try {
      tokenRes = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    } catch (err) {
      return fail(reply, 400, { message: "Falha ao obter token do Google." });
    }
    
    const googleToken = tokenRes.token.access_token;

    // 2. Obter dados do Usuário no Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${googleToken}` }
    });
    const googleData = await userRes.json();

    if (!googleData.email) {
      return fail(reply, 400, { message: "Google não retornou e-mail." });
    }

    // 3. Buscar ou Criar Usuário no Banco
    let user = await app.prisma.user.findUnique({
      where: { email: googleData.email }
    });

    if (!user) {
      // Cria usuário sem senha (pois veio do Google)
      user = await app.prisma.user.create({
        data: {
          email: googleData.email,
          name: googleData.name || "Usuário Google",
          // avatarUrl: googleData.picture // Descomente se tiver esse campo no banco
        }
      });
    }

    // 4. Gerar Tokens da SUA Aplicação (não do Google)
    // Usa as mesmas funções que o auth.js usa
    const accessToken = app.signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = app.signRefreshToken({ sub: user.id, email: user.email });

    // 5. CRUCIAL: Criar a Sessão no Banco de Dados
    // Sem isso, o /auth/refresh vai falhar sempre.
    await app.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken), // Hash igual ao login normal
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      }
    });

    // 6. Configurar o Cookie de Refresh
    // Isso permite que o endpoint /auth/refresh leia o cookie automaticamente
    reply.setCookie("refresh_token", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    // 7. Redirecionar para o Frontend
    // Nota: Vi no seu código "localhost:3000". Se seu React roda na 5173, ajuste aqui!
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    // Retorna para o React com o Access Token na URL
    return reply.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  });
}