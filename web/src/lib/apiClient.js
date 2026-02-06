import { getAccessToken, setAccessToken, clearAccessToken } from "./session";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3333";

let refreshing = null;

async function refreshToken() {
  if (refreshing) return refreshing;

  refreshing = fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include" // Importante para enviar cookies
  })
    .then(async (res) => {
      const text = await res.text();
      // Tenta fazer o parse, mas se falhar, retorna null
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        // Se o refresh falhou (400, 401, etc), a sessão morreu.
        throw new Error((json && json.error && json.error.message) || "Sessão expirada.");
      }

// Tenta pegar dentro de data.tokens OU direto em tokens
const token = json?.data?.tokens?.accessToken || json?.tokens?.accessToken;
      if (!token) throw new Error("Refresh sem access token.");

      setAccessToken(token);
      return token;
    })
    .catch((err) => {
      // Se deu qualquer erro no refresh (rede ou validação), limpamos tudo.
      clearAccessToken();
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function apiClient(path, { method = "GET", body, headers } = {}, { retry = true } = {}) {
  const token = getAccessToken();
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    credentials: "include",
    body: hasBody ? JSON.stringify(body) : undefined
  });

  // Se der 401 (Não autorizado) e for permitido tentar de novo (retry = true)
  if (res.status === 401 && retry) {
    try {
      // Tentamos renovar o token
      await refreshToken();
      // Se passou daqui, o token foi renovado. Chamamos a função recursivamente.
      return apiClient(path, { method, body, headers }, { retry: false });
    } catch (error) {
      // SE O REFRESH FALHAR:
      // O token já foi limpo dentro do refreshToken(), mas o throw aqui
      // garante que o React Query ou o frontend receba o erro e pare de tentar.
      clearAccessToken();
      throw error;
    }
  }

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}
